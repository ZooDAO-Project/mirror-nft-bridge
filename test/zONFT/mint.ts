import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { simpleBridgeScenario } from '../Bridge/_.fixtures'
import { expectToBeRevertedWith } from '../_utils'
import { deployCopyNFT } from './_.test'
import { ethers } from 'hardhat'

export const mint = function () {
	it('mint tokens', async function () {
		const nft = await loadFixture(deployCopyNFT)
		const signers = await ethers.getSigners()

		const mint = () => nft.mint(signers[1].address, 1, 'url.com')

		await expect(mint).to.changeTokenBalance(nft, signers[1], 1)
	})

	it(`Mint only by bridging contract (owner)`, async function () {
		const { copy, owner } = await simpleBridgeScenario()

		const tx = copy.mint(owner.address, 111, 'url.com')

		expectToBeRevertedWith(tx, 'Ownable')
	})
}
