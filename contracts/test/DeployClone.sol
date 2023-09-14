//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../ReflectionCreator.sol';

contract DeployClone is ReflectionCreator {
	constructor(address _implementation) ReflectionCreator(_implementation) {}

	/// @dev exposes internal _deploy function to check gas expenditure
	function deployClone(
		address originalCollectionAddress,
		string memory name,
		string memory symbol
	) public returns (address) {
		return _deployReflection(Origin(block.chainid, originalCollectionAddress), name, symbol);
	}
}
