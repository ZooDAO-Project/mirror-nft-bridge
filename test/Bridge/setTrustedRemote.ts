import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { Bridge__factory } from '../../typechain-types'
import { ethers } from 'hardhat'

async function deployBridge() {
	const Bridge = (await ethers.getContractFactory('Bridge')) as Bridge__factory

	const source = await Bridge.deploy()
	const target = await Bridge.deploy()

	await source.deployed()
	await target.deployed()

	const signers = await ethers.getSigners()

	return { source, target, signers }
}

export const setTrustedRemote = function () {
	it(`sets trusted remote`, async function () {
		const { source, target } = await loadFixture(deployBridge)

		const targetNetworkId = 126
		await source.setTrustedRemote(targetNetworkId, target.address)

		expect(await source.trustedRemote(targetNetworkId)).to.be.eq(target.address)
	})

	it(`emits event`, async function () {
		const { source, target } = await loadFixture(deployBridge)

		const targetNetworkId = 126
		const tx = source.setTrustedRemote(targetNetworkId, target.address)

		await expect(tx).to.emit(source, 'TrustedRemoteSet').withArgs(targetNetworkId, target.address)
	})

	it(`only owner`, async function () {
		const { source, target, signers } = await loadFixture(deployBridge)

		const targetNetworkId = 126
		const tx = source.connect(signers[8]).setTrustedRemote(targetNetworkId, target.address)

		await expect(tx).to.be.revertedWith('Ownable: caller is not the owner')
	})
}
