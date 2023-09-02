//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IBridge {
	function bridge(address collectionAddr, uint256 tokenId, uint256 targetNetworkId) external;

	function lzReceive(
		address collection,
		string calldata name,
		string calldata symbol,
		uint256 tokenId,
		string calldata tokenURI,
		address owner
	) external;
}
