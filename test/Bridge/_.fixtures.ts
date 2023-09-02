import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'
import { Bridge__factory, ZONFT } from '../../typechain-types'
import { deployNFT } from '../NFT/_'

export async function deployBridge() {
	const Bridge = (await ethers.getContractFactory('Bridge')) as Bridge__factory

	const source = await Bridge.deploy()
	const target = await Bridge.deploy()

	await source.deployed()
	await target.deployed()

	const sourceNetworkId = 101 // LZ network ID - ethereum
	const targetNetworkId = 126 // LZ network ID - moonbeam

	await source.setTrustedRemote(targetNetworkId, target.address)
	await target.setTrustedRemote(sourceNetworkId, source.address)

	const signers = await ethers.getSigners()

	return { source, target, sourceNetworkId, targetNetworkId, signers }
}

export async function deployNFTWithMint() {
	const nft = await deployNFT()
	const signers = await ethers.getSigners()
	const owner = signers[0]
	await nft.mint(owner.address, 1)
	return { nft, signers, owner }
}

// First time bridging collection
// from ethereum (source) to moonbeam (target)
// Deploys new copy contract on target chain
export async function simpleBridgeScenario(txReturnType: TxReturnType = TxReturnType.awaited) {
	const { source, target, targetNetworkId } = await loadFixture(deployBridge)
	const { nft, signers, owner } = await loadFixture(deployNFTWithMint)

	const tokenId = 1
	await nft.approve(source.address, tokenId)

	let tx

	switch (txReturnType) {
		case TxReturnType.awaited:
			tx = await source.bridge(nft.address, tokenId, targetNetworkId)
			break
		case TxReturnType.unawaited:
			tx = source.bridge(nft.address, tokenId, targetNetworkId)
			break
		case TxReturnType.arrowFunction:
			tx = () => source.bridge(nft.address, tokenId, targetNetworkId)
	}

	const copyAddr = await target.copy(nft.address)

	const zONFT = await ethers.getContractFactory('zONFT')
	const copy = zONFT.attach(copyAddr) as ZONFT

	return { source, target, nft, copy, tx, signers, owner, tokenId, targetNetworkId }
}

export enum TxReturnType {
	awaited,
	unawaited,
	arrowFunction,
}
// Bridging back NFT to original chain
// from moonbeam (source) to ethereum (target)
// Burns NFT on source (moon) and unlocks original on target (eth)
export async function bridgeBackScenario(txReturnType: TxReturnType = TxReturnType.awaited) {
	// eslint-disable-next-line prefer-const
	let { source, target, targetNetworkId, sourceNetworkId } = await loadFixture(deployBridge)

	const { nft, signers, owner } = await loadFixture(deployNFTWithMint)

	const tokenId = 1
	await nft.approve(source.address, tokenId)

	await source.bridge(nft.address, tokenId, targetNetworkId)

	const copyAddr = await target.copy(nft.address)

	const zONFT = await ethers.getContractFactory('zONFT')
	const copy = zONFT.attach(copyAddr) as ZONFT

	// Reversed flow
	target = [source, (source = target)][0]
	targetNetworkId = [sourceNetworkId, (sourceNetworkId = targetNetworkId)][0]

	let tx

	switch (txReturnType) {
		case TxReturnType.awaited:
			tx = await source.bridge(copy.address, tokenId, targetNetworkId)
			break
		case TxReturnType.unawaited:
			tx = source.bridge(copy.address, tokenId, targetNetworkId)
			break
		case TxReturnType.arrowFunction:
			tx = () => source.bridge(copy.address, tokenId, targetNetworkId)
	}

	return { source, target, nft, copy, tx, signers, owner, tokenId, targetNetworkId }
}
