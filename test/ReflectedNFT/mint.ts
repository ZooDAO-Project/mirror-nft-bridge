import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { simpleBridgeScenario } from '../Mirror/_.fixtures'
import { expectToBeRevertedWith } from '../_utils'
import { deployReflectionNFT } from './_.test'
import { ethers } from 'hardhat'

export const mint = function () {
	it('mint tokens', async function () {
		const { clones, nft } = await loadFixture(deployReflectionNFT)
		const signers = await ethers.getSigners()

		const mint = () => clones.mint(nft.address, signers[1].address, 1, 'url.com')

		await expect(mint).to.changeTokenBalance(nft, signers[1], 1)
	})

	it(`Mint only by bridging contract (owner)`, async function () {
		const { reflection, owner } = await simpleBridgeScenario()

		const tx = reflection.mint(owner.address, 111, 'url.com')

		await expectToBeRevertedWith(tx, 'Ownable: caller is not the owner')
	})
}
