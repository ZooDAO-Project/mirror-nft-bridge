import { expect } from 'chai'
import { deployMultipleBridges } from './_.fixtures'
import { deployNFTWithMint, getAdapterParamsAndFeesAmount } from '../Mirror/_.fixtures'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import hardhat, { ethers } from 'hardhat'

export const cheaperRepeatedBridges = async function () {
	hardhat.tracer.enabled = false
	const { nft, owner, tokenId, signers } = await loadFixture(deployNFTWithMint)
	const { ethBridge, moonBridge, networkIds, lzEndpoints } = await loadFixture(deployMultipleBridges)
	// await ethBridge.changeCollectionEligibility([nft.address], true)

	await nft.approve(ethBridge.address, tokenId)

	const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
		nft,
		[tokenId],
		networkIds.moonNetworkId,
		ethBridge,
		false
	)

	const zeroAddress = ethers.constants.AddressZero

	expect(await nft.ownerOf(tokenId)).to.be.eq(owner.address)

	const tx = await ethBridge.createReflection(
		nft.address,
		[tokenId],
		networkIds.moonNetworkId,
		owner.address,
		owner.address,
		zeroAddress,
		adapterParams,
		{
			value: fees[0],
		}
	)

	expect(tx).not.to.be.reverted

	await nft.mint(signers[6].address, 1)
	await nft.connect(signers[6]).approve(ethBridge.address, tokenId + 1)

	hardhat.tracer.enabled = true

	const gas = '350000'
	const newAdapterParams = ethers.utils.solidityPack(['uint16', 'uint256'], [1, gas])

	const lesserFees = await ethBridge.estimateSendBatchFee(
		nft.address,
		[tokenId + 1],
		networkIds.moonNetworkId,
		false,
		newAdapterParams
	)

	const repeatedBridge = await ethBridge
		.connect(signers[6])
		.createReflection(
			nft.address,
			[tokenId + 1],
			networkIds.moonNetworkId,
			owner.address,
			owner.address,
			zeroAddress,
			newAdapterParams,
			{
				value: lesserFees[0],
			}
		)

	expect(repeatedBridge).to.emit(moonBridge, 'NFTBridged')
	// expect(repeatedBridge).not.to.be.reverted
}
