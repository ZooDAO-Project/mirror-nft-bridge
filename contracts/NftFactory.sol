//SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import './zONFT.sol';

abstract contract NftFactory {
	// originalCollectionAddr => isContractExistOnCurrentNetwork
	// mapping(address => bool) internal _isContractExists;

	// originalCollectionContract => copyCollectionContract
	mapping(address => address) public copy;

	// collectionAddr => isCopy
	mapping(address => bool) public isCopy;

	// copyAddress => origCollAddr
	mapping(address => address) public originalCollectionAddresses;

	event NFTCopyDeployed(address copyContractAddress, address originalContractAddress);

	function getCopy(address originalCollectionContract) public view returns (address) {
		return copy[originalCollectionContract];
	}

	function _deployNewNft(
		address originalCollectionAddr,
		string memory name,
		string memory symbol
	) internal returns (address) {
		zONFT nft = new zONFT(name, symbol);

		copy[originalCollectionAddr] = address(nft);
		isCopy[address(nft)] = true;
		originalCollectionAddresses[address(nft)] = originalCollectionAddr;

		emit NFTCopyDeployed(address(nft), originalCollectionAddr);

		return address(nft);
	}

	// Alternative check for isCollectionContractExistOnCurrentNetwork()
	// TODO: should compare storing in mapping and calling this function
	function isContract(address _addr) private view returns (bool) {
		uint32 size;
		assembly {
			size := extcodesize(_addr)
		}
		return (size > 0);
	}

	// function isCopy(address originalCollectionAddr) public view returns (bool) {
	// 	return copy[originalCollectionAddr] != address(0);
	// }

	// function getCollectionCopyAddress(address originalCollectionAddr) public view returns (address) {
	// 	return copy[originalCollectionAddr];
	// }
}
