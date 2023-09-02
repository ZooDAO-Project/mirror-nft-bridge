// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { verifyContract } from '../utils/verifyContract'

async function main() {
	const contractAddr = '0xeff274014107f093A64f2F79CcD989492bda88aC'

	const args = ['ZooDAO Test Collection', 'ZDTC']

	await verifyContract(contractAddr, args, 'contracts/ReflectedNFT.sol:ReflectedNFT')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
