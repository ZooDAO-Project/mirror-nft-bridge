import { expect } from 'chai'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { NFTReflectionDeployedEvent } from '../../typechain-types/contracts/Mirror'
import { bridgeBackScenario, TxReturnType, simpleBridgeScenario, getAdapterParamsAndFeesAmount } from './_.fixtures'
import { ethers } from 'hardhat'

export const receive = function () {
	describe('if bridged to original chain', function () {
		it('returns locked NFT to owner', async function () {
			const { target, nft, tx, owner, tokenId } = await bridgeBackScenario(TxReturnType.arrowFunction)

			await expect(tx).to.changeTokenBalances(nft, [target, owner], [-1, 1])

			expect(await nft.ownerOf(tokenId)).to.be.eq(owner.address)
		})

		it('emits NFTReturned event', async function () {
			const { target, nft, tx, tokenId, owner } = await bridgeBackScenario()

			await expect(tx).to.emit(target, 'NFTReturned').withArgs(nft.address, tokenId, owner.address)
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
				const { source, nft, owner, targetNetworkId, sourceLzEndpoint } = await simpleBridgeScenario()

				await nft.mint(owner.address, 1)
				const tokenId = 2
				await nft.approve(source.address, tokenId)

				const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
					nft,
					tokenId,
					owner,
					targetNetworkId,
					source,
					sourceLzEndpoint
				)

				const tx = await source.createReflection(
					nft.address,
					tokenId,
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
				const { source, target, nft, owner, targetNetworkId, sourceLzEndpoint, reflection } =
					await simpleBridgeScenario()

				await nft.mint(owner.address, 1)
				const tokenId = 2
				await nft.approve(source.address, tokenId)

				const { fees, adapterParams } = await getAdapterParamsAndFeesAmount(
					nft,
					tokenId,
					owner,
					targetNetworkId,
					source,
					sourceLzEndpoint
				)

				const tx = await source.createReflection(
					nft.address,
					tokenId,
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

		it('sets correct tokenURI', async function () {
			const { nft, tokenId, reflection } = await simpleBridgeScenario()

			const originalTokenURI = await nft.tokenURI(tokenId)
			const reflectionTokenURI = await reflection.tokenURI(tokenId)

			expect(reflectionTokenURI).to.be.eq(originalTokenURI)
		})

		it('emits NFTBridged event', async function () {
			const { tx, target, nft, owner, tokenId } = await simpleBridgeScenario()

			await expect(tx)
				.to.emit(target, 'NFTBridged')
				.withArgs(nft.address, tokenId, await nft.tokenURI(tokenId), owner.address)
		})
	})

	it(`emits MessageReceived event / receives message`, async function () {
		const { tx, target, nft, owner, tokenId } = await simpleBridgeScenario()

		await expect(tx)
			.to.emit(target, 'NFTBridged')
			.withArgs(nft.address, tokenId, await nft.tokenURI(tokenId), owner.address)
	})
}
