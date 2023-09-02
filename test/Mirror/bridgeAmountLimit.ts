import { ethers } from 'hardhat'
import { TxReturnType, getAdapterParamsAndFeesAmount, simpleBridgeMultipleScenario } from './_.fixtures'
import { expectToBeRevertedWith } from '../_utils'
import { expect } from 'chai'

export const bridgeAmountLimit = function () {
	it('can`t bridge more than limit', async function () {
		const { source, nft, owner, targetNetworkId, tokenIds } = await simpleBridgeMultipleScenario(
			TxReturnType.arrowFunction,
			11
		)

		const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
			nft,
			tokenIds,
			targetNetworkId,
			source,
			false
		)

		const tx = source.createReflection(
			nft.address,
			tokenIds,
			targetNetworkId,
			owner.address,
			ethers.constants.AddressZero,
			adapterParams,
			{ value: fees[0] }
		)

		await expectToBeRevertedWith(tx, "Mirror: can't reflect more than limit")
	})

	it('limit can be changed', async function () {
		const { source, nft, owner, targetNetworkId, tokenIds } = await simpleBridgeMultipleScenario(
			TxReturnType.arrowFunction,
			11
		)

		await source.changeReflectionAmountLimit(20)

		const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
			nft,
			tokenIds,
			targetNetworkId,
			source,
			false
		)

		const tx = source.createReflection(
			nft.address,
			tokenIds,
			targetNetworkId,
			owner.address,
			ethers.constants.AddressZero,
			adapterParams,
			{ value: fees[0] }
		)

		await expect(tx).not.to.be.reverted
	})

	it('only owner can change limit', async function () {
		const { source, signers } = await simpleBridgeMultipleScenario(TxReturnType.arrowFunction, 11)

		const tx = source.connect(signers[5]).changeReflectionAmountLimit(20)
		await expectToBeRevertedWith(tx, 'Ownable: caller is not the owner')
	})
}
