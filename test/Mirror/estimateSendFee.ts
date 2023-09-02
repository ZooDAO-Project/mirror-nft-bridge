import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { deployBridge, deployNFTWithMint } from './_.fixtures'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { deepCopy } from 'ethers/lib/utils'
import { log } from 'console'

export const estimateSendFee = async function () {
	it('Estimation is the same as in the lzEndpoint', async function () {
		const { source, sourceLzEndpoint, targetNetworkId } = await loadFixture(deployBridge)
		const { nft, tokenId, owner } = await loadFixture(deployNFTWithMint)

		const RecommendedGas = '2000000'
		const adapterParams = ethers.utils.solidityPack(['uint16', 'uint256'], [1, RecommendedGas])
		const abi = new ethers.utils.AbiCoder()

		const payload = abi.encode(
			['address', 'string', 'string', 'uint256[]', 'string[]', 'address'],
			[nft.address, await nft.name(), await nft.symbol(), [tokenId], [await nft.tokenURI(tokenId)], owner.address]
		)

		const feesFromEndpoint = await sourceLzEndpoint.estimateFees(
			targetNetworkId,
			source.address,
			payload,
			false,
			adapterParams
		)
		const fees = await source.estimateSendFee(nft.address, tokenId, targetNetworkId, false, adapterParams)

		const writableFees = JSON.parse(JSON.stringify(fees))
		log(writableFees)
		const feeAmountToPlatform = await source.feeAmount()
		writableFees[0] = writableFees[0].sub(feeAmountToPlatform)
		writableFees.nativeFee = writableFees.nativeFee.sub(feeAmountToPlatform)

		expect(writableFees).to.be.deep.eq(feesFromEndpoint)
	})

	it('Batch send estimation with multiple tokenIds and same amount of tokenURIs', async function () {
		const { source, sourceLzEndpoint, targetNetworkId } = await loadFixture(deployBridge)
		const { nft, tokenId, owner } = await loadFixture(deployNFTWithMint)

		const RecommendedGas = '2000000'
		const adapterParams = ethers.utils.solidityPack(['uint16', 'uint256'], [1, RecommendedGas])
		const abi = new ethers.utils.AbiCoder()

		const payload = abi.encode(
			['address', 'string', 'string', 'uint256[]', 'string[]', 'address'],
			[nft.address, await nft.name(), await nft.symbol(), [tokenId], [await nft.tokenURI(tokenId)], owner.address]
		)

		const feesFromEndpoint = await sourceLzEndpoint.estimateFees(
			targetNetworkId,
			source.address,
			payload,
			false,
			adapterParams
		)

		const batchFees = await source.estimateSendBatchFee(
			nft.address,
			[tokenId],
			targetNetworkId,
			false,
			adapterParams
		)

		const feeAmountToPlatform = await source.feeAmount()
		batchFees[0] = batchFees[0].sub(feeAmountToPlatform)
		batchFees.nativeFee = batchFees.nativeFee.sub(feeAmountToPlatform)

		expect(batchFees).to.be.deep.eq(feesFromEndpoint)
	})
}
