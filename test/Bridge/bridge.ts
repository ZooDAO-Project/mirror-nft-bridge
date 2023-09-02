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

export const bridge = function () {
	it(`locks user's NFT on contract`, async function () {
		const { source, targetNetworkId } = await loadFixture(deployBridge)
		const { nft, signers } = await loadFixture(deployNFTWithMint)

		const tokenId = 1
		await nft.approve(source.address, tokenId)

		const tx = () => source.bridge(nft.address, tokenId, targetNetworkId)
		await expect(tx).to.changeTokenBalances(nft, [signers[0], source], [-1, 1])
	})

	it(`doesn't lock without approve`, async function () {
		const { source, targetNetworkId } = await loadFixture(deployBridge)
		const { nft } = await loadFixture(deployNFTWithMint)

		const tokenId = 1
		const tx = source.bridge(nft.address, tokenId, targetNetworkId)
		await expect(tx).to.be.revertedWith('ERC721: caller is not token owner or approved')
	})

	it(`Sends message with params (collectionAddr, name, symbol, tokenId, owner) to another bridge contract`, async function () {
		const { source, targetNetworkId, signers } = await loadFixture(deployBridge)
		const { nft } = await loadFixture(deployNFTWithMint)

		const tokenId = 1

		await nft.approve(source.address, tokenId)

		const tokenURI = await nft.tokenURI(tokenId)
		const tx = source.bridge(nft.address, tokenId, targetNetworkId)

		await expect(tx)
			.to.emit(source, 'MessageSend')
			.withArgs(nft.address, await nft.name(), await nft.symbol(), tokenId, tokenURI, signers[0].address)
	})

	it(`Sends message to bridge contract on target network (mock logic atm, same network)`, async function () {
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

	it(`records that collection address exist on current chain`, async function () {
		const { source, targetNetworkId } = await loadFixture(deployBridge)
		const { nft } = await loadFixture(deployNFTWithMint)

		const tokenId = 1

		await nft.approve(source.address, tokenId)
		await source.bridge(nft.address, tokenId, targetNetworkId)

		expect(await source.isCollectionContractExistOnCurrentNetwork(nft.address)).to.be.true
	})

	it(`should not record copy address for original contract on original chain`, async function () {
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

	it(`multiple bridges to check gas expenditure for first and following tx hardness`, async function () {
		const { source, target, targetNetworkId } = await loadFixture(deployBridge)
		const { nft, signers } = await loadFixture(deployNFTWithMint)

		const owner = signers[0].address
		const tokenId = 1

		await nft.mint(owner, 1)
		await nft.mint(owner, 1)
		await nft.mint(owner, 1)

		await nft.approve(source.address, tokenId)
		await nft.approve(source.address, tokenId + 1)
		await nft.approve(source.address, tokenId + 2)
		await nft.approve(source.address, tokenId + 3)

		await source.bridge(nft.address, tokenId, targetNetworkId)
		await source.bridge(nft.address, tokenId + 1, targetNetworkId)
		await source.bridge(nft.address, tokenId + 2, targetNetworkId)
		await source.bridge(nft.address, tokenId + 3, targetNetworkId)
	})
}
