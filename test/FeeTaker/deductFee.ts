import { TxReturnType, simpleBridgeScenario } from '../Mirror/_.fixtures'
import { expect } from 'chai'
import { expectToBeRevertedWith } from '../_utils'

export const deductFee = function () {
	it('takes fee on bridge', async function () {
		const { tx, feeReceiver, feeAmount } = await simpleBridgeScenario(TxReturnType.arrowFunction)
		await expect(tx).to.changeEtherBalance(feeReceiver, feeAmount)
	})

	it('fee amount can be changed and only by owner', async function () {
		const { tx, source, feeReceiver, feeAmount, signers } = await simpleBridgeScenario(TxReturnType.arrowFunction)

		const updateTx = source.connect(signers[5]).updateFeeAmount(feeAmount * 2)
		await expectToBeRevertedWith(updateTx, 'Ownable: caller is not the owner')

		await source.updateFeeAmount(feeAmount / 2)

		await expect(tx).to.changeEtherBalance(feeReceiver, feeAmount / 2)
	})

	it('fee receiver can be changed and only by owner', async function () {
		const { tx, source, feeAmount, signers } = await simpleBridgeScenario(TxReturnType.arrowFunction)

		const updateTx = source.connect(signers[5]).updateFeeReceiver(signers[5].address)
		await expectToBeRevertedWith(updateTx, 'Ownable: caller is not the owner')

		await source.updateFeeReceiver(signers[3].address)

		await expect(tx).to.changeEtherBalance(signers[3], feeAmount)
	})
}
