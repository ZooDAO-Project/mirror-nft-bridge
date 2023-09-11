//SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import './ReflectedNFT.sol';
import 'hardhat/console.sol';
import '@openzeppelin/contracts/proxy/Clones.sol';

/// @title ReflectionCreator - assisting contract to deploy ReflectedNFT
/// @author 0xslava
/// @notice Stores logic to deploy ReflectedNFT and record all required params
abstract contract ReflectionCreator {
	/// @notice Address of ReflectedNFT on network
	/// @dev For every bridged collection minimal proxy would be deployed with this implementation address
	address public implementation;

	/// @notice Returns ReflectedNFT address on current chain by original collection address as unique identifier
	/// @dev originalCollectionContract => reflectionCollectionContract
	mapping(address => address) public reflection;

	/// @notice Returns if collection address on current chain is reflection (copy)
	/// @dev collectionAddr => isReflection
	mapping(address => bool) public isReflection;

	/// @notice Returns original collection address by address of it's reflection (copy) on current chain
	/// @dev reflectionAddress => origCollAddr
	mapping(address => address) public originalCollectionAddresses;

	event NFTReflectionDeployed(address reflectionContractAddress, address originalContractAddress);

	constructor(address _implementation) {
		// Sets address for ReflectedNFT implementation contract
		// To which minimal proxies will be delegate calling
		implementation = _implementation;
	}

	/// @notice Creates reflection (copy) of oringinal collection with original name and symbol
	/// @param originalCollectionAddr Address of original collection on original chain as unique identifier
	/// @param name name of original collection to pass to ReflectedNFT
	/// @param symbol symbol of original collection to pass to ReflectedNFT
	/// @return address of deployed ReflectedNFT contract
	function _deployReflection(
		address originalCollectionAddr,
		string memory name,
		string memory symbol
	) internal returns (address) {
		address _reflection = Clones.clone(implementation);
		ReflectedNFT(_reflection).init(name, symbol);

		reflection[originalCollectionAddr] = _reflection;
		isReflection[_reflection] = true;
		originalCollectionAddresses[_reflection] = originalCollectionAddr;

		emit NFTReflectionDeployed(_reflection, originalCollectionAddr);

		return _reflection;
	}
}
