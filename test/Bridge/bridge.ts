import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { expectToBeRevertedWith } from '../_utils'
import { bridgeBackScenario, TxReturnType, simpleBridgeScenario, deployBridge, deployNFTWithMint } from './_.fixtures'

export const bridge = function () {
	describe('if collection is copy', function () {
		it('burns copy NFT', async function () {
			const { copy, tx, owner } = await bridgeBackScenario(TxReturnType.arrowFunction)

			await expect(tx).to.changeTokenBalance(copy, owner, -1)
		})

		it('sends and receives message with original collection address, not copy address', async function () {
			const { source, target, copy, nft, tx, owner, tokenId } = await bridgeBackScenario()

			await expect(tx)
				.to.emit(source, 'MessageSend')
				.withArgs(
					nft.address,
					await copy.name(),
					await copy.symbol(),
					tokenId,
					await nft.tokenURI(tokenId),
					owner.address
				)

			await expect(tx)
				.to.emit(target, 'MessageReceived')
				.withArgs(
					nft.address,
					await copy.name(),
					await copy.symbol(),
					tokenId,
					await nft.tokenURI(tokenId),
					owner.address
				)
		})
	})

	describe('else collection is original', function () {
		describe(`locks user's NFT on contract`, function () {
			it(`makes transfer from msg.sender to contract address`, async function () {
				const { source, nft, tx, owner, tokenId } = await simpleBridgeScenario(TxReturnType.arrowFunction)

				await expect(tx).to.changeTokenBalances(nft, [owner, source], [-1, 1])

				expect(await nft.ownerOf(tokenId)).to.be.eq(source.address)
			})

			it(`doesn't transfer without approve`, async function () {
				const { source, targetNetworkId } = await loadFixture(deployBridge)
				const { nft } = await loadFixture(deployNFTWithMint)

				const tokenId = 1
				const tx = source.bridge(nft.address, tokenId, targetNetworkId)

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
			.to.emit(source, 'MessageSend')
			.withArgs(
				nft.address,
				await nft.name(),
				await nft.symbol(),
				tokenId,
				await nft.tokenURI(tokenId),
				owner.address
			)
	})

	it(`Sends message to bridge contract on target network (mock logic atm, same network)`, async function () {
		const { nft, owner, tokenId, tx, target } = await simpleBridgeScenario()

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

	xit(`multiple bridges to check gas expenditure for first and following tx hardness`, async function () {
		const { source, targetNetworkId } = await loadFixture(deployBridge)
		const { nft, signers } = await loadFixture(deployNFTWithMint)

		const owner = signers[0].address
		const tokenId = 1

		await nft.mint(owner, 1)
		await nft.mint(owner, 1)
		await nft.mint(owner, 1)

		await nft.approve(source.address, tokenId)
		await nft.approve(source.address, tokenId + 1)
		await nft.approve(source.address, tokenId + 2)
		await nft.approve(source.address, tokenId + 3)

		await source.bridge(nft.address, tokenId, targetNetworkId)
		await source.bridge(nft.address, tokenId + 1, targetNetworkId)
		await source.bridge(nft.address, tokenId + 2, targetNetworkId)
		await source.bridge(nft.address, tokenId + 3, targetNetworkId)
	})
}
