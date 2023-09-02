// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers, network } from 'hardhat'
import { verifyContract } from '../utils/verifyContract'
import LzEndpoints from '../constants/LzEndpoints.json'
import { log } from 'console'

async function main() {
	// Hardhat always runs the compile task when running scripts with its command
	// line interface.
	//
	// If this script is run directly using `node` you may want to call compile
	// manually to make sure everything is compiled
	log(hre.network.name)
	await hre.run('compile')

	const feeAmount = 0
	const feeReceiver = '0x73f6D60439046681f4Ce35665583a39f25E138B0'

	// We get the contract to deploy
	const Mirror = await ethers.getContractFactory('Mirror')
	const lzEndpoint: string = LzEndpoints[hre.network.name as keyof typeof LzEndpoints]
	log('LzEndpoint', lzEndpoint)

	// const bridge = Mirror.attach('0x36a65778e80Aa9E0BFe4458a049536FE66cec8a0')
	const bridge = await Mirror.deploy(lzEndpoint, feeAmount, feeReceiver)

	await bridge.deployed()

	console.log('Mirror deployed to:', bridge.address)

	// const nft = { address: '0xcf374dbe799523b0287256722e2565f69bd6a1c2' }

	await verifyContract(bridge.address, [lzEndpoint, feeAmount, feeReceiver], 'contracts/Mirror.sol:Mirror')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.catch((error) => {
		console.error(error)
		process.exitCode = 1
	})
	.then(() => process.exit(0))
