import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { NFT, NFT__factory } from '../../typechain-types'

export async function deployNFT(name = 'ZooDAO Mocks', symbol = 'ZDMK'): Promise<NFT> {
	const NFT = (await ethers.getContractFactory('NFT')) as NFT__factory
	const nft = await NFT.deploy(name, symbol)
	await nft.deployed()
	return nft
}

describe('zONFT', function () {
	it('deploys', async function () {
		const nft = await loadFixture(deployNFT)
		expect(nft).not.to.be.undefined
		expect(nft.address.length).to.be.eq(42)
	})

	it('mint tokens', async function () {
		const nft = await loadFixture(deployNFT)
		const signers = await ethers.getSigners()

		const mint = () => nft.mint(signers[1].address, 1)

		await expect(mint).to.changeTokenBalance(nft, signers[1], 1)
	})

	it('tokens have URI', async function () {
		const nft = await loadFixture(deployNFT)
		const signers = await ethers.getSigners()

		await nft.mint(signers[1].address, 1)

		const uri = await nft.tokenURI(1)
		expect(uri).to.be.eq('https://ipfs.io/ipfs/QmTcsJujMBvRQL3gR6TeT4CBfUFayQScLYSKdViyCki7vR/1.gif')
	})

	it('tokens can be transferred', async function () {
		const nft = await loadFixture(deployNFT)
		const signers = await ethers.getSigners()

		await nft.mint(signers[1].address, 1)

		const transfer = () => nft.connect(signers[1]).transferFrom(signers[1].address, signers[2].address, 1)

		await expect(transfer).to.changeTokenBalances(nft, [signers[1], signers[2]], [-1, 1])
	})

	it('Collection name and symbol are specified on deploy', async function () {
		const nft = await deployNFT('Different name', 'DS')
		expect(await nft.name()).to.be.eq('Different name')
		expect(await nft.symbol()).to.be.eq('DS')
	})
})
