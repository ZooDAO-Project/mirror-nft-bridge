import { ethers } from 'hardhat'
import { ExampleUniversalONFT721__factory, LZEndpointMock__factory } from '../../typechain-types'

const PACKET_TYPE = 1
const MinGas = 300000
const RecommendedGas = 400000

export async function deployMockONFT() {
	const sourceNetworkId = 101 // LZ network ID - ethereum
	const targetNetworkId = 126 // LZ network ID - moonbeam

	const LzEndpoint = (await ethers.getContractFactory('LZEndpointMock')) as LZEndpointMock__factory
	const sourceLzEndpoint = await LzEndpoint.deploy(sourceNetworkId)
	const targetLzEndpoint = await LzEndpoint.deploy(targetNetworkId)

	const ONFT = (await ethers.getContractFactory('ExampleUniversalONFT721')) as ExampleUniversalONFT721__factory

	const mintIds = {
		sourceNetworkId: {
			start: 1,
			end: 10,
		},
		targetNetworkId: {
			start: 11,
			end: 20,
		},
	}

	const source = await ONFT.deploy(
		MinGas,
		sourceLzEndpoint.address,
		mintIds.sourceNetworkId.start,
		mintIds.sourceNetworkId.end
	)

	const target = await ONFT.deploy(
		MinGas,
		targetLzEndpoint.address,
		mintIds.targetNetworkId.start,
		mintIds.targetNetworkId.end
	)

	await source.deployed()
	await target.deployed()

	await source.setMinDstGas(targetNetworkId, PACKET_TYPE, MinGas)
	await target.setMinDstGas(sourceNetworkId, PACKET_TYPE, MinGas)

	await sourceLzEndpoint.setDestLzEndpoint(target.address, targetLzEndpoint.address)
	await targetLzEndpoint.setDestLzEndpoint(source.address, sourceLzEndpoint.address)

	const targetAndSource = ethers.utils.solidityPack(['address', 'address'], [target.address, source.address])
	await source.setTrustedRemote(targetNetworkId, targetAndSource)
	const sourceAndTarget = ethers.utils.solidityPack(['address', 'address'], [source.address, target.address])
	await target.setTrustedRemote(sourceNetworkId, sourceAndTarget)

	const signers = await ethers.getSigners()
	const owner = signers[0]

	return {
		source,
		target,
		sourceNetworkId,
		targetNetworkId,
		sourceLzEndpoint,
		targetLzEndpoint,
		signers,
		owner,
		mintIds,
		MinGas,
		RecommendedGas,
	}
}
