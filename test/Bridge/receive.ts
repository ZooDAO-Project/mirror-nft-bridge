import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { deployBridge } from './_'
import { deployNFT } from '../NFT/_'
import { expect } from 'chai'

async function deployNFTWithMint() {
	const nft = await deployNFT()
	const signers = await ethers.getSigners()
	await nft.mint(signers[0].address, 1)
	return { nft, signers }
}

export const receive = function () {
	it(`deploys new NFT contract for bridged tokens`, async function () {
		const { source, target, targetNetworkId } = await loadFixture(deployBridge)
		const { nft, signers } = await loadFixture(deployNFTWithMint)

		const owner = signers[0].address
		const tokenId = 1

		await nft.approve(source.address, tokenId)
		const tx = source.bridge(nft.address, tokenId, targetNetworkId)
	})

	it(`records copy contract's address`)

	it(`emits MessageReceived event`, async function () {
		const { source, target, targetNetworkId } = await loadFixture(deployBridge)
		const { nft, signers } = await loadFixture(deployNFTWithMint)

		const owner = signers[0].address
		const tokenId = 1
		const tokenURI = await nft.tokenURI(tokenId)

		await nft.approve(source.address, tokenId)
		const tx = source.bridge(nft.address, tokenId, targetNetworkId)

		await expect(tx)
			.to.emit(target, 'MessageReceived')
			.withArgs(nft.address, await nft.name(), await nft.symbol(), tokenId, tokenURI, owner)
	})
}
