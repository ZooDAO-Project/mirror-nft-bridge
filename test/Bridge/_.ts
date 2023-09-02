import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { Bridge, Bridge__factory } from '../../typechain-types'

export async function deployBridge(): Promise<Bridge> {
	const Bridge = (await ethers.getContractFactory('Bridge')) as Bridge__factory
	const bridge = await Bridge.deploy()
	await bridge.deployed()
	return bridge
}

describe('Bridge', function () {
	it('deploys', async function () {
		const bridge = await loadFixture(deployBridge)
		expect(bridge).not.to.be.undefined
		expect(bridge.address.length).to.be.eq(42)
	})
})
