import { expect } from 'chai'
import { deployMultipleBridges } from './_.fixtures'
import { deployNFTWithMint, getAdapterParamsAndFeesAmount } from '../Mirror/_.fixtures'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'
import { NFT } from '../../typechain-types'

export const complexRoute = async function () {
	const { nft, owner, tokenId } = await loadFixture(deployNFTWithMint)
	const { ethBridge, moonBridge, arbBridge, networkIds, lzEndpoints } = await loadFixture(deployMultipleBridges)

	await nft.approve(ethBridge.address, tokenId)

	const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
		nft,
		tokenId,
		owner,
		networkIds.moonNetworkId,
		ethBridge,
		lzEndpoints.ethLzEndpoint
	)

	const zeroAddress = ethers.constants.AddressZero
	await ethBridge.createReflection(
		nft.address,
		tokenId,
		networkIds.moonNetworkId,
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

	expect(await moonReflection.ownerOf(tokenId)).to.be.eq(owner.address)

	await moonBridge.createReflection(
		moonReflectionNftAddr,
		tokenId,
		networkIds.arbNetworkId,
		owner.address,
		zeroAddress,
		adapterParams,
		{
			value: fees[0],
		}
	)

	expect(await moonReflection.balanceOf(owner.address)).to.be.eq(0)

	const arbReflectionNftAddr = await arbBridge.reflection(nft.address)
	const arbReflection = (await ethers.getContractAt('NFT', arbReflectionNftAddr)) as NFT

	expect(await arbReflection.ownerOf(tokenId)).to.be.eq(owner.address)

	await arbBridge.createReflection(
		arbReflectionNftAddr,
		tokenId,
		networkIds.ethNetworkId,
		owner.address,
		zeroAddress,
		adapterParams,
		{
			value: fees[0],
		}
	)

	expect(await arbReflection.balanceOf(owner.address)).to.be.eq(0)

	expect(await nft.ownerOf(tokenId)).to.be.eq(owner.address)
}
