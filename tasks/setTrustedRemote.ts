import { HardhatRuntimeEnvironment } from 'hardhat/types'

import CHAIN_ID from '../constants/chainIds.json'

export async function setTrustedRemote(taskArgs: any, hre: HardhatRuntimeEnvironment) {
	// get remote chain id
	const ethers = hre.ethers
	const targetNetwork = taskArgs.targetNetwork as keyof typeof CHAIN_ID
	const remoteChainId: any = CHAIN_ID[targetNetwork]

	const Bridge = await ethers.getContractFactory('Bridge')

	const source = Bridge.attach(taskArgs.localContract)
	const target = Bridge.attach(taskArgs.remoteContract)

	// concat remote and local address
	const remoteAndLocal = hre.ethers.utils.solidityPack(['address', 'address'], [target.address, source.address])

	// check if pathway is already set
	const isTrustedRemoteSet = await source.isTrustedRemote(remoteChainId, remoteAndLocal)

	if (!isTrustedRemoteSet) {
		try {
			const tx = await (await source.setTrustedRemote(remoteChainId, remoteAndLocal)).wait()
			console.log(`✅ [${hre.network.name}] setTrustedRemote(${remoteChainId}, ${remoteAndLocal})`)
			console.log(` tx: ${tx.transactionHash}`)

			// const PACKET_TYPE = 1
			// const minDstGas = 400000
			// tx = await (await localContractInstance.setMinDstGas(remoteChainId, PACKET_TYPE, minDstGas)).wait()
			// console.log(`✅ [${hre.network.name}] setMinDstGas(${remoteChainId}, ${remoteAndLocal})`)
		} catch (e: any) {
			if (e.error.message.includes('The chainId + address is already trusted')) {
				console.log('*source already set*')
			} else {
				console.log(`❌ [${hre.network.name}] setTrustedRemote(${remoteChainId}, ${remoteAndLocal})`)
			}
		}
	} else {
		console.log('*source already set*')
	}
}
