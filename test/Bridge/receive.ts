import { expect } from 'chai'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { NFTCopyDeployedEvent } from '../../typechain-types/contracts/Bridge'
import { bridgeBackScenario, TxReturnType, simpleBridgeScenario } from './_.fixtures'

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
		describe(`if copy contract doesn't exist`, function () {
			it(`deploys new NFT contract for bridged tokens`, async function () {
				const { target, nft, tx } = await simpleBridgeScenario()

				await expect(tx).to.emit(target, 'NFTCopyDeployed').withArgs(anyValue, nft.address)
			})

			it(`records deployed contract's address to mapping: copy`, async function () {
				const { target, nft, copy } = await simpleBridgeScenario()

				expect(await target.copy(nft.address)).to.be.eq(copy.address)
			})

			it(`records deployed contract's address to mapping: isCopy`, async function () {
				const { target, copy } = await simpleBridgeScenario()

				expect(await target.isCopy(copy.address)).to.be.true
			})

			it(`records deployed contract's address to mapping: originalCollectionAddresses`, async function () {
				const { target, nft, copy } = await simpleBridgeScenario()

				const origCollAddr = await target.originalCollectionAddresses(copy.address)

				expect(origCollAddr).to.be.eq(nft.address)
			})
		})

		describe('else copy contract exists', function () {
			it(`doesn't deploy new contract`, async function () {
				const { source, nft, owner, targetNetworkId } = await simpleBridgeScenario()

				await nft.mint(owner.address, 1)
				const tokenId = 2
				await nft.approve(source.address, tokenId)

				const tx = await source.bridge(nft.address, tokenId, targetNetworkId)
				const receipt = await tx.wait()

				const event = receipt.events?.find((event) => event.event === 'NFTCopyDeployed') as NFTCopyDeployedEvent

				expect(event).to.be.undefined
			})

			it(`bridges NFT to existing contract`, async function () {
				const { source, target, nft, owner, targetNetworkId, copy } = await simpleBridgeScenario()

				await nft.mint(owner.address, 1)
				const tokenId = 2
				await nft.approve(source.address, tokenId)

				await source.bridge(nft.address, tokenId, targetNetworkId)

				expect(await copy.balanceOf(owner.address)).to.be.eq('2')
			})
		})

		it('mints token with correct tokenId to owner', async function () {
			const { owner, copy } = await simpleBridgeScenario()

			expect(await copy.balanceOf(owner.address)).to.be.eq('1')
		})

		it('sets correct tokenURI', async function () {
			const { nft, tokenId, copy } = await simpleBridgeScenario()

			const originalTokenURI = await nft.tokenURI(tokenId)
			const copyTokenURI = await copy.tokenURI(tokenId)

			expect(copyTokenURI).to.be.eq(originalTokenURI)
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
			.to.emit(target, 'MessageReceived')
			.withArgs(
				nft.address,
				await nft.name(),
				await nft.symbol(),
				tokenId,
				await nft.tokenURI(tokenId),
				owner.address
			)
	})
}
