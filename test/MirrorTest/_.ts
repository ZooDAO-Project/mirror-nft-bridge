import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deployBridge } from './_.fixtures'
import { DeployClone__factory, MirrorChain__factory } from '../../typechain-types'
import { ethers } from 'hardhat'

describe('MirrorTest', function () {
	it('deploys', async function () {
		const { source } = await loadFixture(deployBridge)
		expect(source).not.to.be.undefined
		expect(source.address.length).to.be.eq(42)
	})

	it('has getChainId() func', async function () {
		const { source, target } = await loadFixture(deployBridge)
		expect(await source.getChainId()).to.be.eq(1284)
		expect(await target.getChainId()).to.be.eq(42161)
	})

	it('base Mirror returns actual chainId', async function () {
		const Mirror = (await ethers.getContractFactory('Mirror')) as MirrorChain__factory
		const mirror = await Mirror.deploy(
			ethers.constants.AddressZero,
			0,
			ethers.constants.AddressZero,
			ethers.constants.AddressZero
		)

		expect(await mirror.getChainId()).to.be.eq(31337)
	})

	it('Clone deployment expenditure', async function () {
		const DeployClone = (await ethers.getContractFactory('DeployClone')) as DeployClone__factory
		const sampleAddress = '0xabcabcabcabcabcabcabcabcabcabcabcabcabca'
		const deployClone = await DeployClone.deploy(sampleAddress)
		await deployClone.deployClone(sampleAddress, 'Reflection', 'RFLCTN')
	})
})
