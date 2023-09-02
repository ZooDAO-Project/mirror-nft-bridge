import { expect } from 'chai'
import { deployBridge, deployNFTWithMint, getAdapterParamsAndFeesAmount } from './_.fixtures'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'
import { expectToBeRevertedWith } from '../_utils'

export const eligibility = async function () {
	it('Reflects only eligible collections', async function () {
		const { source, targetNetworkId } = await loadFixture(deployBridge)
		const { nft, owner, tokenId } = await loadFixture(deployNFTWithMint)

		await nft.approve(source.address, tokenId)

		const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
			nft,
			[tokenId],
			targetNetworkId,
			source,
			false
		)

		let tx = source.createReflection(
			nft.address,
			[tokenId],
			targetNetworkId,
			owner.address,
			ethers.constants.AddressZero,
			adapterParams,
			{ value: fees[0] }
		)

		await expectToBeRevertedWith(tx, 'Mirror: collection is not eligible to make reflection of')

		await source.changeCollectionEligibility(nft.address, true)

		tx = source.createReflection(
			nft.address,
			[tokenId],
			targetNetworkId,
			owner.address,
			ethers.constants.AddressZero,
			adapterParams,
			{ value: fees[0] }
		)

		expect(tx).not.to.be.reverted
	})
}
