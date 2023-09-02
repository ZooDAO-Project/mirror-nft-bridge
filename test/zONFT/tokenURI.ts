import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deployCopyNFT } from './_.test'
import { ethers } from 'hardhat'
import { expectToBeRevertedWith } from '../_utils'
import { ContractTransaction } from 'ethers'

export const tokenURI = async function () {
	it('tokens have URI', async function () {
		const nft = await loadFixture(deployCopyNFT)
		const signers = await ethers.getSigners()

		await nft.mint(signers[1].address, 1, 'url.com')

		const uri = await nft.tokenURI(1)
		expect(uri).to.be.eq('url.com')
	})

	it('not minted tokens don`t have URI', async function () {
		const nft = await loadFixture(deployCopyNFT)

		const tx = nft.tokenURI(100) as any as Promise<ContractTransaction>
		await expectToBeRevertedWith(tx, 'ERC721: invalid token ID')
	})
}
