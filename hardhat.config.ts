import * as dotenv from 'dotenv'

import { HardhatUserConfig, task } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-gas-reporter'
import 'hardhat-tracer'
import 'solidity-docgen'

import { setTrustedRemote } from './tasks/setTrustedRemote'
import { hasStoredPayload } from './tasks/hasStoredPayload'
import { retryPayload } from './tasks/retryPayload'
import { createReflection } from './tasks/createReflection'

dotenv.config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
	const accounts = await hre.ethers.getSigners()

	for (const account of accounts) {
		console.log(account.address)
	}
})

task('createReflection', 'send NFT (or ReflectedNFT) to another chain', createReflection)
	.addParam('collection', 'collection address')
	.addParam('tokenId', 'uint256 tokenId')
	.addOptionalParam('targetNetwork', 'Name of target network')
// .addOptionalParam('mode', 'test or production')

task(
	'setTrustedRemote',
	'setTrustedRemote(chainId, path) to enable inbound/outbound messages with your other contracts',
	setTrustedRemote
)
	.addParam('targetNetwork', 'the target network to set as a trusted remote')
	.addOptionalParam('localContract', 'Address of local contract')
	.addOptionalParam('remoteContract', 'Address of remote contract')

task(
	'hasStoredPayload',
	'Checks if there is StoredPayload on lzEndpoint on given network from srcChainId and srcAddress',
	hasStoredPayload
)
	.addParam('srcChain', 'Source chain where was the message sent')
	.addParam('srcAddress', 'Source UA address where was the message sent')

task('retryPayload', 'Unsticking stuck tx on destination lzEndpoint', retryPayload)
	.addParam('srcChain', 'Source chain where was the message sent')
	.addParam('srcAddress', 'Source UA address where was the message sent')
	.addParam('payload', 'Payload of the stuck tx')
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

function getPrivateKey() {
	const privateKey = process.env.PRIVATE_KEY
	if (!privateKey || privateKey === '') {
		throw new Error("Private key doesn't specified in .env file")
	}

	return privateKey
}

function accounts() {
	return [getPrivateKey()]
	//return { mnemonic: getMnemonic(chainKey) }
}

const config: HardhatUserConfig = {
	solidity: {
		version: '0.8.18',
		settings: {
			viaIR: true,
			optimizer: {
				enabled: true,
				// runs: 1000,
			},
		},
	},
	networks: {
		// Networks for tests on multiple local networks
		localTestMoonbeam: {
			url: 'http://127.0.0.1:8126/',
			accounts: accounts(),
		},
		localTestArbitrum: {
			url: 'http://127.0.0.1:8110/',
			accounts: accounts(),
		},
		sepolia: {
			url: process.env.SEPOLIA_URL || '',
			accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
		},
		ethereum: {
			url: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // public infura endpoint
			chainId: 1,
			accounts: accounts(),
		},
		bsc: {
			url: 'https://bsc-dataseed1.binance.org',
			chainId: 56,
			accounts: accounts(),
		},
		avalanche: {
			url: 'https://api.avax.network/ext/bc/C/rpc',
			chainId: 43114,
			accounts: accounts(),
		},
		polygon: {
			url: 'https://rpc-mainnet.maticvigil.com',
			chainId: 137,
			accounts: accounts(),
		},
		goerli: {
			url: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // public infura endpoint
			chainId: 5,
			accounts: accounts(),
		},
		arbitrum: {
			url: `https://arb1.arbitrum.io/rpc`,
			chainId: 42161,
			accounts: accounts(),
		},
		optimism: {
			url: `https://mainnet.optimism.io`,
			chainId: 10,
			accounts: accounts(),
		},
		fantom: {
			url: `https://rpcapi.fantom.network`,
			chainId: 250,
			accounts: accounts(),
		},
		'bsc-testnet': {
			url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
			chainId: 97,
			accounts: accounts(),
		},
		fuji: {
			url: `https://api.avax-test.network/ext/bc/C/rpc`,
			chainId: 43113,
			accounts: accounts(),
		},
		mumbai: {
			url: 'https://rpc-mumbai.matic.today/',
			chainId: 80001,
			accounts: accounts(),
		},
		'arbitrum-goerli': {
			url: `https://goerli-rollup.arbitrum.io/rpc/`,
			chainId: 421613,
			accounts: accounts(),
		},
		'optimism-goerli': {
			url: `https://goerli.optimism.io/`,
			chainId: 420,
			accounts: accounts(),
		},
		'fantom-testnet': {
			url: `https://rpc.testnet.fantom.network/`,
			chainId: 4002,
			accounts: accounts(),
		},
		moonbeam: {
			url: `https://moonbeam.public.blastapi.io`,
			chainId: 1284,
			accounts: accounts(),
		},
		moonbase: {
			url: `https://rpc.api.moonbase.moonbeam.network`,
			chainId: 1287,
			accounts: accounts(),
		},
	},
	gasReporter: {
		enabled: true,
		// enabled: process.env.REPORT_GAS ? true : false,
		currency: 'USD',
		gasPrice: 30,
		coinmarketcap: 'af8ddfb6-5886-41fe-80b5-19259a3a03be',
	},
	etherscan: {
		apiKey: {
			// Moonbeam
			moonbeam: process.env.MOONBEAMSCAN_TOKEN as string, // Moonbeam Moonscan API Key
			// moonriver: process.env.MOONRIVERSCAN_TOKEN, // Moonriver Moonscan API Key
			moonbaseAlpha: process.env.MOONBEAMSCAN_TOKEN as string, // Moonbeam Moonscan API Key
			// Ethereum
			mainnet: process.env.ETHERSCAN_TOKEN as string,
			goerli: process.env.ETHERSCAN_TOKEN as string,
			// Polygon
			polygon: process.env.POLYGONSCAN_TOKEN as string,
			polygonMumbai: process.env.POLYGONSCAN_TOKEN as string,
			bsc: process.env.BSCSCAN_TOKEN as string,
			bscTestnet: process.env.BSCSCAN_TOKEN as string,
			arbitrumOne: process.env.ARBISCAN_TOKEN as string,
			fantom: process.env.FTMSCAN_TOKEN as string,
		},
		customChains: [
			{
				network: 'fantom',
				chainId: 250,
				urls: {
					apiURL: 'https://api.ftmscan.com/api',
					browserURL: 'https://ftmscan.com/',
				},
			},
		],
	},
	docgen: {
		pages: 'files',
	},
}

export default config
