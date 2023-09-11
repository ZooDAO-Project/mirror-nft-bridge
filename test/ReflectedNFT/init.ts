import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { simpleBridgeScenario } from '../Mirror/_.fixtures'
import { expectToBeRevertedWith } from '../_utils'
import { deployReflectionNFT } from './_.test'
import { ethers } from 'hardhat'
import { ReflectedNFT } from '../../typechain-types'

export const init = function () {
	it('initializes name, symbol', async function () {
		const nft = await loadFixture(deployReflectionNFT)

		await nft.renounceOwnership()

		const name = 'Reflection'
		const symbol = 'RFL'
		await nft.init(name, symbol)

		expect(await nft.name()).to.be.eq(name)
		expect(await nft.symbol()).to.be.eq(symbol)
	})

	it(`transfers ownership`, async function () {
		const nft = await loadFixture(deployReflectionNFT)
		const signers = await ethers.getSigners()

		expect(await nft.owner()).to.be.eq(signers[0].address)

		await nft.renounceOwnership()

		const name = 'nft'
		const symbol = 'RFL'
		await nft.connect(signers[9]).init(name, symbol)

		expect(await nft.owner()).to.be.eq(signers[9].address)
	})

	it(`initializes only once`, async function () {
		const nft = await loadFixture(deployReflectionNFT)
		const signers = await ethers.getSigners()

		expect(await nft.owner()).to.be.eq(signers[0].address)

		await nft.renounceOwnership()

		const name = 'nft'
		const symbol = 'RFL'
		await nft.connect(signers[9]).init(name, symbol)

		expect(await nft.owner()).to.be.eq(signers[9].address)

		await nft.connect(signers[9]).renounceOwnership()

		await expect(nft.init('New Name', 'NN')).to.be.revertedWith('ReflectedNFT: already initialized')
	})
}
