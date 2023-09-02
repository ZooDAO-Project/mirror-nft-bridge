import { expect } from 'chai'
import { deployMultipleBridges } from './_.fixtures'
import { deployNFTWithMint, getAdapterParamsAndFeesAmount } from '../Mirror/_.fixtures'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'
import { NFT } from '../../typechain-types'

export const bridgeWithChangingOwnerViaSettingReceiver = async function () {
	const { nft, owner, tokenId, signers } = await loadFixture(deployNFTWithMint)
	const { ethBridge, moonBridge, networkIds, lzEndpoints } = await loadFixture(deployMultipleBridges)

	await ethBridge.changeCollectionEligibility([nft.address], true)

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

	await ethBridge.createReflection(
		nft.address,
		[tokenId],
		networkIds.moonNetworkId,
		signers[5].address,
		owner.address,
		zeroAddress,
		adapterParams,
		{
			value: fees[0],
		}
	)

	expect(await nft.ownerOf(tokenId)).to.be.eq(ethBridge.address)

	const moonReflectionNftAddr = await moonBridge.reflection(nft.address)
	const moonReflection = (await ethers.getContractAt('NFT', moonReflectionNftAddr)) as NFT

	expect(await moonReflection.ownerOf(tokenId)).to.be.eq(signers[5].address)

	// Sold NFT $ on moonbeam
	// await moonReflection.transferFrom(owner.address, signers[5].address, tokenId)

	await moonBridge
		.connect(signers[5])
		.createReflection(
			moonReflectionNftAddr,
			[tokenId],
			networkIds.ethNetworkId,
			signers[3].address,
			signers[5].address,
			zeroAddress,
			adapterParams,
			{
				value: fees[0],
			}
		)

	expect(await moonReflection.balanceOf(signers[5].address)).to.be.eq(0)

	expect(await nft.ownerOf(tokenId)).to.be.eq(signers[3].address)
}
