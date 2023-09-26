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
	const NFT = await ethers.getContractFactory('ReflectedNFT')
	// const nft = await NFT.deploy('Фкишекгь ZooDAO Test Collection', 'MZDTC')
	const nft = NFT.attach('0x9ceae626797cfAF7632872C4E006aC0Db9DE8e00')

	await nft.deployed()

	console.log('NFT deployed to:', nft.address)

	// const nft = { address: '0xcf374dbe799523b0287256722e2565f69bd6a1c2' }

	await verifyContract(nft.address, [], 'contracts/ReflectedNFT.sol:ReflectedNFT')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.catch((error) => {
		console.error(error)
		process.exitCode = 1
	})
	.then(() => process.exit(0))
