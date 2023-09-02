//SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import '@openzeppelin/contracts/access/Ownable.sol';
import './NftFactory.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@layerzerolabs/solidity-examples/contracts/token/onft/ONFT721Core.sol';
import '@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol';

contract Mirror is NonblockingLzApp, NftFactory, IERC721Receiver {
	uint16 public constant FUNCTION_TYPE_SEND = 1;

	using BytesLib for bytes;

	mapping(address => bool) public isOriginalChainForCollection;

	/* EVENTS */
	event NFTReceived(address operator, address from, uint256 tokenId, bytes data);

	event NFTBridged(address originalCollectionAddress, uint256 tokenId, string tokenURI, address owner);

	event NFTReturned(address originalCollectionAddress, uint256 tokenId, address owner);

	event BridgeNFT(address collection, string name, string symbol, uint256 tokenId, string tokenURI, address owner);

	constructor(address _lzEndpoint) NonblockingLzApp(_lzEndpoint) {}

	function estimateSendFee(
		uint16 _dstChainId,
		bytes memory _toAddress,
		uint _tokenId,
		bool _useZro,
		bytes memory _adapterParams
	) public view returns (uint nativeFee, uint zroFee) {
		return estimateSendBatchFee(_dstChainId, _toAddress, _toSingletonArray(_tokenId), _useZro, _adapterParams);
	}

	function estimateSendBatchFee(
		uint16 _dstChainId,
		bytes memory _toAddress,
		uint[] memory _tokenIds,
		bool _useZro,
		bytes memory _adapterParams
	) public view returns (uint nativeFee, uint zroFee) {
		bytes memory payload = abi.encode(_toAddress, _tokenIds);
		return lzEndpoint.estimateFees(_dstChainId, address(this), payload, _useZro, _adapterParams);
	}

	function createReflection(
		address collectionAddr,
		uint256 tokenId,
		uint16 targetNetworkId,
		address payable _refundAddress,
		address _zroPaymentAddress,
		bytes memory _adapterParams
	) public payable {
		zONFT collection = zONFT(collectionAddr);

		string memory name = collection.name();
		string memory symbol = collection.symbol();
		string memory tokenURI = collection.tokenURI(tokenId);

		address originalCollectionAddress;

		if (isReflection[collectionAddr]) {
			//	NFT is reflection - burn
			collection.burn(tokenId);
			originalCollectionAddress = originalCollectionAddresses[collectionAddr];
		} else {
			// Is original contract
			// Lock NFT on contract
			collection.safeTransferFrom(msg.sender, address(this), tokenId);
			isOriginalChainForCollection[collectionAddr] = true;
			originalCollectionAddress = collectionAddr;
		}

		bytes memory _payload = abi.encode(originalCollectionAddress, name, symbol, tokenId, tokenURI, msg.sender);

		// _checkGasLimit(targetNetworkId, FUNCTION_TYPE_SEND, _adapterParams, 1500000);

		_lzSend(targetNetworkId, _payload, _refundAddress, _zroPaymentAddress, _adapterParams, msg.value);

		emit BridgeNFT(originalCollectionAddress, name, symbol, tokenId, tokenURI, msg.sender);
	}

	function _nonblockingLzReceive(uint16, bytes memory, uint64, bytes memory _payload) internal virtual override {
		(
			address originalCollectionAddr,
			string memory name,
			string memory symbol,
			uint256 tokenId,
			string memory tokenURI,
			address _owner
		) = abi.decode(_payload, (address, string, string, uint256, string, address));

		_reflect(originalCollectionAddr, name, symbol, tokenId, tokenURI, _owner);
	}

	function _reflect(
		address originalCollectionAddr,
		string memory name,
		string memory symbol,
		uint256 tokenId,
		string memory tokenURI,
		address _owner
	) internal {
		bool isOriginalChain = isOriginalChainForCollection[originalCollectionAddr];

		if (isOriginalChain) {
			// Unlock NFT and return to owner
			zONFT(originalCollectionAddr).safeTransferFrom(address(this), _owner, tokenId);

			emit NFTReturned(originalCollectionAddr, tokenId, _owner);
		} else {
			bool isThereReflectionContract = reflection[originalCollectionAddr] != address(0);

			address collectionAddr;

			if (isThereReflectionContract) {
				collectionAddr = reflection[originalCollectionAddr];
			} else {
				collectionAddr = _deployReflection(originalCollectionAddr, name, symbol);
			}

			zONFT(collectionAddr).mint(_owner, tokenId, tokenURI);

			emit NFTBridged(originalCollectionAddr, tokenId, tokenURI, _owner);
		}

		// emit MessageReceived(originalCollectionAddr, name, symbol, tokenId, tokenURI, _owner);
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

	function _toSingletonArray(uint element) internal pure returns (uint[] memory) {
		uint[] memory array = new uint[](1);
		array[0] = element;
		return array;
	}
}
