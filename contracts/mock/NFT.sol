//SPDX-License-Identifier: Unlicense

pragma solidity 0.8.18;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';

contract NFT is ERC721Enumerable {
	uint public number;
	using Strings for uint256;

	constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {}

	function initialize(uint _number) public {
		number = _number;
	}

	function _baseURI() internal pure override returns (string memory) {
		return 'https://ipfs.io/ipfs/QmTcsJujMBvRQL3gR6TeT4CBfUFayQScLYSKdViyCki7vR/';
	}

	function tokenURI(uint256 tokenId) public pure override returns (string memory) {
		return string(abi.encodePacked(_baseURI(), tokenId.toString(), '.gif'));
	}

	function mint(address _to, uint256 _quantity) public {
		for (uint i = 0; i < _quantity; i++) {
			_mint(_to, totalSupply() + 1);
		}
	}
}
