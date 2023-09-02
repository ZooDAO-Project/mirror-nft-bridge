import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { expectToBeRevertedWith } from '../_utils'
import {
	bridgeBackScenario,
	TxReturnType,
	simpleBridgeScenario,
	deployBridge,
	deployNFTWithMint,
	bridgeBackMultipleScenario,
	simpleBridgeMultipleScenario,
	getAdapterParamsAndFeesAmount,
} from './_.fixtures'
import { ethers } from 'hardhat'
import { ContractTransaction } from 'ethers'

export const createReflection = function () {
	describe('if collection is reflection', function () {
		it('burns  NFTs reflection', async function () {
			const { reflection, tx, owner } = await bridgeBackScenario(TxReturnType.arrowFunction)

			await expect(tx).to.changeTokenBalance(reflection, owner, -1)
		})

		it('burns  NFT reflections', async function () {
			const { reflection, tx, owner, tokenId } = await bridgeBackMultipleScenario(TxReturnType.arrowFunction)

			await expect(tx).to.changeTokenBalance(reflection, owner, -3)

			const ownerOfBurned = async (tokenId: number) =>
				(await reflection.ownerOf(tokenId)) as any as ContractTransaction
			const error = 'ERC721: invalid token ID'

			await expectToBeRevertedWith(ownerOfBurned(tokenId), error)
			await expectToBeRevertedWith(ownerOfBurned(tokenId + 1), error)
			await expectToBeRevertedWith(ownerOfBurned(tokenId + 2), error)
		})

		it('sends and receives message with original collection address, not reflection address', async function () {
			const { source, target, reflection, nft, tx, owner, tokenId } = await bridgeBackScenario()

			await expect(tx)
				.to.emit(source, 'BridgeNFT')
				.withArgs(
					nft.address,
					await reflection.name(),
					await reflection.symbol(),
					[tokenId],
					[await nft.tokenURI(tokenId)],
					owner.address
				)

			await expect(tx).to.emit(target, 'NFTReturned').withArgs(nft.address, [tokenId], owner.address)
		})
	})

	describe('else collection is original', function () {
		describe(`locks user's NFT on contract`, function () {
			it(`makes transfer from msg.sender to contract address`, async function () {
				const { source, nft, tx, owner, tokenId } = await simpleBridgeScenario(TxReturnType.arrowFunction)

				await expect(tx).to.changeTokenBalances(nft, [owner, source], [-1, 1])

				expect(await nft.ownerOf(tokenId)).to.be.eq(source.address)
			})

			it(`makes transfer from msg.sender to contract address for multiple NFTs`, async function () {
				const { source, nft, tx, owner, tokenId } = await simpleBridgeMultipleScenario(
					TxReturnType.arrowFunction
				)

				await expect(tx).to.changeTokenBalances(nft, [owner, source], [-3, 3])

				expect(await nft.ownerOf(tokenId)).to.be.eq(source.address)
				expect(await nft.ownerOf(tokenId + 1)).to.be.eq(source.address)
				expect(await nft.ownerOf(tokenId + 2)).to.be.eq(source.address)
			})

			it(`doesn't transfer without approve`, async function () {
				const { source, targetNetworkId } = await loadFixture(deployBridge)
				const { nft, owner } = await loadFixture(deployNFTWithMint)
				await source.changeCollectionEligibility(nft.address, true)

				const tokenId = 1
				const tx = source.createReflection(
					nft.address,
					[tokenId],
					targetNetworkId,
					owner.address,
					ethers.constants.AddressZero,
					'0x'
				)

				await expectToBeRevertedWith(tx, 'ERC721: caller is not token owner or approved')
			})
		})

		it(`records that collection is original for current chain`, async function () {
			const { source, nft } = await simpleBridgeScenario()

			expect(await source.isOriginalChainForCollection(nft.address)).to.be.true
		})
	})

	it(`Sends message with params (collectionAddr, name, symbol, tokenId, owner) to another bridge contract`, async function () {
		const { nft, owner, tokenId, tx, source } = await simpleBridgeScenario()

		await expect(tx)
			.to.emit(source, 'BridgeNFT')
			.withArgs(
				nft.address,
				await nft.name(),
				await nft.symbol(),
				[tokenId],
				[await nft.tokenURI(tokenId)],
				owner.address
			)
	})

	it(`Sends message to bridge contract on target network (mock logic atm, same network)`, async function () {
		const { nft, owner, tokenId, tx, target } = await simpleBridgeScenario()

		await expect(tx)
			.to.emit(target, 'NFTBridged')
			.withArgs(nft.address, [tokenId], [await nft.tokenURI(tokenId)], owner.address)
	})

	it('should revert on repeating tokenIds', async function () {
		const { source, nft, tokenId, targetNetworkId, owner } = await simpleBridgeScenario(TxReturnType.arrowFunction)

		const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
			nft,
			[tokenId, tokenId],
			targetNetworkId,
			source,
			false
		)

		const tx = source.createReflection(
			nft.address,
			[tokenId, tokenId],
			targetNetworkId,
			owner.address,
			ethers.constants.AddressZero,
			adapterParams,
			{ value: fees[0] }
		)

		await expectToBeRevertedWith(tx, 'ERC721: transfer from incorrect owner')
	})

	it('should fail on trying to bridge already bridged NFT', async function () {
		const { source, nft, tokenId, targetNetworkId, owner } = await simpleBridgeScenario()

		const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
			nft,
			[tokenId],
			targetNetworkId,
			source,
			false
		)

		const tx = source.createReflection(
			nft.address,
			[tokenId, tokenId],
			targetNetworkId,
			owner.address,
			ethers.constants.AddressZero,
			adapterParams,
			{ value: fees[0] }
		)

		await expectToBeRevertedWith(tx, 'ERC721: transfer from incorrect owner')
	})
}
