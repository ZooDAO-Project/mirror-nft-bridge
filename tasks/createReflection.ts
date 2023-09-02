import CHAIN_ID from '../constants/chainIds.json'
import LzEndpoints from '../constants/LzEndpoints.json'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Mirror, LZEndpointMock, NFT, ONFT721 } from '../typechain-types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'ethers'
import { log } from 'console'
import { bridgeAddresses } from '../constants/bridgeAddresses'

type SupportedNetwork = 'ethereum' | 'moonbeam' | 'fantom' | 'arbitrum'

export async function createReflection(taskArgs: any, hre: HardhatRuntimeEnvironment) {
	const signers = await hre.ethers.getSigners()
	const owner = signers[0]
	const tokenId = taskArgs.tokenId

	log(taskArgs)

	const targetNetwork = taskArgs.targetNetwork as keyof typeof CHAIN_ID
	const remoteChainId: any = CHAIN_ID[targetNetwork]

	const Mirror = await hre.ethers.getContractFactory('Mirror')

	// const lzEndpointAddr = LzEndpoints[hre.network.name as keyof typeof LzEndpoints]
	// const lzEndpoint = (await hre.ethers.getContractAt('ILayerZeroEndpoint', lzEndpointAddr)) as LZEndpointMock

	const NFT = await hre.ethers.getContractFactory('NFT')

	const mode: keyof typeof bridgeAddresses = taskArgs.mode || 'test'
	const network = hre.network.name as SupportedNetwork
	const localBridgeAddress = bridgeAddresses[mode][network]
	const remoteBridgeAddress = bridgeAddresses[mode][targetNetwork as SupportedNetwork]

	console.log(`source ${localBridgeAddress}\nremote ${remoteBridgeAddress}`)
	const source = Mirror.attach(localBridgeAddress) as Mirror

	const target = Mirror.attach(remoteBridgeAddress) as Mirror

	const nft = NFT.attach(taskArgs.collection) as NFT

	const tx = await nft.approve(source.address, taskArgs.tokenId)
	await tx.wait()

	const targetNetworkProviderUrl: string = (hre.config.networks[taskArgs.targetNetwork] as any)['url']
	const targetNetworkProvider = ethers.getDefaultProvider(targetNetworkProviderUrl)

	const isReflectionDeployed =
		(await target.connect(targetNetworkProvider).reflection(taskArgs.collection)) !== ethers.constants.AddressZero

	const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
		nft,
		taskArgs.tokenId,
		remoteChainId,
		source,
		isReflectionDeployed
	)

	console.log(`fees[0] (wei): ${fees[0]} / (eth): ${hre.ethers.utils.formatEther(fees[0])}`)
	try {
		const tx = await source.createReflection(
			taskArgs.collection, // 'from' address to send tokens
			[taskArgs.tokenId],
			remoteChainId, // remote LayerZero chainId
			owner.address, // 'to' address to send tokens
			hre.ethers.constants.AddressZero, // tokenId to send
			adapterParams, // refund address (if too much message fee is sent, it gets refunded)
			{ value: fees[0] }
		)
		console.log(
			`✅ [${hre.network.name}] createReflection(${taskArgs.collection}, ${tokenId}, ${remoteChainId} (${taskArgs.targetNetwork}))`
		)
		console.log(` tx: ${tx.hash}`)
	} catch (e: any) {
		console.log(e)
		if (e.error?.message.includes('Message sender must own the OmnichainNFT.')) {
			console.log('*Message sender must own the OmnichainNFT.*')
		} else if (e.error.message.includes('This chain is not a trusted source source.')) {
			console.log('*This chain is not a trusted source source.*')
		} else {
			console.log(e)
		}
	}
}

export async function getAdapterParamsAndFeesAmount(
	nft: ONFT721 | NFT,
	tokenId: number,
	targetNetworkId: number,
	sourceBridge: Mirror,
	isReflectionDeployed: boolean
) {
	const GasWithDeploy = '2100000'
	const GasOnRegularBridge = '400000'

	const RecommendedGas = isReflectionDeployed ? GasOnRegularBridge : GasWithDeploy
	console.log('Gas expenditure on remote tx: ', Number(RecommendedGas) / 1000 + 'k')

	const adapterParams = ethers.utils.solidityPack(['uint16', 'uint256'], [1, RecommendedGas]) // default adapterParams example
	// const abi = new ethers.utils.AbiCoder()

	// const payload = abi.encode(
	// 	['address', 'string', 'string', 'uint256', 'string', 'address'],
	// 	[nft.address, await nft.name(), await nft.symbol(), tokenId, await nft.tokenURI(tokenId), owner.address]
	// )

	const fees = await sourceBridge.estimateSendFee(nft.address, tokenId, targetNetworkId, false, adapterParams)

	return { fees, adapterParams }
}

// npx hardhat --network fuji ownerOf --token-id 1 --contract ExampleUniversalONFT721
// npx hardhat --network fuji ownerOf --token-id 11 --contract ExampleUniversalONFT721
// npx hardhat --network bsc-testnet ownerOf --token-id 1 --contract ExampleUniversalONFT721
// npx hardhat --network bsc-testnet ownerOf --token-id 11 --contract ExampleUniversalONFT721

// npx hardhat --network bsc-testnet setTrustedRemote --target-network fuji --contract ExampleUniversalONFT721

// npx hardhat --network bsc-testnet setTrustedRemote --target-network fuji --contract OmniCounter
// npx hardhat --network fuji setTrustedRemote --target-network bsc-testnet --contract OmniCounter

// npx hardhat --network bsc-testnet ocIncrementCounter --target-network fuji
