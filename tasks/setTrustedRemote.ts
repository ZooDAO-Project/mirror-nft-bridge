import { HardhatRuntimeEnvironment } from 'hardhat/types'

import CHAIN_ID from '../constants/chainIds.json'
import { bridgeAddresses } from '../constants/bridgeAddresses'
import { SupportedNetwork } from './createReflection'

export async function setTrustedRemote(taskArgs: any, hre: HardhatRuntimeEnvironment) {
	// get remote chain id
	const ethers = hre.ethers
	const targetNetwork = taskArgs.targetNetwork as keyof typeof CHAIN_ID
	const remoteChainId: any = CHAIN_ID[targetNetwork]

	const Mirror = await ethers.getContractFactory('Mirror')

	const network = hre.network.name as keyof typeof bridgeAddresses.production

	console.log(bridgeAddresses.production[network].Mirror)
	console.log(bridgeAddresses.production[targetNetwork as SupportedNetwork].Mirror)

	const source = Mirror.attach(bridgeAddresses.production[network].Mirror)
	const target = Mirror.attach(bridgeAddresses.production[targetNetwork as SupportedNetwork].Mirror)

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
