# Solidity API

## ReflectedNFT

Must have same name and symbol as original collection

_Deployed on first bridge of collection to current chain
Tokens can be minted and burned by Mirror contract (owner)
Inherits ERC721URIStorage to be able to handle collections with any tokenURI function logic
ERC721URIStorage allows to point to exact same metadata as in original collection_

### constructor

```solidity
constructor(string _name, string _symbol) public
```

### mint

```solidity
function mint(address to, uint256 tokenId, string _tokenURI) public
```

Mints NFT with given tokenId and tokenURI
tokenId and tokenURI are exact same as of original NFT
Can only be called by Mirror contract (owner)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | Address to transer token to |
| tokenId | uint256 | ID of original token |
| _tokenURI | string | URI of original token |

### burn

```solidity
function burn(address from, uint256 tokenId) public
```

Destroys NFT reflection (copy) on bridge
can only be called by Mirror contract (owner)

_have owner requirement to prevent vulnerability with burning token from any address in bridge process
because there is no such requirement in Mirror contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | Address to burn token from |
| tokenId | uint256 | ID of token |

