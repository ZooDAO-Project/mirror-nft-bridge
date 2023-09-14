//SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import '../Mirror.sol';

/// @dev This contract isfor testing using both chainId and original collection address as unique identifier
/// @dev created to test implementation of WP-H1
contract MirrorTest is Mirror {
	uint private chainId;

	constructor(
		address _lzEndpoint,
		uint256 _feeAmount,
		address _feeReceiver,
		address _reflectedNftImplementation,
		uint _chainId
	) Mirror(_lzEndpoint, _feeAmount, _feeReceiver, _reflectedNftImplementation) {
		chainId = _chainId;
	}

	/// @dev Replaces getChainId in original Mirror to simulate different networks in one local blockchain
	function getChainId() public view override returns (uint) {
		return chainId;
	}
}
