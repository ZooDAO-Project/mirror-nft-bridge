# Solidity API

## ReflectionCreator

Stores logic to deploy ReflectedNFT and record all required params

### reflection

```solidity
mapping(address => address) reflection
```

Returns ReflectedNFT address on current chain by original collection address as unique identifier

_originalCollectionContract => reflectionCollectionContract_

### isReflection

```solidity
mapping(address => bool) isReflection
```

Returns if collection address on current chain is reflection (copy)

_collectionAddr => isReflection_

### originalCollectionAddresses

```solidity
mapping(address => address) originalCollectionAddresses
```

Returns original collection address by address of it's reflection (copy) on current chain

_reflectionAddress => origCollAddr_

### NFTReflectionDeployed

```solidity
event NFTReflectionDeployed(address reflectionContractAddress, address originalContractAddress)
```

### _deployReflection

```solidity
function _deployReflection(address originalCollectionAddr, string name, string symbol) internal returns (address)
```

Creates reflection (copy) of oringinal collection with original name and symbol

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| originalCollectionAddr | address | Address of original collection on original chain as unique identifier |
| name | string | name of original collection to pass to ReflectedNFT |
| symbol | string | symbol of original collection to pass to ReflectedNFT |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | address of deployed ReflectedNFT contract |

