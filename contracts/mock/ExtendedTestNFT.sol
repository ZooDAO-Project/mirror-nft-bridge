//SPDX-License-Identifier: Unlicense

pragma solidity 0.8.18;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';

contract ExtendedTestNFT is ERC721URIStorage {
	uint public number;
	uint256 public totalSupply;
	using Strings for uint256;

	constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {}

	function initialize(uint _number) public {
		number = _number;
	}

	function _baseURI() internal pure override returns (string memory) {
		return 'https://gateway.pinata.cloud/ipfs/QmQe92oxpt6uZLA6MYvv8pioxyDszonh7Gw9upz1nCA4T9/';
	}

	function mint(address _to, uint256 _quantity) public {
		for (uint i = 0; i < _quantity; i++) {
			_mint(_to, totalSupply + 1);
			totalSupply += 1;
		}
	}

	function setTokenURI(uint256 tokenId, string calldata _tokenURI) public {
		_setTokenURI(tokenId, _tokenURI);
	}

	function burn(uint256 tokenId) public {
		_burn(tokenId);
	}
}
