import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { deployBridge } from '../Mirror/_.fixtures'

describe('LzEndpointMock', function () {
	it('deploys', async function () {
		const { source, target } = await loadFixture(deployBridge)

		expect(source).not.to.be.undefined
		expect(target).not.to.be.undefined

		expect(source.address).to.be.properAddress
		expect(target.address).to.be.properAddress
	})

	it('takes fee', async function () {
		const { source, target, sourceNetworkId, targetNetworkId } = await loadFixture(deployBridge)

		const targetAndSource = ethers.utils.solidityPack(['address', 'address'], [target.address, source.address])
		let isTrustedRemote = await source.isTrustedRemote(targetNetworkId, targetAndSource)
		expect(isTrustedRemote).to.be.true

		const sourceAndTarget = ethers.utils.solidityPack(['address', 'address'], [source.address, target.address])
		isTrustedRemote = await target.isTrustedRemote(sourceNetworkId, sourceAndTarget)
		expect(isTrustedRemote).to.be.true
	})
})
