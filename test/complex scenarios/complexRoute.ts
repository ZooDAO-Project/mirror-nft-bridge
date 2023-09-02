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
	await ethBridge.bridge(nft.address, tokenId, networkIds.moonNetworkId, owner.address, zeroAddress, adapterParams, {
		value: fees[0],
	})

	expect(await nft.ownerOf(tokenId)).to.be.eq(ethBridge.address)

	const moonCopyNftAddr = await moonBridge.copy(nft.address)
	const moonCopy = (await ethers.getContractAt('NFT', moonCopyNftAddr)) as NFT

	expect(await moonCopy.ownerOf(tokenId)).to.be.eq(owner.address)

	await moonBridge.bridge(
		moonCopyNftAddr,
		tokenId,
		networkIds.arbNetworkId,
		owner.address,
		zeroAddress,
		adapterParams,
		{
			value: fees[0],
		}
	)

	expect(await moonCopy.balanceOf(owner.address)).to.be.eq(0)

	const arbCopyNftAddr = await arbBridge.copy(nft.address)
	const arbCopy = (await ethers.getContractAt('NFT', arbCopyNftAddr)) as NFT

	expect(await arbCopy.ownerOf(tokenId)).to.be.eq(owner.address)

	await arbBridge.bridge(
		arbCopyNftAddr,
		tokenId,
		networkIds.ethNetworkId,
		owner.address,
		zeroAddress,
		adapterParams,
		{
			value: fees[0],
		}
	)

	expect(await arbCopy.balanceOf(owner.address)).to.be.eq(0)

	expect(await nft.ownerOf(tokenId)).to.be.eq(owner.address)
}
