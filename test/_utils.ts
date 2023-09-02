import { expect } from 'chai'
import { ContractTransaction } from 'ethers'
import hardhat from 'hardhat'

export async function expectToBeReverted(tx: Promise<ContractTransaction>) {
	// Make hardhat-tracer don't react on txs that are expected to fail
	hardhat.tracer.enabled = false

	await expect(tx).to.be.reverted

	hardhat.tracer.enabled = true
}

export async function expectToBeRevertedWith(tx: Promise<ContractTransaction>, error: string) {
	// Make hardhat-tracer don't react on txs that are expected to fail
	hardhat.tracer.enabled = false

	await expect(tx).to.be.revertedWith(error)

	hardhat.tracer.enabled = true
}
