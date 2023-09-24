import { expect } from 'chai'
import { deployMultipleBridges } from './_.fixtures'
import { deployNFTWithMint, getAdapterParamsAndFeesAmount } from '../Mirror/_.fixtures'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'
import { NFT } from '../../typechain-types'

export const oneAddressOnDifferentChains = async function () {
	const { nft, owner, tokenId, signers } = await loadFixture(deployNFTWithMint)
	const { ethBridge, moonBridge, networkIds, chainIds } = await loadFixture(deployMultipleBridges)

	// await ethBridge.changeCollectionEligibility([nft.address], true)
	// await moonBridge.changeCollectionEligibility([nft.address], true)

	await nft.approve(ethBridge.address, tokenId)

	await nft.mint(owner.address, 1)
	const secondTokenId = tokenId + 1
	await nft.approve(moonBridge.address, secondTokenId)

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
		owner.address,
		owner.address,
		zeroAddress,
		adapterParams,
		{
			value: fees[0],
		}
	)

	expect(await nft.ownerOf(tokenId)).to.be.eq(ethBridge.address)

	const moonReflectionNftAddr = await moonBridge.reflection(chainIds.ethChainId, nft.address)
	const moonReflection = (await ethers.getContractAt('NFT', moonReflectionNftAddr)) as NFT

	expect(await moonReflection.ownerOf(tokenId)).to.be.eq(owner.address)

	// Try to bridge NFT with same address from Moonbeam to Ethereum
	const params = await getAdapterParamsAndFeesAmount(nft, [tokenId], networkIds.moonNetworkId, ethBridge, false)

	await moonBridge.createReflection(
		nft.address,
		[secondTokenId],
		networkIds.ethNetworkId,
		owner.address,
		owner.address,
		zeroAddress,
		params.adapterParams,
		{ value: params.fees[0] }
	)

	const ethReflectionAddr = await ethBridge.reflection(chainIds.moonChainId, nft.address)
	const ethReflection = (await ethers.getContractAt('NFT', ethReflectionAddr)) as NFT

	expect(await nft.balanceOf(owner.address)).to.be.eq(0)
	expect(await ethReflection.balanceOf(owner.address)).to.be.eq(1)
}
