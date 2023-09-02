import { expect } from 'chai'
import { deployBridge, deployNFTWithMint, getAdapterParamsAndFeesAmount } from './_.fixtures'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'
import { expectToBeRevertedWith } from '../_utils'
import * as collections from '../../constants/collections.json'

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
			owner.address,
			ethers.constants.AddressZero,
			adapterParams,
			{ value: fees[0] }
		)

		await expectToBeRevertedWith(tx, 'Mirror: collection is not eligible')

		await source.changeCollectionEligibility([nft.address], true)

		tx = source.createReflection(
			nft.address,
			[tokenId],
			targetNetworkId,
			owner.address,
			owner.address,
			ethers.constants.AddressZero,
			adapterParams,
			{ value: fees[0] }
		)

		expect(tx).not.to.be.reverted
	})

	it('Makes eligible lots of collections', async function () {
		const { source, targetNetworkId } = await loadFixture(deployBridge)
		// const { nft, owner, tokenId } = await loadFixture(deployNFTWithMint)

		await source.changeCollectionEligibility((collections as any).default, true)
	})
}
