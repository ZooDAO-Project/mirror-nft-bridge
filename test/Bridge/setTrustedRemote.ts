import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { expectToBeRevertedWith } from '../_utils'
import { deployBridge } from './_.fixtures'

export const setTrustedRemote = function () {
	it(`sets trusted remote`, async function () {
		const { source, target } = await loadFixture(deployBridge)

		const targetNetworkId = 126
		await source.setTrustedRemoteAddress(targetNetworkId, target.address)

		expect(await source.trustedRemote(targetNetworkId)).to.be.eq(target.address)
	})

	it(`emits event`, async function () {
		const { source, target } = await loadFixture(deployBridge)

		const targetNetworkId = 126
		const tx = source.setTrustedRemoteAddress(targetNetworkId, target.address)

		await expect(tx).to.emit(source, 'TrustedRemoteSet').withArgs(targetNetworkId, target.address)
	})

	it(`only owner`, async function () {
		const { source, target, signers } = await loadFixture(deployBridge)

		const targetNetworkId = 126
		const tx = source.connect(signers[8]).setTrustedRemoteAddress(targetNetworkId, target.address)

		await expectToBeRevertedWith(tx, 'Ownable: caller is not the owner')
	})
}
