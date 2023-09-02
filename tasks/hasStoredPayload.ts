import { HardhatRuntimeEnvironment } from 'hardhat/types'
import LZ_ENDPOINTS from '../constants/LzEndpoints.json'

import CHAIN_ID from '../constants/chainIds.json'

export async function hasStoredPayload(taskArgs: any, hre: HardhatRuntimeEnvironment) {
	const network = hre.network.name
	const srcAddress = taskArgs.srcAddress
	// 0x + srcAddr + dstAddr
	// 0x8bbcce0a963a7ccca5f3b3be1a268e9f97c682ab1ac0c9592e2480649e9471c1548f60564b37a46b
	const srcChain = taskArgs.srcChain as keyof typeof CHAIN_ID
	const srcChainId = CHAIN_ID[srcChain]
	// const [localContractInstance] = await getLocalContractInstanceAndRemoteContractAddress(taskArgs, hre)

	const endpoint = LZ_ENDPOINTS[network as keyof typeof LZ_ENDPOINTS]
	const lzEndpoint = await hre.ethers.getContractAt('ILayerZeroEndpoint', endpoint)

	const result = await lzEndpoint.hasStoredPayload(srcChainId, srcAddress)
	console.log(
		`[${hre.network.name}] hasStoredPayload(${srcChainId}, ${srcAddress}) is ${result} @ LZ chainId[${
			CHAIN_ID[network as keyof typeof CHAIN_ID]
		}]`
	)
	// console.log(` tx: ${tx.transactionHash}`)
	// console.log(`* check your address [${owner.address}] on the destination chain, in the ERC20 transaction tab !"`)
}
