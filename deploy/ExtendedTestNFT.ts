// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from 'hardhat'
import { verifyContract } from '../utils/verifyContract'

async function main() {
	// Hardhat always runs the compile task when running scripts with its command
	// line interface.
	//
	// If this script is run directly using `node` you may want to call compile
	// manually to make sure everything is compiled
	await hre.run('compile')

	// We get the contract to deploy
	const NFT = await ethers.getContractFactory('ExtendedTestNFT')
	const nft = await NFT.deploy('Test Collection', 'TC')
	// const nft = NFT.attach('0x8D32c7B0b5f4d4f5ECb72fd78eB7a2ED23910Ee2')

	await nft.deployed()

	console.log('ExtendedTestNFT deployed to:', nft.address)

	// const nft = { address: '0xcf374dbe799523b0287256722e2565f69bd6a1c2' }

	await verifyContract(nft.address, ['Test Collection', 'TC'], 'contracts/mock/ExtendedTestNFT.sol:ExtendedTestNFT')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.catch((error) => {
		console.error(error)
		process.exitCode = 1
	})
	.then(() => process.exit(0))
