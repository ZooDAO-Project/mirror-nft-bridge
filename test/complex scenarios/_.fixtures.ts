import { ethers } from 'hardhat'
import { LZEndpointMock__factory, Mirror__factory } from '../../typechain-types'

export async function deployMultipleBridges() {
	const Mirror = (await ethers.getContractFactory('Mirror')) as Mirror__factory
	const LzEndpointMock = (await ethers.getContractFactory('LZEndpointMock')) as LZEndpointMock__factory

	const ethNetworkId = 101 // LZ network ID - ethereum
	const moonNetworkId = 126 // LZ network ID - moonbeam
	const arbNetworkId = 110 // LZ network ID - arbitrum

	const networkIds = {
		ethNetworkId,
		moonNetworkId,
		arbNetworkId,
	}

	const ethLzEndpoint = await LzEndpointMock.deploy(ethNetworkId)
	const moonLzEndpoint = await LzEndpointMock.deploy(moonNetworkId)
	const arbLzEndpoint = await LzEndpointMock.deploy(arbNetworkId)

	const lzEndpoints = {
		ethLzEndpoint,
		moonLzEndpoint,
		arbLzEndpoint,
	}

	const signers = await ethers.getSigners()
	const feeReceiver = signers[9].address
	const feeAmount = 1000000000000000
	const ethBridge = await Mirror.deploy(ethLzEndpoint.address, feeAmount, feeReceiver)
	const moonBridge = await Mirror.deploy(moonLzEndpoint.address, feeAmount, feeReceiver)
	const arbBridge = await Mirror.deploy(arbLzEndpoint.address, feeAmount, feeReceiver)

	await ethBridge.deployed()
	await moonBridge.deployed()
	await arbBridge.deployed()

	// Setting up LzEndpoint structure
	// ethereum: moonbeam, arbitrum
	await ethLzEndpoint.setDestLzEndpoint(moonBridge.address, moonLzEndpoint.address)
	await ethLzEndpoint.setDestLzEndpoint(arbBridge.address, arbLzEndpoint.address)

	// moonbeam: ethereum, arbitrum
	await moonLzEndpoint.setDestLzEndpoint(ethBridge.address, ethLzEndpoint.address)
	await moonLzEndpoint.setDestLzEndpoint(arbBridge.address, arbLzEndpoint.address)

	// arbitrum: ethereum, moonbeam
	await arbLzEndpoint.setDestLzEndpoint(ethBridge.address, ethLzEndpoint.address)
	await arbLzEndpoint.setDestLzEndpoint(moonBridge.address, moonLzEndpoint.address)

	// Setting up Trusted Remotes
	// ethereum: moonbeam, arbitrum
	await ethBridge.setTrustedRemoteAddress(moonNetworkId, moonBridge.address)
	await ethBridge.setTrustedRemoteAddress(arbNetworkId, arbBridge.address)

	// moonbeam: ethereum, arbitrum
	await moonBridge.setTrustedRemoteAddress(ethNetworkId, ethBridge.address)
	await moonBridge.setTrustedRemoteAddress(arbNetworkId, arbBridge.address)

	// arbitrum: ethereum, moonbeam
	await arbBridge.setTrustedRemoteAddress(ethNetworkId, ethBridge.address)
	await arbBridge.setTrustedRemoteAddress(moonNetworkId, moonBridge.address)

	return { ethBridge, moonBridge, arbBridge, networkIds, lzEndpoints, signers }
}
