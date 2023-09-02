//SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import './zONFT.sol';

abstract contract NftFactory {
	function deployNewNft(string calldata name, string calldata symbol) public returns (address) {
		zONFT nft = new zONFT(name, symbol);
		return address(nft);
	}
}
