import hre from 'hardhat'
import { wait } from './wait'

export async function verifyContract(address: string, constructorArguments: any, contract?: string) {
	await wait(30)
	console.log('Contract verification...')
	await hre.run('verify:verify', {
		address: address,
		constructorArguments: constructorArguments,
		contract,
	})
}
