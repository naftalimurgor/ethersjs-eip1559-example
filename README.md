# EIP1559

Mandatory fields:

Some fields are added by etherjs library (if omitted):

```javascript
const txObject = {
    from: 'The sender address',
    to: 'The recipient address',
    gasLimit: 'The maximum amount of gas that can be consumed by the transaction',
    maxPriorityFeePerGas: 'This represents the highest amount of gas fee offered as a tip to the validator for each unit of gas consumed.',
    maxFeePerGas: 'This is the upper limit of the fee per gas unit that one is prepared to pay for the transaction, encompassing both the baseFeePerGas and the maxPriorityFeePerGas.',
    chainId: 'a unique identifier representing the blockchain you are interacting with',
    nonce?: 'transaction count',
    value: 'The amount of ETH sent along with your transaction',
    signature (v,r,s)?: 'This refers to the transactions signature values'
}
```