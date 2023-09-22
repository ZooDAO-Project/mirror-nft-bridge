import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { mint } from './mint'
import { tokenURI } from './tokenURI'
import { DeployClone__factory, ReflectedNFT__factory } from '../../typechain-types'
// import { init } from './init'

export async function deployReflectionNFT(name = 'ZooDAO Mocks', symbol = 'ZDMK') {
	const ReflectedNFT = (await ethers.getContractFactory('ReflectedNFT')) as ReflectedNFT__factory
	const implementation = await ReflectedNFT.deploy()
	await implementation.deployed()

	const DeployClone = (await ethers.getContractFactory('DeployClone')) as DeployClone__factory
	const deployClone = await DeployClone.deploy(implementation.address)

	const tx = await deployClone.deployClone(ethers.constants.AddressZero, name, symbol)
	const receipt = await tx.wait()
	const deploymentEvent = receipt.events?.find((event) => event.event === 'NFTReflectionDeployed') as unknown as Event
	const cloneAddr = (deploymentEvent as any).args[0] as unknown as string

	const nft = ReflectedNFT.attach(cloneAddr)

	return { clones: deployClone, nft }
}

describe('ReflectedNFT', function () {
	it('deploys', async function () {
		const { nft } = await loadFixture(deployReflectionNFT)
		expect(nft).not.to.be.undefined
		expect(nft.address.length).to.be.eq(42)
	})

	// describe('init', init)
	describe('mint', mint)
	describe('tokenURI', tokenURI)

	it('tokens can be transferred', async function () {
		const { clones, nft } = await loadFixture(deployReflectionNFT)
		const signers = await ethers.getSigners()

		await clones.mint(nft.address, signers[1].address, 1, 'url.com')

		const transfer = () => nft.connect(signers[1]).transferFrom(signers[1].address, signers[2].address, 1)

		await expect(transfer).to.changeTokenBalances(nft, [signers[1], signers[2]], [-1, 1])
	})

	// Not actual starting from using EIP-1167 for cheaper reflections
	// it('Collection name and symbol are specified on deploy', async function () {
	// 	const nft = await deployReflectionNFT('Different name', 'DS')
	// 	expect(await nft.name()).to.be.eq('Different name')
	// 	expect(await nft.symbol()).to.be.eq('DS')
	// })
})
