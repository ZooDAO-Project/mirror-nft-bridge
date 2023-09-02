import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deployMockONFT } from './_.fixtures'
import { ethers } from 'hardhat'

describe('LzEndpointMock', function () {
	it('deploys', async function () {
		const { source, target } = await loadFixture(deployMockONFT)

		expect(source).not.to.be.undefined
		expect(target).not.to.be.undefined

		expect(source.address).to.be.properAddress
		expect(target.address).to.be.properAddress
	})

	it('trusted remotes set', async function () {
		const { source, target, sourceNetworkId, targetNetworkId } = await loadFixture(deployMockONFT)

		const targetAndSource = ethers.utils.solidityPack(['address', 'address'], [target.address, source.address])
		let isTrustedRemote = await source.isTrustedRemote(targetNetworkId, targetAndSource)
		expect(isTrustedRemote).to.be.true

		const sourceAndTarget = ethers.utils.solidityPack(['address', 'address'], [source.address, target.address])
		isTrustedRemote = await target.isTrustedRemote(sourceNetworkId, sourceAndTarget)
		expect(isTrustedRemote).to.be.true
	})

	it('ONFTs are minted with correct IDs', async function () {
		const { source, target, mintIds, owner } = await loadFixture(deployMockONFT)

		await source.mint()
		let tokenId = mintIds.sourceNetworkId.start
		expect(await source.ownerOf(tokenId)).to.be.eq(owner.address)

		await target.mint()
		tokenId = mintIds.targetNetworkId.start
		expect(await target.ownerOf(tokenId)).to.be.eq(owner.address)
	})

	it('ONFTs are transferred to another chain via LzEndpointMock', async function () {
		const { source, target, mintIds, owner, targetNetworkId, RecommendedGas } = await loadFixture(deployMockONFT)

		await source.mint()
		const tokenId = mintIds.sourceNetworkId.start

		const adapterParams = ethers.utils.solidityPack(['uint16', 'uint256'], [1, RecommendedGas]) // default adapterParams example
		const fees = await source.estimateSendFee(targetNetworkId, owner.address, tokenId, false, adapterParams)

		const tx = await source.sendFrom(
			owner.address,
			targetNetworkId,
			owner.address,
			tokenId,
			owner.address,
			ethers.constants.AddressZero,
			adapterParams,
			{
				value: fees[0],
			}
		)

		await expect(tx).to.emit(target, 'Transfer').withArgs(ethers.constants.AddressZero, owner.address, tokenId)

		expect(await target.ownerOf(tokenId)).to.be.eq(owner.address)
	})
})
