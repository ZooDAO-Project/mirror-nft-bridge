# Solidity API

## FeeTaker

### feeAmount

```solidity
uint256 feeAmount
```

### FeeAmountUpdated

```solidity
event FeeAmountUpdated(uint256 oldFeeInBasisPoints, uint256 newFeeInBasisPoints)
```

### FeeReceiverUpdated

```solidity
event FeeReceiverUpdated(address oldFeeReceiver, address newFeeReceiver)
```

### constructor

```solidity
constructor(uint256 feeAmount_, address feeReceiver_) public
```

### _deductFee

```solidity
function _deductFee() internal
```

### updateFeeAmount

```solidity
function updateFeeAmount(uint256 feeAmount_) public
```

### updateFeeReceiver

```solidity
function updateFeeReceiver(address feeReceiver_) public
```

