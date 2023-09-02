import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { bridge } from './bridge'
import { receive } from './receive'
import { deployBridge } from './_.fixtures'

describe('Mirror', function () {
	it('deploys', async function () {
		const { source } = await loadFixture(deployBridge)
		expect(source).not.to.be.undefined
		expect(source.address.length).to.be.eq(42)
	})
	// it('is NonBlockingLzApp', async function () {
	// 	const { source, sourceLzEndpoint } = await loadFixture(deployBridge)
	// 	expect(await source.lzEndpoint()).to.be.eq(sourceLzEndpoint.address)
	// 	expect(source.address.length).to.be.eq(42)
	// })
	describe('createReflection()', bridge)
	describe('receive()', receive)
})
