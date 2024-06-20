const { ethers } = require('ethers')
const dotenv = require('dotenv')
dotenv.config()

const BSCrpc = 'https://bsc-testnet.blockpi.network/v1/rpc/public'

const USDT_ABI = [
  "constructor()",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function burn(uint256 amount)",
  "function burnFrom(address account, uint256 amount)",
  "function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)",
  "function grantRole(bytes32 role, address account)",
  "function increaseAllowance(address spender, uint256 addedValue) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function pause()",
  "event Paused(address account)",
  "function renounceRole(bytes32 role, address account)",
  "function revokeRole(bytes32 role, address account)",
  "event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
  "function transfer(address recipient, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
  "function unpause()",
  "event Unpaused(address account)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function getRoleAdmin(bytes32 role) view returns (bytes32)",
  "function getRoleMember(bytes32 role, uint256 index) view returns (address)",
  "function getRoleMemberCount(bytes32 role) view returns (uint256)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function MINTER_ROLE() view returns (bytes32)",
  "function name() view returns (string)",
  "function paused() view returns (bool)",
  "function PAUSER_ROLE() view returns (bytes32)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)"
]

const main = async () => {

  const privKey = process.env.PRIVATE_KEY
  const provider = new ethers.providers.JsonRpcProvider(BSCrpc)
  const signer = new ethers.Wallet(privKey, provider)
  const signerTwo = new ethers.Wallet(process.env.PRIVATE_KEY_TWO, provider)

  // console.log(await signer.getAddress())

  // https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd
  const ERC20_CONTRACT_ADDRESS = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'
  const USDT_AMOUNT = ethers.utils.parseUnits('6', 18) // 6 tokens
  const recepientUSDTaddress = '0xE046162f8E532D7787F80BfF2731C545A2C598f7'
  const USDTContractInstance = new ethers.Contract(ERC20_CONTRACT_ADDRESS, USDT_ABI, signerTwo)

  const amount = '0.01' // BNB
  const to = '0xe5eC94E4A70F4e0975dD1b215567a3967b1A24Ce' // recepient address

  // transfer BNB / Ether

  try {
    const feeData = await signer.getFeeData()

    const txObject = {
      to,
      value: ethers.utils.parseEther(amount),
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      type: 2,
    }
    const txResponse = await signer.sendTransaction(txObject)
    console.log('txHash', txResponse.hash)
    const txReceipt = await txResponse.wait()
    console.log('txReceipt:', txReceipt)
  } catch (error) {
    console.log(error)
  }

  // transfer ERC20(USDT BEP20)
  try {
    const latestFees = await provider.getFeeData()

    // Create the transaction object for ERC-20 transfer
    // notice how we estimate gasLimit: without this the transaction will most of the times fail 
    const estimate = await USDTContractInstance.estimateGas.transfer(recepientUSDTaddress, USDT_AMOUNT)

    const tx = await USDTContractInstance.transfer(recepientUSDTaddress, USDT_AMOUNT, {
      gasLimit: estimate,
      maxFeePerGas: latestFees.maxFeePerGas,    // For EIP-1559
      maxPriorityFeePerGas: latestFees.maxPriorityFeePerGas,  // For EIP-1559
      type: 2  // EIP-1559 transaction
    })

    const txReceipt = await tx.wait()

    console.log('gas estimate:', txReceipt)

  } catch (error) {
    console.log(error);
  }
}

// main()
//   .catch(err => console.log(err))

// Function to send Ether with a 5% fee
async function sendEtherWithFee(amountToSend) {
  const privKey = process.env.PRIVATE_KEY
  const provider = new ethers.providers.JsonRpcProvider(BSCrpc)
  const signer = new ethers.Wallet(privKey, provider)
  const signerTwo = new ethers.Wallet(process.env.PRIVATE_KEY_TWO, provider)

  const recepient = '0x0346Fe65Df5AffC588e307a916CabAD0b224D2ca'
  const feeAddress = '0x309C7057d20EC9EB67b21005972fF19965483Fbf'

  try {
    // Get the sender's balance
    const balance = await provider.getBalance(signer.address);

    // Calculate the 5% fee
    const feePercentage = 0.05;
    const fee = amountToSend.mul(ethers.BigNumber.from(Math.floor(feePercentage * 100))).div(ethers.BigNumber.from(100));

    // Estimate gas cost for sending ether to recipient
    const estimatedGasForRecipient = await provider.estimateGas({
      to: recepient,
      value: amountToSend
    });

    // Estimate gas cost for sending fee
    const estimatedGasForFee = await provider.estimateGas({
      to: feeAddress,
      value: fee
    });

    // Get current gas price data for EIP-1559
    const feeData = await provider.getFeeData();

    // Calculate the total gas cost for both transactions
    const gasCostForRecipient = estimatedGasForRecipient.mul(feeData.maxFeePerGas);
    const gasCostForFee = estimatedGasForFee.mul(feeData.maxFeePerGas);

    // Calculate total cost (5% fee + actual gas fee for both transactions + net amount to send)
    const totalCost = amountToSend.add(fee).add(gasCostForRecipient).add(gasCostForFee);

    // Check if the sender's balance is sufficient
    if (balance.lt(totalCost)) {
      console.log('Insufficient balance to cover the transaction, commision fee of 5%, and gas costs.');
      return res
    }

    // Send the 5% fee using EIP-1559
    const feeTx = await signer.sendTransaction({
      to: feeAddress,
      value: fee,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      gasLimit: estimatedGasForFee
    });

    const reciptFee = await feeTx.wait();

    console.log('feeRecipt', reciptFee.transactionHash)
    // Send the actual amount to the recipient using EIP-1559
    const sendTx = await signer.sendTransaction({
      to: recepient,
      value: amountToSend,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      gasLimit: estimatedGasForRecipient
    });

    const sendeReceipt = await sendTx.wait();

    console.log('feeRecipt', sendeReceipt.transactionHash)


    console.log(`Sent ${ethers.utils.formatEther(amountToSend)} ETH to ${recepient} with a 5% fee of ${ethers.utils.formatEther(fee)} ETH.`);
  } catch (error) {
    console.error('Error sending ether:', error);
  }
}


// Function to send ERC-20 tokens with a 5% fee
async function sendTokenWithFee(amountToSend) {
  const recepient = '0x0346Fe65Df5AffC588e307a916CabAD0b224D2ca'
  const feeAddress = '0x309C7057d20EC9EB67b21005972fF19965483Fbf'

  const privKey = process.env.PRIVATE_KEY
  const provider = new ethers.providers.JsonRpcProvider(BSCrpc)
  const signer = new ethers.Wallet(privKey, provider)
  const signerTwo = new ethers.Wallet(process.env.PRIVATE_KEY_TWO, provider)

  // https://testnet.bscscan.com/address/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd
  const ERC20_CONTRACT_ADDRESS = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'
  const USDTContractInstance = new ethers.Contract(ERC20_CONTRACT_ADDRESS, USDT_ABI, signerTwo)


  try {
    // Get the sender's token balance
    const tokenBalance = await USDTContractInstance.balanceOf(signer.address);

    // Calculate the 5% fee
    const feePercentage = 0.05;
    const fee = amountToSend.mul(ethers.BigNumber.from(Math.floor(feePercentage * 100))).div(ethers.BigNumber.from(100));

    // Check if the sender has enough tokens
    if (tokenBalance.lt(amountToSend.add(fee))) {
      console.log('Insufficient token balance to cover the transaction and fee.');
      return;
    }

    // Estimate gas cost for sending tokens to recipient
    const estimatedGasForRecipient = await USDTContractInstance.estimateGas.transfer(recepient, amountToSend);

    // Estimate gas cost for sending fee
    const estimatedGasForFee = await USDTContractInstance.estimateGas.transfer(feeAddress, fee);

    // Get current gas price data for EIP-1559
    const feeData = await provider.getFeeData();

    // Calculate the total gas cost in ETH
    const gasCostForRecipient = estimatedGasForRecipient.mul(feeData.maxFeePerGas);
    const gasCostForFee = estimatedGasForFee.mul(feeData.maxFeePerGas);

    // Get the sender's ETH balance
    const ethBalance = await provider.getBalance(signer.address)

    // Calculate total ETH cost (gas for both transactions)
    const totalEthCost = gasCostForRecipient.add(gasCostForFee);

    // Check if the sender's ETH balance is sufficient to cover gas costs
    if (ethBalance.lt(totalEthCost)) {
      console.log('Insufficient ETH balance to cover gas costs.');
      return;
    }

    // Send the 5% fee using EIP-1559
    const feeTx = await USDTContractInstance.transfer(feeAddress, fee, {
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      gasLimit: estimatedGasForFee
    });

    const feeReceipt = await feeTx.wait();
    console.log('commission fee:', feeReceipt)

    // Send the actual amount to the recipient using EIP-1559
    const sendTx = await USDTContractInstance.transfer(recepient, amountToSend, {
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      gasLimit: estimatedGasForRecipient
    })

    const sendReceipt = await sendTx.wait();
    console.log('sendReceipt:', sendReceipt);
    console.log(`Sent ${ethers.utils.formatUnits(amountToSend, 18)} tokens to ${recepient} with a 5% fee of ${ethers.utils.formatUnits(fee, 18)} tokens.`);
  } catch (error) {
    console.error('Error sending tokens:', error);
  }
}

// Example usage: Send 100 tokens (adjust the amount as needed)
const tokensToSend = ethers.utils.parseUnits('2', 18);
sendTokenWithFee(tokensToSend)
  .catch(err => console.log(err))

// Example usage: Send 1 ETH (adjust the amount as needed)
// const amountToSend = ethers.utils.parseEther('0.01');

// sendEtherWithFee(amountToSend)
//   .catch(err => console.log(err))
