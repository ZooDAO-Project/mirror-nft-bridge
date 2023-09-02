//SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import './zONFT.sol';

abstract contract NftFactory {
	// originalCollectionContract => reflectionCollectionContract
	mapping(address => address) public reflection;

	// collectionAddr => isReflection
	mapping(address => bool) public isReflection;

	// reflectionAddress => origCollAddr
	mapping(address => address) public originalCollectionAddresses;

	event NFTReflectionDeployed(address reflectionContractAddress, address originalContractAddress);

	function _deployReflection(
		address originalCollectionAddr,
		string memory name,
		string memory symbol
	) internal returns (address) {
		zONFT nft = new zONFT(name, symbol);

		reflection[originalCollectionAddr] = address(nft);
		isReflection[address(nft)] = true;
		originalCollectionAddresses[address(nft)] = originalCollectionAddr;

		emit NFTReflectionDeployed(address(nft), originalCollectionAddr);

		return address(nft);
	}
}
