//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IBridge {
	function bridge(
		address collectionAddr,
		uint256 tokenId,
		uint16 targetNetworkId,
		address payable _refundAddress,
		address _zroPaymentAddress,
		bytes memory _adapterParams
	) external payable;
}
