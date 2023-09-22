import { ethers } from 'hardhat'
import { LZEndpointMock__factory, ReflectedNFT__factory, MirrorTest__factory } from '../../typechain-types'

export async function deployBridge() {
	const Mirror = (await ethers.getContractFactory('MirrorTest')) as MirrorTest__factory
	const LzEndpointMock = (await ethers.getContractFactory('LZEndpointMock')) as LZEndpointMock__factory

	const sourceNetworkId = 101 // LZ network ID - ethereum
	const targetNetworkId = 126 // LZ network ID - moonbeam

	const sourceLzEndpoint = await LzEndpointMock.deploy(sourceNetworkId)
	const targetLzEndpoint = await LzEndpointMock.deploy(targetNetworkId)

	const ReflectedNFT = (await ethers.getContractFactory('ReflectedNFT')) as ReflectedNFT__factory
	const reflectedNFTImplementation = await ReflectedNFT.deploy()

	const signers = await ethers.getSigners()
	const feeReceiver = signers[9].address
	const feeAmount = 1000000000000000
	const moonbeamNetworkId = 1284
	const arbitrumNetworkId = 42161

	const source = await Mirror.deploy(
		sourceLzEndpoint.address,
		feeAmount,
		feeReceiver,
		reflectedNFTImplementation.address,
		moonbeamNetworkId
	)
	const target = await Mirror.deploy(
		targetLzEndpoint.address,
		feeAmount,
		feeReceiver,
		reflectedNFTImplementation.address,
		arbitrumNetworkId
	)

	await source.deployed()
	await target.deployed()

	await sourceLzEndpoint.setDestLzEndpoint(target.address, targetLzEndpoint.address)
	await targetLzEndpoint.setDestLzEndpoint(source.address, sourceLzEndpoint.address)

	await source.setTrustedRemoteAddress(targetNetworkId, target.address)
	await target.setTrustedRemoteAddress(sourceNetworkId, source.address)

	return {
		source,
		target,
		sourceLzEndpoint,
		targetLzEndpoint,
		sourceNetworkId,
		targetNetworkId,
		signers,
		feeReceiver,
		feeAmount,
	}
}
