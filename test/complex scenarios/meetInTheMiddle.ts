import { expect } from 'chai'
import { deployMultipleBridges } from './_.fixtures'
import { deployNFTWithMint, getAdapterParamsAndFeesAmount } from '../Mirror/_.fixtures'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'
import { expectToBeRevertedWith } from '../_utils'

export const meetInTheMiddle = async function () {
	const { nft, owner, tokenId } = await loadFixture(deployNFTWithMint)
	const { ethBridge, moonBridge, arbBridge, networkIds, chainIds } = await loadFixture(deployMultipleBridges)
	await ethBridge.changeCollectionEligibility([nft.address], true)

	await nft.mint(owner.address, 1)
	await nft.setApprovalForAll(ethBridge.address, true)

	const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
		nft,
		[tokenId],
		networkIds.moonNetworkId,
		ethBridge,
		false
	)

	const zeroAddress = ethers.constants.AddressZero

	await ethBridge.createReflection(
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

	await ethBridge.createReflection(
		nft.address,
		[tokenId + 1],
		networkIds.arbNetworkId,
		owner.address,
		owner.address,
		zeroAddress,
		adapterParams,
		{
			value: fees[0],
		}
	)

	expect(await nft.ownerOf(tokenId)).to.be.eq(ethBridge.address)
	expect(await nft.ownerOf(tokenId + 1)).to.be.eq(ethBridge.address)

	const arbReflectionAddr = await arbBridge.reflection(chainIds.ethChainId, nft.address)

	const moonReflectionNftAddr = await moonBridge.reflection(chainIds.ethChainId, nft.address)
	const moonReflection = await ethers.getContractAt('ReflectedNFT', moonReflectionNftAddr)

	await moonBridge.createReflection(
		moonReflectionNftAddr,
		[tokenId],
		networkIds.arbNetworkId,
		owner.address,
		owner.address,
		zeroAddress,
		adapterParams,
		{
			value: fees[0],
		}
	)

	await expectToBeRevertedWith(moonReflection.ownerOf(tokenId), 'ERC721: invalid token ID')

	// Checkpoint on arbitrum contract
	const arbReflection = await ethers.getContractAt('ReflectedNFT', arbReflectionAddr)
	expect(await arbReflection.balanceOf(owner.address)).to.be.eq(2)

	expect(await arbReflection.ownerOf(tokenId)).to.be.eq(owner.address)
	expect(await arbReflection.ownerOf(tokenId + 1)).to.be.eq(owner.address)
}
