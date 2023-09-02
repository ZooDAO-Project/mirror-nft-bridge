//SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import './ReflectedNFT.sol';

abstract contract ReflectionCreator {
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
		ReflectedNFT nft = new ReflectedNFT(name, symbol);

		reflection[originalCollectionAddr] = address(nft);
		isReflection[address(nft)] = true;
		originalCollectionAddresses[address(nft)] = originalCollectionAddr;

		emit NFTReflectionDeployed(address(nft), originalCollectionAddr);

		return address(nft);
	}
}
