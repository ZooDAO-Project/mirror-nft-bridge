//SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import '@openzeppelin/contracts/access/Ownable.sol';
import './NftFactory.sol';
import './interfaces/IBridge.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';

contract Bridge is NftFactory, IBridge, IERC721Receiver, Ownable {
	mapping(address => bool) original;

	// TODO: NFT can be sold on target chain and should be returned on source chain to a new owner
	// collection => tokenId => owner
	// mapping(address => mapping(uint256 => address)) public owners;

	// targetNetworkId => trustedRemote
	mapping(uint256 => address) public trustedRemote;

	/* EVENTS */
	event NFTReceived(address operator, address from, uint256 tokenId, bytes data);

	event MessageSend(address collection, string name, string symbol, uint256 tokenId, string tokenURI, address owner);

	event MessageReceived(
		address collection,
		string name,
		string symbol,
		uint256 tokenId,
		string tokenURI,
		address owner
	);

	event TrustedRemoteSet(uint256 targetNetworkId, address trustedRemote);

	function bridge(address collectionAddr, uint256 tokenId, uint256 targetNetworkId) public {
		zONFT collection = zONFT(collectionAddr);
		collection.safeTransferFrom(msg.sender, address(this), tokenId);

		address target = trustedRemote[targetNetworkId];
		string memory name = collection.name();
		string memory symbol = collection.symbol();
		string memory tokenURI = collection.tokenURI(tokenId);

		IBridge(target).lzReceive(collectionAddr, name, symbol, tokenId, tokenURI, msg.sender);

		// Burn NFT if it's copy
		// if (isCopy[collectionAddr]) {
		// 	collection.burn(tokenId);
		// }

		if (!isCollectionContractExistOnCurrentNetwork(collectionAddr)) {
			_isContractExists[collectionAddr] = true;
		}

		emit MessageSend(collectionAddr, name, symbol, tokenId, tokenURI, msg.sender);
	}

	function lzReceive(
		address originalCollectionAddr,
		string calldata name,
		string calldata symbol,
		uint256 tokenId,
		string calldata tokenURI,
		address _owner
	) public returns (address) {
		emit MessageReceived(originalCollectionAddr, name, symbol, tokenId, tokenURI, _owner);

		// 1. is there contract on current network?
		// if (isThereContract[originalCollectionAddr]) {}

		// 2. is it copy?
		// if (getCopy[originalCollectionAddr] != address(0)) {}

		// if (true) {
		// 	// Transfered to owner got from message, not the recorded owner in contract
		// 	// because it could be sold or transfered on source chain
		// 	collection.safeTransferFrom(address(this), _owner, tokenId);
		// 	return collectionAddr;
		// } else {
		// 	address copy = _deployNewNft(name, symbol);
		// 	return copy;
		// }

		return address(0);
	}

	function setTrustedRemote(uint256 targetNetworkId, address trustedRemoteAddr) public onlyOwner {
		trustedRemote[targetNetworkId] = trustedRemoteAddr;

		emit TrustedRemoteSet(targetNetworkId, trustedRemoteAddr);
	}

	/**
	 * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
	 * by `operator` from `from`, this function is called.
	 *
	 * It must return its Solidity selector to confirm the token transfer.
	 * If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.
	 *
	 * The selector can be obtained in Solidity with `IERC721Receiver.onERC721Received.selector`.
	 */
	function onERC721Received(
		address operator,
		address from,
		uint256 tokenId,
		bytes calldata data
	) external returns (bytes4) {
		emit NFTReceived(operator, from, tokenId, data);
		return IERC721Receiver.onERC721Received.selector;
	}
}
