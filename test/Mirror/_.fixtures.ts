import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'
import {
	Mirror,
	Bridge__factory,
	LZEndpointMock,
	LZEndpointMock__factory,
	NFT,
	ONFT721,
	ZONFT,
} from '../../typechain-types'
import { deployNFT } from '../NFT/_'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

export async function deployBridge() {
	const Mirror = (await ethers.getContractFactory('Mirror')) as Bridge__factory
	const LzEndpointMock = (await ethers.getContractFactory('LZEndpointMock')) as LZEndpointMock__factory

	const sourceNetworkId = 101 // LZ network ID - ethereum
	const targetNetworkId = 126 // LZ network ID - moonbeam

	const sourceLzEndpoint = await LzEndpointMock.deploy(sourceNetworkId)
	const targetLzEndpoint = await LzEndpointMock.deploy(targetNetworkId)

	const source = await Mirror.deploy(sourceLzEndpoint.address)
	const target = await Mirror.deploy(targetLzEndpoint.address)

	await source.deployed()
	await target.deployed()

	await sourceLzEndpoint.setDestLzEndpoint(target.address, targetLzEndpoint.address)
	await targetLzEndpoint.setDestLzEndpoint(source.address, sourceLzEndpoint.address)

	await source.setTrustedRemoteAddress(targetNetworkId, target.address)
	await target.setTrustedRemoteAddress(sourceNetworkId, source.address)

	const signers = await ethers.getSigners()

	return { source, target, sourceLzEndpoint, targetLzEndpoint, sourceNetworkId, targetNetworkId, signers }
}

export async function deployNFTWithMint() {
	const nft = await deployNFT()
	const signers = await ethers.getSigners()
	const owner = signers[0]
	await nft.mint(owner.address, 1)
	const tokenId = 1
	return { nft, signers, owner, tokenId }
}

// First time bridging collection
// from ethereum (source) to moonbeam (target)
// Deploys new reflection contract on target chain
export async function simpleBridgeScenario(txReturnType: TxReturnType = TxReturnType.awaited) {
	const { source, target, targetNetworkId, sourceLzEndpoint, targetLzEndpoint } = await loadFixture(deployBridge)
	const { nft, signers, owner } = await loadFixture(deployNFTWithMint)

	const tokenId = 1
	await nft.approve(source.address, tokenId)

	let tx

	const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
		nft,
		tokenId,
		owner,
		targetNetworkId,
		source,
		sourceLzEndpoint
	)

	switch (txReturnType) {
		case TxReturnType.awaited:
			tx = await source.createReflection(
				nft.address,
				tokenId,
				targetNetworkId,
				owner.address,
				ethers.constants.AddressZero,
				adapterParams,
				{
					value: fees[0],
				}
			)
			break
		case TxReturnType.unawaited:
			tx = source.createReflection(
				nft.address,
				tokenId,
				targetNetworkId,
				owner.address,
				ethers.constants.AddressZero,
				adapterParams,
				{
					value: fees[0],
				}
			)
			break
		case TxReturnType.arrowFunction:
			tx = () =>
				source.createReflection(
					nft.address,
					tokenId,
					targetNetworkId,
					owner.address,
					ethers.constants.AddressZero,
					adapterParams,
					{
						value: fees[0],
					}
				)
	}

	const reflectionAddr = await target.reflection(nft.address)

	const zONFT = await ethers.getContractFactory('zONFT')
	const reflection = zONFT.attach(reflectionAddr) as ZONFT

	return {
		source,
		target,
		nft,
		reflection,
		tx,
		signers,
		owner,
		tokenId,
		targetNetworkId,
		sourceLzEndpoint,
		targetLzEndpoint,
	}
}

export enum TxReturnType {
	awaited,
	unawaited,
	arrowFunction,
}

export async function getAdapterParamsAndFeesAmount(
	nft: ONFT721 | NFT,
	tokenId: number,
	owner: SignerWithAddress,
	targetNetworkId: number,
	sourceBridge: Mirror,
	lzEndpoint: LZEndpointMock
) {
	const RecommendedGas = '2000000'
	const adapterParams = ethers.utils.solidityPack(['uint16', 'uint256'], [1, RecommendedGas]) // default adapterParams example
	const abi = new ethers.utils.AbiCoder()

	const payload = abi.encode(
		['address', 'string', 'string', 'uint256', 'string', 'address'],
		[nft.address, await nft.name(), await nft.symbol(), tokenId, await nft.tokenURI(tokenId), owner.address]
	)

	const fees = await lzEndpoint.estimateFees(targetNetworkId, sourceBridge.address, payload, false, adapterParams)

	return { fees, adapterParams }
}
// Bridging back NFT to original chain
// from moonbeam (source) to ethereum (target)
// Burns NFT on source (moon) and unlocks original on target (eth)
export async function bridgeBackScenario(txReturnType: TxReturnType = TxReturnType.awaited) {
	// eslint-disable-next-line prefer-const
	let { source, target, targetNetworkId, sourceLzEndpoint, targetLzEndpoint, sourceNetworkId } = await loadFixture(
		deployBridge
	)

	const { nft, signers, owner } = await loadFixture(deployNFTWithMint)

	const tokenId = 1
	await nft.approve(source.address, tokenId)

	const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
		nft,
		tokenId,
		owner,
		targetNetworkId,
		source,
		sourceLzEndpoint
	)

	await source.createReflection(
		nft.address,
		tokenId,
		targetNetworkId,
		owner.address,
		ethers.constants.AddressZero,
		adapterParams,
		{ value: fees[0] }
	)

	const reflectionAddr = await target.reflection(nft.address)

	const zONFT = await ethers.getContractFactory('zONFT')
	const reflection = zONFT.attach(reflectionAddr) as ZONFT

	// Reversed flow
	target = [source, (source = target)][0]
	targetLzEndpoint = [sourceLzEndpoint, (sourceLzEndpoint = targetLzEndpoint)][0]
	targetNetworkId = [sourceNetworkId, (sourceNetworkId = targetNetworkId)][0]

	let tx

	switch (txReturnType) {
		case TxReturnType.awaited:
			tx = await source.createReflection(
				reflection.address,
				tokenId,
				targetNetworkId,
				owner.address,
				ethers.constants.AddressZero,
				adapterParams,
				{
					value: fees[0],
				}
			)
			break
		case TxReturnType.unawaited:
			tx = source.createReflection(
				reflection.address,
				tokenId,
				targetNetworkId,
				owner.address,
				ethers.constants.AddressZero,
				adapterParams,
				{
					value: fees[0],
				}
			)
			break
		case TxReturnType.arrowFunction:
			tx = () =>
				source.createReflection(
					reflection.address,
					tokenId,
					targetNetworkId,
					owner.address,
					ethers.constants.AddressZero,
					adapterParams,
					{
						value: fees[0],
					}
				)
	}

	return {
		source,
		target,
		nft,
		reflection,
		tx,
		signers,
		owner,
		tokenId,
		sourceNetworkId,
		targetNetworkId,
		sourceLzEndpoint,
		targetLzEndpoint,
	}
}
