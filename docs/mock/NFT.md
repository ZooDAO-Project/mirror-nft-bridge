# Solidity API

## NFT

### number

```solidity
uint256 number
```

### constructor

```solidity
constructor(string _name, string _symbol) public
```

### initialize

```solidity
function initialize(uint256 _number) public
```

### _baseURI

```solidity
function _baseURI() internal pure returns (string)
```

_Base URI for computing {tokenURI}. If set, the resulting URI for each
token will be the concatenation of the `baseURI` and the `tokenId`. Empty
by default, can be overridden in child contracts._

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public pure returns (string)
```

_See {IERC721Metadata-tokenURI}._

### mint

```solidity
function mint(address _to, uint256 _quantity) public
```

### burn

```solidity
function burn(uint256 tokenId) public
```

