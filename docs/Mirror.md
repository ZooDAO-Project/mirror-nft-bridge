# Solidity API

## Mirror

Mirror bridges NFTs to other supported chains
Bridge process named "creating reflection"
Copy of NFT collections are called "reflections"
Can reflect only eligible NFT collections
Can reflect NFT to any chain, where Mirror contracts exists and connnected

_When collection bridged from source to target chain for the first time - deploys ReflectedNFT contract
If collection was already bridged to target chain before - uses existing ReflectedNFT contract
For creating ReflectedNFT contracts uses original collection's name and symbol_

### reflectionAmountLimit

```solidity
uint256 reflectionAmountLimit
```

Limit for amount of tokens being bridged in single transaction

### isOriginalChainForCollection

```solidity
mapping(address => bool) isOriginalChainForCollection
```

_Used in createReflection() and \_reflect() functions to determine if collection address is original for that chain_

### isEligibleCollection

```solidity
mapping(address => bool) isEligibleCollection
```

Checks if collection eligible to bridge

### LockedNFT

```solidity
event LockedNFT(address operator, address from, uint256 tokenId, bytes data)
```

_Triggered on NFT being transfered from user to lock it on contract if collection is original_

### NFTBridged

```solidity
event NFTBridged(address originalCollectionAddress, uint256[] tokenIds, string[] tokenURIs, address owner)
```

_Triggered in the end of the every bridge of token-reflection_

### UnlockedNFT

```solidity
event UnlockedNFT(address originalCollectionAddress, uint256[] tokenIds, address owner)
```

_Triggered when NFT unlocked from contract and returned to owner_

### BridgeNFT

```solidity
event BridgeNFT(address collection, string name, string symbol, uint256[] tokenId, string[] tokenURI, address owner)
```

_Triggered at the start of every bridge process_

### constructor

```solidity
constructor(address _lzEndpoint, uint256 _feeAmount, address _feeReceiver) public
```

### estimateSendFee

```solidity
function estimateSendFee(address collection, uint256 tokenId, uint16 targetNetworkId, bool useZro, bytes adapterParams) public view returns (uint256 nativeFee, uint256 zroFee)
```

Estimates fee needed to bridge signle token to target chain

### estimateSendBatchFee

```solidity
function estimateSendBatchFee(address collectionAddr, uint256[] tokenIds, uint16 targetNetworkId, bool useZro, bytes adapterParams) public view returns (uint256 nativeFee, uint256 zroFee)
```

Estimates fee needed to bridge batch of tokens to target chain

### createReflection

```solidity
function createReflection(address collectionAddr, uint256[] tokenIds, uint16 targetNetworkId, address payable _refundAddress, address _zroPaymentAddress, bytes _adapterParams) public payable
```

Bridges NFT to target chain
Locks original NFT on contract before bridge
Burns reflection of NFT on bridge

\__adapterParams`s gasLimit should be 2,200,000 for bridge of single token to a new chain (chain where is no ReflectedNFT contract)
_adapterParams`s gasLimit should be 300,000 for bridge of signle token to already deployed ReflectedNFT contract
\_adapterParams`s gasLimit should be 300,000 for bridge of signle token to already deployed ReflectedNFT contract
Original NFT collection address is used as unique identifier at all chains
Original NFT collection is passed as parameter at every bridge process to be used as identifier
Passes in message name and symbol of collection to deploy ReflectedNFT contract if needed
Passes in message tokenURI and tokenId of bridged NFT top mint exact same NFT on target chain_

#### Parameters

| Name                | Type            | Description                                                                             |
| ------------------- | --------------- | --------------------------------------------------------------------------------------- |
| collectionAddr      | address         | A                                                                                       |
| tokenIds            | uint256[]       | Array of tokenIds to bridge to target chain                                             |
| targetNetworkId     | uint16          | target network ID from LayerZero's ecosystem (different from chain ID)                  |
| \_refundAddress     | address payable | Address to return excessive native tokens                                               |
| \_zroPaymentAddress | address         | Currently takes zero address, but left as parameter according to LayerZero`s guidelines |
| \_adapterParams     | bytes           | abi.encode(1, gasLimit) gasLimit for transaction on target chain                        |

### \_nonblockingLzReceive

```solidity
function _nonblockingLzReceive(uint16, bytes, uint64, bytes payload) internal virtual
```

_Function inherited from NonBlockingLzApp
Called by lzReceive() that is triggered by LzEndpoint
Calles \_reflect() to finish bridge process_

### \_reflect

```solidity
function _reflect(address originalCollectionAddr, string name, string symbol, uint256[] tokenIds, string[] tokenURIs, address _owner) internal
```

Function finishing bridge process
Deploys ReflectedNFT contract if collection was bridged to current chain for the first time
Uses existing ReflectedNFT contract if collection was bridged to that chain before
Mints NFT-reflection on ReflectedNFT contract
Returns (unlocks) NFT to owner if current chain is original for collection

#### Parameters

| Name                   | Type      | Description                                                           |
| ---------------------- | --------- | --------------------------------------------------------------------- |
| originalCollectionAddr | address   | Address of original collection on original chain as unique identifier |
| name                   | string    | name of original collection to mint ReflectedNFT if needed            |
| symbol                 | string    | symbol of original collection to mint ReflectedNFT if needed          |
| tokenIds               | uint256[] | Array of tokenIds of bridged NFTs to mint exact same tokens           |
| tokenURIs              | string[]  | Array of tokenURIs of bridged NFTs to mint exact same tokens          |
| \_owner                | address   | Address to mint or return token to                                    |

### changeCollectionEligibility

```solidity
function changeCollectionEligibility(address collection, bool eligibility) external
```

Updated collection eligibility to given parameter

_only owner can call_

#### Parameters

| Name        | Type    | Description            |
| ----------- | ------- | ---------------------- |
| collection  | address | collection address     |
| eligibility | bool    | boolean for eligibilty |

### changeReflectionAmountLimit

```solidity
function changeReflectionAmountLimit(uint256 newReflectionAmountLimit) external
```

Changes limit for bridging batch of tokens

_only owner can call_

#### Parameters

| Name                     | Type    | Description                                                |
| ------------------------ | ------- | ---------------------------------------------------------- |
| newReflectionAmountLimit | uint256 | Amount of tokens that can be bridged in single transaction |

### onERC721Received

```solidity
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) external returns (bytes4)
```

\_Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
by `operator` from `from`, this function is called.

It must return its Solidity selector to confirm the token transfer.
If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.

The selector can be obtained in Solidity with `IERC721Receiver.onERC721Received.selector`.\_

### \_toSingletonArray

```solidity
function _toSingletonArray(uint256 element) internal pure returns (uint256[])
```

_Called in createReflection() to make array from signle element
Using [element] drops "Invalid implicit conversion from uint256[1] memory to uint256[]"_
