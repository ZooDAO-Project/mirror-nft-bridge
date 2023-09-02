import { TxReturnType, simpleBridgeScenario } from '../Mirror/_.fixtures'
import { expect } from 'chai'

export const deductFee = function () {
	it('takes fee on bridge', async function () {
		const { tx, feeReceiver, feeAmount } = await simpleBridgeScenario(TxReturnType.arrowFunction)
		await expect(tx).to.changeEtherBalance(feeReceiver, feeAmount)
	})
}
