import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { Bridge__factory } from '../../typechain-types'
import { bridge } from './bridge'
import { setTrustedRemote } from './setTrustedRemote'
import { receive } from './receive'

export async function deployBridge() {
	const Bridge = (await ethers.getContractFactory('Bridge')) as Bridge__factory

	const source = await Bridge.deploy()
	const target = await Bridge.deploy()

	await source.deployed()
	await target.deployed()

	const sourceNetworkId = 101 // LZ network ID - ethereum
	const targetNetworkId = 126 // LZ network ID - moonbeam

	await source.setTrustedRemote(targetNetworkId, target.address)
	await target.setTrustedRemote(sourceNetworkId, source.address)

	const signers = await ethers.getSigners()

	return { source, target, sourceNetworkId, targetNetworkId, signers }
}

describe('Bridge', function () {
	it('deploys', async function () {
		const { source } = await loadFixture(deployBridge)
		expect(source).not.to.be.undefined
		expect(source.address.length).to.be.eq(42)
	})
	describe('bridge()', bridge)
	describe('receive()', receive)
	describe('setTrustedRemote()', setTrustedRemote)
})
