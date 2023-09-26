import { ExtendedTestNFT__factory } from '../../typechain-types'
import { ethers } from 'hardhat'
import { anonymiceToknURI, edgehogTokenURI } from './on-chain-nfts'

describe('ExtendedTestNFT', function () {
	describe('on-chain mint cost check', function () {
		it('Edgehocks', async function () {
			const ExtendedTestNFT = (await ethers.getContractFactory('ExtendedTestNFT')) as ExtendedTestNFT__factory
			const nft = await ExtendedTestNFT.deploy('name', 'symbol')

			const signers = await ethers.getSigners()
			await nft.mint(signers[0].address, 2)

			await nft.setTokenURI(1, edgehogTokenURI, { gasLimit: 30000000 })
		})

		it('Anonymice', async function () {
			const ExtendedTestNFT = (await ethers.getContractFactory('ExtendedTestNFT')) as ExtendedTestNFT__factory
			const nft = await ExtendedTestNFT.deploy('name', 'symbol')

			const signers = await ethers.getSigners()
			await nft.mint(signers[0].address, 1)

			await nft.setTokenURI(1, anonymiceToknURI, { gasLimit: 30000000 })
		})
	})
})
