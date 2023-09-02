//SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

// ZooDAO Omnichain NFT
contract ReflectedNFT is ERC721URIStorage, Ownable {
	constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {}

	function mint(address to, uint tokenId, string calldata _tokenURI) public onlyOwner {
		_mint(to, tokenId);
		_setTokenURI(tokenId, _tokenURI);
	}

	function burn(address from, uint256 tokenId) public onlyOwner {
		require(from == ownerOf(tokenId), 'ReflectedNFT: caller is not the owner');
		_burn(tokenId);
	}
}
