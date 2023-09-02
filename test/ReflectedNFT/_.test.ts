import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ZONFT, ZONFT__factory } from '../../typechain-types'
import { mint } from './mint'
import { tokenURI } from './tokenURI'

export async function deployReflectionNFT(name = 'ZooDAO Mocks', symbol = 'ZDMK'): Promise<ZONFT> {
	const NFT = (await ethers.getContractFactory('ReflectedNFT')) as ZONFT__factory
	const nft = await NFT.deploy(name, symbol)
	await nft.deployed()
	return nft
}

describe('ReflectedNFT', function () {
	it('deploys', async function () {
		const nft = await loadFixture(deployReflectionNFT)
		expect(nft).not.to.be.undefined
		expect(nft.address.length).to.be.eq(42)
	})

	describe('mint', mint)
	describe('tokenURI', tokenURI)

	it('tokens can be transferred', async function () {
		const nft = await loadFixture(deployReflectionNFT)
		const signers = await ethers.getSigners()

		await nft.mint(signers[1].address, 1, 'url.com')

		const transfer = () => nft.connect(signers[1]).transferFrom(signers[1].address, signers[2].address, 1)

		await expect(transfer).to.changeTokenBalances(nft, [signers[1], signers[2]], [-1, 1])
	})

	it('Collection name and symbol are specified on deploy', async function () {
		const nft = await deployReflectionNFT('Different name', 'DS')
		expect(await nft.name()).to.be.eq('Different name')
		expect(await nft.symbol()).to.be.eq('DS')
	})
})
