import CHAIN_ID from '../constants/chainIds.json'
import LzEndpoints from '../constants/LzEndpoints.json'
import { getAdapterParamsAndFeesAmount } from '../test/Bridge/_.fixtures'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Bridge, LZEndpointMock, NFT } from '../typechain-types'

export async function bridge(taskArgs: any, hre: HardhatRuntimeEnvironment) {
	const signers = await hre.ethers.getSigners()
	const owner = signers[0]
	const tokenId = taskArgs.tokenId

	const targetNetwork = taskArgs.targetNetwork as keyof typeof CHAIN_ID
	const remoteChainId: any = CHAIN_ID[targetNetwork]

	const Bridge = await hre.ethers.getContractFactory('Bridge')
	const LzEndpoint = await hre.ethers.getContractFactory('ILayerZeroEndpoint')
	const NFT = await hre.ethers.getContractFactory('NFT')

	const lzEndpointAddr = LzEndpoints[hre.network.name as keyof typeof LzEndpoints]
	const lzEndpoint = LzEndpoint.attach(lzEndpointAddr) as LZEndpointMock

	const source = Bridge.attach(taskArgs.localContract) as Bridge

	const nft = NFT.attach(taskArgs.collection) as NFT

	const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
		nft,
		taskArgs.tokenId,
		owner,
		remoteChainId,
		source,
		lzEndpoint
	)

	console.log(`fees[0] (wei): ${fees[0]} / (eth): ${hre.ethers.utils.formatEther(fees[0])}`)
	console.log()
	try {
		const tx = await source.bridge(
			taskArgs.collection, // 'from' address to send tokens
			taskArgs.tokenId,
			remoteChainId, // remote LayerZero chainId
			owner.address, // 'to' address to send tokens
			hre.ethers.constants.AddressZero, // tokenId to send
			adapterParams, // refund address (if too much message fee is sent, it gets refunded)
			{ value: fees[0] }
		)
		const receipt = await tx.wait()
		console.log(`✅ [${hre.network.name}] send(${remoteChainId}, ${tokenId})`)
		console.log(` tx: ${tx.hash}`)
	} catch (e: any) {
		if (e.error?.message.includes('Message sender must own the OmnichainNFT.')) {
			console.log('*Message sender must own the OmnichainNFT.*')
		} else if (e.error.message.includes('This chain is not a trusted source source.')) {
			console.log('*This chain is not a trusted source source.*')
		} else {
			console.log(e)
		}
	}
}

// npx hardhat --network fuji ownerOf --token-id 1 --contract ExampleUniversalONFT721
// npx hardhat --network fuji ownerOf --token-id 11 --contract ExampleUniversalONFT721
// npx hardhat --network bsc-testnet ownerOf --token-id 1 --contract ExampleUniversalONFT721
// npx hardhat --network bsc-testnet ownerOf --token-id 11 --contract ExampleUniversalONFT721

// npx hardhat --network bsc-testnet setTrustedRemote --target-network fuji --contract ExampleUniversalONFT721

// npx hardhat --network bsc-testnet setTrustedRemote --target-network fuji --contract OmniCounter
// npx hardhat --network fuji setTrustedRemote --target-network bsc-testnet --contract OmniCounter

// npx hardhat --network bsc-testnet ocIncrementCounter --target-network fuji
