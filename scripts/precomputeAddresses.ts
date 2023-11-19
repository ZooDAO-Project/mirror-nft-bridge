import { ethers } from 'hardhat'
import { Mirror__factory, ReflectionCreator } from '../typechain-types'

const collections: string[] = ['0x6661c87764AdF7FffA3c7922FA6EDFa2fd62cCfC']

async function main() {
	const Mirror = (await ethers.getContractFactory('Mirror')) as Mirror__factory
	const mirror = Mirror.attach('0xCf374dBe799523b0287256722e2565F69bd6A1C2')

	for (const collection of collections) {
		const origin: ReflectionCreator.OriginStruct = {
			collectionAddress: collection,
			chainId: 1,
		}
		const predictedAddr = await mirror.predictReflectionAddress(origin)
		console.log(predictedAddr)
	}
}

main()
	.then(() => {
		process.exit(0)
	})
	.catch((error) => {
		console.log(error)
		process.exit(1)
	})
