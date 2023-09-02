import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'
import { Mirror, LZEndpointMock__factory, NFT, ONFT721, Mirror__factory, ReflectedNFT } from '../../typechain-types'
import { deployNFT } from '../NFT/_'
import { formatUnits } from 'ethers/lib/utils'

export async function deployBridge() {
	const Mirror = (await ethers.getContractFactory('Mirror')) as Mirror__factory
	const LzEndpointMock = (await ethers.getContractFactory('LZEndpointMock')) as LZEndpointMock__factory

	const sourceNetworkId = 101 // LZ network ID - ethereum
	const targetNetworkId = 126 // LZ network ID - moonbeam

	const sourceLzEndpoint = await LzEndpointMock.deploy(sourceNetworkId)
	const targetLzEndpoint = await LzEndpointMock.deploy(targetNetworkId)

	const signers = await ethers.getSigners()
	const feeReceiver = signers[9].address
	const feeAmount = 1000000000000000
	const source = await Mirror.deploy(sourceLzEndpoint.address, feeAmount, feeReceiver)
	const target = await Mirror.deploy(targetLzEndpoint.address, feeAmount, feeReceiver)

	await source.deployed()
	await target.deployed()

	await sourceLzEndpoint.setDestLzEndpoint(target.address, targetLzEndpoint.address)
	await targetLzEndpoint.setDestLzEndpoint(source.address, sourceLzEndpoint.address)

	await source.setTrustedRemoteAddress(targetNetworkId, target.address)
	await target.setTrustedRemoteAddress(sourceNetworkId, source.address)

	return {
		source,
		target,
		sourceLzEndpoint,
		targetLzEndpoint,
		sourceNetworkId,
		targetNetworkId,
		signers,
		feeReceiver,
		feeAmount,
	}
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

	await source.changeCollectionEligibility(nft.address, true)

	const tokenId = 1
	await nft.approve(source.address, tokenId)

	let tx

	const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(nft, [tokenId], targetNetworkId, source, false)

	switch (txReturnType) {
		case TxReturnType.awaited:
			tx = await source.createReflection(
				nft.address,
				[tokenId],
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
				[tokenId],
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
					[tokenId],
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

	const ReflectedNFT = await ethers.getContractFactory('ReflectedNFT')
	const reflection = ReflectedNFT.attach(reflectionAddr) as ReflectedNFT

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
		fees,
		adapterParams,
	}
}

export enum TxReturnType {
	awaited,
	unawaited,
	arrowFunction,
}

export async function getAdapterParamsAndFeesAmount(
	nft: ONFT721 | NFT,
	tokenIds: number[],
	targetNetworkId: number,
	sourceBridge: Mirror,
	isCopyDeployedOrBridgeToOriginal: boolean
) {
	const RecommendedGas = isCopyDeployedOrBridgeToOriginal
		? 350000 + 100000 * tokenIds.length
		: 2000000 + 100000 * tokenIds.length
	const adapterParams = ethers.utils.solidityPack(['uint16', 'uint256'], [1, RecommendedGas]) // default adapterParams example

	const tokenURIs: string[] = []

	for (const tokenId of tokenIds) {
		tokenURIs.push(await nft.tokenURI(tokenId))
	}

	// const abi = new ethers.utils.AbiCoder()
	// const payload = abi.encode(
	// 	['address', 'string', 'string', 'uint256', 'string', 'address'],
	// 	[nft.address, await nft.name(), await nft.symbol(), tokenIds, tokenURIs, owner.address]
	// )

	const fees = await sourceBridge.estimateSendBatchFee(nft.address, tokenIds, targetNetworkId, false, adapterParams)

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

	await source.changeCollectionEligibility(nft.address, true)

	const tokenId = 1
	await nft.approve(source.address, tokenId)

	const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(nft, [tokenId], targetNetworkId, source, false)

	await source.createReflection(
		nft.address,
		[tokenId],
		targetNetworkId,
		owner.address,
		ethers.constants.AddressZero,
		adapterParams,
		{ value: fees[0] }
	)

	const reflectionAddr = await target.reflection(nft.address)

	const ReflectedNFT = await ethers.getContractFactory('ReflectedNFT')
	const reflection = ReflectedNFT.attach(reflectionAddr) as ReflectedNFT

	// Reversed flow
	target = [source, (source = target)][0]
	targetLzEndpoint = [sourceLzEndpoint, (sourceLzEndpoint = targetLzEndpoint)][0]
	targetNetworkId = [sourceNetworkId, (sourceNetworkId = targetNetworkId)][0]

	let tx

	const bridgeBackParams = await getAdapterParamsAndFeesAmount(nft, [tokenId], targetNetworkId, source, true)

	switch (txReturnType) {
		case TxReturnType.awaited:
			tx = await source.createReflection(
				reflection.address,
				[tokenId],
				targetNetworkId,
				owner.address,
				ethers.constants.AddressZero,
				bridgeBackParams.adapterParams,
				{
					value: bridgeBackParams.fees[0],
				}
			)
			break
		case TxReturnType.unawaited:
			tx = source.createReflection(
				reflection.address,
				[tokenId],
				targetNetworkId,
				owner.address,
				ethers.constants.AddressZero,
				bridgeBackParams.adapterParams,
				{
					value: bridgeBackParams.fees[0],
				}
			)
			break
		case TxReturnType.arrowFunction:
			tx = () =>
				source.createReflection(
					reflection.address,
					[tokenId],
					targetNetworkId,
					owner.address,
					ethers.constants.AddressZero,
					bridgeBackParams.adapterParams,
					{
						value: bridgeBackParams.fees[0],
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

// First time bridging collection
// from ethereum (source) to moonbeam (target)
// Deploys new reflection contract on target chain
export async function simpleBridgeMultipleScenario(
	txReturnType: TxReturnType = TxReturnType.awaited,
	NFTsToBridge = 3
) {
	const { source, target, targetNetworkId, sourceLzEndpoint, targetLzEndpoint } = await loadFixture(deployBridge)
	const { nft, signers, owner } = await loadFixture(deployNFTWithMint)

	await source.changeCollectionEligibility(nft.address, true)

	await nft.mint(owner.address, NFTsToBridge - 1)

	const tokenId = 1
	const tokenIds: number[] = []

	for (let i = 0; i < NFTsToBridge; i++) {
		tokenIds.push(i + 1)
	}

	await nft.setApprovalForAll(source.address, true)

	let tx

	const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(nft, tokenIds, targetNetworkId, source, false)

	switch (txReturnType) {
		case TxReturnType.awaited:
			tx = await source.createReflection(
				nft.address,
				tokenIds,
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
				tokenIds,
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
					tokenIds,
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

	const ReflectedNFT = await ethers.getContractFactory('ReflectedNFT')
	const reflection = ReflectedNFT.attach(reflectionAddr) as ReflectedNFT

	return {
		source,
		target,
		nft,
		reflection,
		tx,
		signers,
		owner,
		tokenId,
		tokenIds,
		targetNetworkId,
		sourceLzEndpoint,
		targetLzEndpoint,
	}
}

// Bridging back NFT to original chain
// from moonbeam (source) to ethereum (target)
// Burns NFT on source (moon) and unlocks original on target (eth)
export async function bridgeBackMultipleScenario(
	txReturnType: TxReturnType = TxReturnType.awaited,
	NFTsToBridgeBack = 3
) {
	// eslint-disable-next-line prefer-const
	let { source, target, targetNetworkId, sourceLzEndpoint, targetLzEndpoint, sourceNetworkId } = await loadFixture(
		deployBridge
	)

	const { nft, signers, owner } = await loadFixture(deployNFTWithMint)

	await source.changeCollectionEligibility(nft.address, true)

	await nft.mint(owner.address, NFTsToBridgeBack - 1) // 1 already minted in deployNFTWithMint fixture

	const tokenId = 1

	const tokenIds: number[] = []

	for (let i = 0; i < NFTsToBridgeBack; i++) {
		tokenIds.push(i + 1)
	}

	await nft.setApprovalForAll(source.address, true)

	const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(nft, tokenIds, targetNetworkId, source, false)

	await source.createReflection(
		nft.address,
		tokenIds,
		targetNetworkId,
		owner.address,
		ethers.constants.AddressZero,
		adapterParams,
		{ value: fees[0] }
	)

	const reflectionAddr = await target.reflection(nft.address)

	const ReflectedNFT = await ethers.getContractFactory('ReflectedNFT')
	const reflection = ReflectedNFT.attach(reflectionAddr) as ReflectedNFT

	// Reversed flow
	target = [source, (source = target)][0]
	targetLzEndpoint = [sourceLzEndpoint, (sourceLzEndpoint = targetLzEndpoint)][0]
	targetNetworkId = [sourceNetworkId, (sourceNetworkId = targetNetworkId)][0]

	let tx

	const bridgeBackParams = await getAdapterParamsAndFeesAmount(nft, tokenIds, targetNetworkId, source, true)

	switch (txReturnType) {
		case TxReturnType.awaited:
			tx = await source.createReflection(
				reflection.address,
				tokenIds,
				targetNetworkId,
				owner.address,
				ethers.constants.AddressZero,
				bridgeBackParams.adapterParams,
				{
					value: bridgeBackParams.fees[0],
				}
			)
			break
		case TxReturnType.unawaited:
			tx = source.createReflection(
				reflection.address,
				tokenIds,
				targetNetworkId,
				owner.address,
				ethers.constants.AddressZero,
				bridgeBackParams.adapterParams,
				{
					value: bridgeBackParams.fees[0],
				}
			)
			break
		case TxReturnType.arrowFunction:
			tx = () =>
				source.createReflection(
					reflection.address,
					tokenIds,
					targetNetworkId,
					owner.address,
					ethers.constants.AddressZero,
					bridgeBackParams.adapterParams,
					{
						value: bridgeBackParams.fees[0],
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
		tokenIds,
		sourceNetworkId,
		targetNetworkId,
		sourceLzEndpoint,
		targetLzEndpoint,
	}
}
