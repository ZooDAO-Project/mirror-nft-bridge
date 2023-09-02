import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { bridge } from './bridge'
import { setTrustedRemote } from './setTrustedRemote'
import { receive } from './receive'
import { deployBridge } from './_.fixtures'

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
