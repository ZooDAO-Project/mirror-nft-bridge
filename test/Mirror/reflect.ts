import { expect } from 'chai'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { NFTReflectionDeployedEvent } from '../../typechain-types/contracts/Mirror'
import {
	bridgeBackScenario,
	TxReturnType,
	simpleBridgeScenario,
	getAdapterParamsAndFeesAmount,
	bridgeBackMultipleScenario,
	simpleBridgeMultipleScenario,
} from './_.fixtures'
import { ethers } from 'hardhat'
import { ContractTransaction } from 'ethers'

export const reflect = function () {
	describe('if bridged to original chain', function () {
		it('returns locked NFT to owner', async function () {
			const { target, nft, tx, owner, tokenId } = await bridgeBackScenario(TxReturnType.arrowFunction)

			await expect(tx).to.changeTokenBalances(nft, [target, owner], [-1, 1])

			expect(await nft.ownerOf(tokenId)).to.be.eq(owner.address)
		})

		it('returns multiple locked NFT to owner', async function () {
			const { target, nft, tx, owner, tokenId } = await bridgeBackMultipleScenario(TxReturnType.arrowFunction)

			await expect(tx).to.changeTokenBalances(nft, [target, owner], [-3, 3])

			expect(await nft.ownerOf(tokenId)).to.be.eq(owner.address)
			expect(await nft.ownerOf(tokenId + 1)).to.be.eq(owner.address)
			expect(await nft.ownerOf(tokenId + 2)).to.be.eq(owner.address)
		})

		it('emits NFTReturned event', async function () {
			const { target, nft, tx, tokenId, owner } = await bridgeBackScenario()

			await expect(tx).to.emit(target, 'NFTReturned').withArgs(nft.address, [tokenId], owner.address)
		})
	})

	describe('else bridged to non-original chain', function () {
		describe(`if reflection contract doesn't exist`, function () {
			it(`deploys new NFT contract for bridged tokens`, async function () {
				const { target, nft, tx } = await simpleBridgeScenario()

				await expect(tx).to.emit(target, 'NFTReflectionDeployed').withArgs(anyValue, nft.address)
			})

			it(`records deployed contract's address to mapping: reflection`, async function () {
				const { target, nft, reflection } = await simpleBridgeScenario()

				expect(await target.reflection(nft.address)).to.be.eq(reflection.address)
			})

			it(`records deployed contract's address to mapping: isReflection`, async function () {
				const { target, reflection } = await simpleBridgeScenario()

				expect(await target.isReflection(reflection.address)).to.be.true
			})

			it(`records deployed contract's address to mapping: originalCollectionAddresses`, async function () {
				const { target, nft, reflection } = await simpleBridgeScenario()

				const origCollAddr = await target.originalCollectionAddresses(reflection.address)

				expect(origCollAddr).to.be.eq(nft.address)
			})
		})

		describe('else reflection contract exists', function () {
			it(`doesn't deploy new contract`, async function () {
				const { source, nft, owner, targetNetworkId } = await simpleBridgeScenario()

				await nft.mint(owner.address, 1)
				const tokenId = 2
				await nft.approve(source.address, tokenId)

				const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
					nft,
					[tokenId],
					targetNetworkId,
					source,
					true
				)

				const tx = await source.createReflection(
					nft.address,
					[tokenId],
					targetNetworkId,
					owner.address,
					ethers.constants.AddressZero,
					adapterParams,
					{ value: fees[0] }
				)
				const receipt = await tx.wait()

				const event = receipt.events?.find(
					(event) => event.event === 'NFTReflectionDeployed'
				) as NFTReflectionDeployedEvent

				expect(event).to.be.undefined
			})

			it(`bridges NFT to existing contract`, async function () {
				const { source, nft, owner, targetNetworkId, reflection } = await simpleBridgeScenario()

				await nft.mint(owner.address, 1)
				const tokenId = 2
				await nft.approve(source.address, tokenId)

				const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
					nft,
					[tokenId],
					targetNetworkId,
					source,
					true
				)

				await source.createReflection(
					nft.address,
					[tokenId],
					targetNetworkId,
					owner.address,
					ethers.constants.AddressZero,
					adapterParams,
					{ value: fees[0] }
				)

				expect(await reflection.balanceOf(owner.address)).to.be.eq('2')
			})
		})

		it('mints token with correct tokenId to owner', async function () {
			const { owner, reflection } = await simpleBridgeScenario()

			expect(await reflection.balanceOf(owner.address)).to.be.eq('1')
		})

		it('mints multiple token with correct tokenId to owner', async function () {
			const { owner, reflection, tokenId } = await simpleBridgeMultipleScenario()

			expect(await reflection.ownerOf(tokenId)).to.be.eq(owner.address)
			expect(await reflection.ownerOf(tokenId + 1)).to.be.eq(owner.address)
			expect(await reflection.ownerOf(tokenId + 2)).to.be.eq(owner.address)
		})

		it('sets correct tokenURI', async function () {
			const { nft, tokenId, reflection } = await simpleBridgeScenario()

			const originalTokenURI = await nft.tokenURI(tokenId)
			const reflectionTokenURI = await reflection.tokenURI(tokenId)

			expect(reflectionTokenURI).to.be.eq(originalTokenURI)
		})

		it('mints multiple token with correct tokenId to owner', async function () {
			const { reflection, tokenId, nft } = await simpleBridgeMultipleScenario()

			expect(await nft.tokenURI(tokenId)).to.be.eq(await reflection.tokenURI(tokenId))
			expect(await nft.tokenURI(tokenId + 1)).to.be.eq(await reflection.tokenURI(tokenId + 1))
			expect(await nft.tokenURI(tokenId + 2)).to.be.eq(await reflection.tokenURI(tokenId + 2))
		})

		it('emits NFTBridged event', async function () {
			const { tx, target, nft, owner, tokenId } = await simpleBridgeScenario()

			await expect(tx)
				.to.emit(target, 'NFTBridged')
				.withArgs(nft.address, [tokenId], [await nft.tokenURI(tokenId)], owner.address)
		})

		it('emits one NFTBridged event for multiple tokens', async function () {
			const { tx, target, nft, owner, tokenId } = await simpleBridgeMultipleScenario()

			await expect(tx)
				.to.emit(target, 'NFTBridged')
				.withArgs(
					nft.address,
					[tokenId, tokenId + 1, tokenId + 2],
					[await nft.tokenURI(tokenId), await nft.tokenURI(tokenId + 1), await nft.tokenURI(tokenId + 2)],
					owner.address
				)
		})
	})

	it('should be able to bridge back 10 NFTs', async function () {
		const NFTsToBridge = 10
		const { nft, tx, owner } = await bridgeBackMultipleScenario(TxReturnType.arrowFunction, NFTsToBridge)

		await expect(tx).to.changeTokenBalance(nft, owner, 10)
	})
}
