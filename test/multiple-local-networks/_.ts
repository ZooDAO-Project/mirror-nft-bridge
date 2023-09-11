import { expect } from 'chai'
import hardhat, { ethers, run } from 'hardhat'
import { LZEndpointMock__factory, Mirror__factory } from '../../typechain-types'

describe('Testing setting up multiple local hardhat networks', function () {
	let initialStateSnapshotId = ''

	it('Setting contracts up, getting snapshot and reverting to it', async function () {
		// Set up snapshot
		initialStateSnapshotId = (await takeSnapshot()) as string
		expect(initialStateSnapshotId).not.to.be.undefined

		// Set up contracts
		const LzEndpointMockFactory = (await ethers.getContractFactory('LZEndpointMock')) as LZEndpointMock__factory
		const chainId = 101
		const lzEndpoint = await LzEndpointMockFactory.deploy(chainId)
		const recorderChainId = await lzEndpoint.getChainId()
		expect(recorderChainId).to.be.eq(chainId)

		// Revert state and check
		await revertToSnapshot(initialStateSnapshotId)
		const contractInteraction = lzEndpoint.getChainId()
		expect(contractInteraction).to.be.reverted
	})

	async function takeSnapshot() {
		const response = await hardhat.network.provider.request({
			method: 'evm_snapshot',
		})

		console.log('snapshot response', response)
		return response
	}

	async function revertToSnapshot(snapshotId: string) {
		const response = await hardhat.network.provider.request({
			method: 'evm_revert',
			params: [snapshotId],
		})

		console.log('revert response', response)
		return response
	}
})
