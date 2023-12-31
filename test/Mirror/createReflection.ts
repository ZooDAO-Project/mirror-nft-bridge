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
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'

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
			const { source, target, targetChainId, reflection, nft, tx, owner, tokenId } = await bridgeBackScenario()
			// targetNetworkId - Ethereum in this example - NFT originated from Ethereum
			// But sourceChainId is Ethereum chain ID
			await expect(tx)
				.to.emit(source, 'BridgeNFT')
				.withArgs(
					[targetChainId, nft.address],
					await reflection.name(),
					await reflection.symbol(),
					[tokenId],
					[await nft.tokenURI(tokenId)],
					owner.address
				)

			await expect(tx).to.emit(target, 'UnlockedNFT').withArgs(nft.address, [tokenId], owner.address)
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
				// await source.changeCollectionEligibility([nft.address], true)

				const tokenId = 1
				const tx = source.createReflection(
					nft.address,
					[tokenId],
					targetNetworkId,
					owner.address,
					owner.address,
					ethers.constants.AddressZero,
					'0x',
					{ value: '1'.padEnd(18, '0') }
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
		const { nft, sourceChainId, owner, tokenId, tx, source } = await simpleBridgeScenario()

		await expect(tx)
			.to.emit(source, 'BridgeNFT')
			.withArgs(
				[sourceChainId, nft.address],
				await nft.name(),
				await nft.symbol(),
				[tokenId],
				[await nft.tokenURI(tokenId)],
				owner.address
			)
	})

	it(`Sends message to bridge contract on target network (mock logic atm, same network)`, async function () {
		const { nft, sourceChainId, owner, tokenId, tx, target } = await simpleBridgeScenario()

		await expect(tx)
			.to.emit(target, 'NFTBridged')
			.withArgs([sourceChainId, nft.address], anyValue, [tokenId], [await nft.tokenURI(tokenId)], owner.address)
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
			owner.address,
			ethers.constants.AddressZero,
			adapterParams,
			{ value: fees[0] }
		)

		await expectToBeRevertedWith(tx, 'ERC721: transfer from incorrect owner')
	})

	it('should be able to bridge 10 NFTs', async function () {
		const NFTsToBridge = 10
		const { nft, tx, owner } = await simpleBridgeMultipleScenario(TxReturnType.arrowFunction, NFTsToBridge)

		await expect(tx).to.changeTokenBalance(nft, owner, -10)
	})

	it('should revert if msg.sender is not the NFT owner on bridge', async function () {
		const { nft, owner, signers, source, tokenId, targetNetworkId } = await simpleBridgeScenario(
			TxReturnType.arrowFunction
		)

		const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
			nft,
			[tokenId],
			targetNetworkId,
			source,
			false
		)

		const tx = source
			.connect(signers[5])
			.createReflection(
				nft.address,
				[tokenId],
				targetNetworkId,
				owner.address,
				owner.address,
				ethers.constants.AddressZero,
				adapterParams,
				{ value: fees[0] }
			)

		await expectToBeRevertedWith(tx, 'ERC721: transfer from incorrect owner')
	})

	it('should revert if msg.sender is not the NFT owner on bridge BACK', async function () {
		const { nft, reflection, owner, signers, source, tokenId, targetNetworkId } = await bridgeBackScenario(
			TxReturnType.arrowFunction
		)

		const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
			nft,
			[tokenId],
			targetNetworkId,
			source,
			false
		)

		const tx = source
			.connect(signers[5])
			.createReflection(
				reflection.address,
				[tokenId],
				targetNetworkId,
				owner.address,
				owner.address,
				ethers.constants.AddressZero,
				adapterParams,
				{ value: fees[0] }
			)

		await expectToBeRevertedWith(tx, 'ReflectedNFT: caller is not the owner')
	})

	it('should revert on empty tokenIds array', async function () {
		const { nft, owner, source, tokenId, targetNetworkId } = await simpleBridgeScenario(TxReturnType.arrowFunction)

		const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
			nft,
			[tokenId],
			targetNetworkId,
			source,
			false
		)

		const tx = source.createReflection(
			nft.address,
			[],
			targetNetworkId,
			owner.address,
			owner.address,
			ethers.constants.AddressZero,
			adapterParams,
			{ value: fees[0] }
		)

		await expectToBeRevertedWith(tx, "Mirror: tokenIds weren't provided")
	})

	it.skip('should revert on collection address is zero', async function () {
		const { nft, owner, source, tokenId, targetNetworkId } = await simpleBridgeScenario(TxReturnType.arrowFunction)

		const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
			nft,
			[tokenId],
			targetNetworkId,
			source,
			false
		)

		const tx = source.createReflection(
			ethers.constants.AddressZero,
			[tokenId],
			targetNetworkId,
			owner.address,
			owner.address,
			ethers.constants.AddressZero,
			adapterParams,
			{ value: fees[0] }
		)

		await expectToBeRevertedWith(tx, 'Mirror: collection is not eligible')
	})

	it('should revert on incorrect target network ID', async function () {
		const { nft, owner, source, tokenId } = await simpleBridgeScenario(TxReturnType.arrowFunction)

		const incorrectTargetNetworkId = 100
		const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
			nft,
			[tokenId],
			incorrectTargetNetworkId,
			source,
			false
		)

		const tx = source.createReflection(
			nft.address,
			[tokenId],
			incorrectTargetNetworkId,
			owner.address,
			owner.address,
			ethers.constants.AddressZero,
			adapterParams,
			{ value: fees[0] }
		)

		await expectToBeRevertedWith(tx, 'LzApp: destination chain is not a trusted source')
	})

	it('should revert on receiver equal to zero address', async function () {
		const { nft, owner, source, tokenId, targetNetworkId } = await simpleBridgeScenario(TxReturnType.arrowFunction)

		const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
			nft,
			[tokenId],
			targetNetworkId,
			source,
			false
		)

		const tx = source.createReflection(
			nft.address,
			[tokenId],
			targetNetworkId,
			ethers.constants.AddressZero,
			owner.address,
			ethers.constants.AddressZero,
			adapterParams,
			{ value: fees[0] }
		)

		await expectToBeRevertedWith(tx, "Mirror: receiver can't be zero address")
	})
}
