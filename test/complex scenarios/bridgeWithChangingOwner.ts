import { expect } from 'chai'
import { deployMultipleBridges } from './_.fixtures'
import { deployNFTWithMint, getAdapterParamsAndFeesAmount } from '../Bridge/_.fixtures'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'
import { NFT } from '../../typechain-types'

export const bridgeWithChangingOwner = async function () {
	const { nft, owner, tokenId, signers } = await loadFixture(deployNFTWithMint)
	const { ethBridge, moonBridge, networkIds, lzEndpoints } = await loadFixture(deployMultipleBridges)

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

	expect(await nft.ownerOf(tokenId)).to.be.eq(owner.address)

	await ethBridge.bridge(nft.address, tokenId, networkIds.moonNetworkId, owner.address, zeroAddress, adapterParams, {
		value: fees[0],
	})

	expect(await nft.ownerOf(tokenId)).to.be.eq(ethBridge.address)

	const moonCopyNftAddr = await moonBridge.copy(nft.address)
	const moonCopy = (await ethers.getContractAt('NFT', moonCopyNftAddr)) as NFT

	expect(await moonCopy.ownerOf(tokenId)).to.be.eq(owner.address)

	// Sold NFT $ on moonbeam
	await moonCopy.transferFrom(owner.address, signers[5].address, tokenId)

	await moonBridge
		.connect(signers[5])
		.bridge(moonCopyNftAddr, tokenId, networkIds.ethNetworkId, owner.address, zeroAddress, adapterParams, {
			value: fees[0],
		})

	expect(await moonCopy.balanceOf(signers[5].address)).to.be.eq(0)

	expect(await nft.ownerOf(tokenId)).to.be.eq(signers[5].address)
}
