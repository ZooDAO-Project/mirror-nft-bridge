import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { expectToBeRevertedWith } from '../_utils'
import { deployReflectionNFT } from './_.test'
import { ethers } from 'hardhat'

export const burn = function () {
	it('burns tokens', async function () {
		const nft = await loadFixture(deployReflectionNFT)
		const signers = await ethers.getSigners()

		const tokenId = 1
		await nft.mint(signers[1].address, tokenId, 'url.com')
		const burn = () => nft.burn(signers[1].address, tokenId)

		await expect(burn).to.changeTokenBalance(nft, signers[1], -1)

		await expectToBeRevertedWith(nft.ownerOf(tokenId) as any, 'ERC721: invalid token ID')
		await expectToBeRevertedWith(nft.tokenURI(tokenId) as any, 'ERC721: invalid token ID')
	})

	it(`only owner`, async function () {
		const nft = await loadFixture(deployReflectionNFT)
		const signers = await ethers.getSigners()

		const tokenId = 1
		await nft.mint(signers[1].address, tokenId, 'url.com')

		// Burn from NOT deployer account
		const burn = nft.connect(signers[2]).burn(signers[1].address, tokenId)

		await expectToBeRevertedWith(burn, 'Ownable: caller is not the owner')
	})
}
