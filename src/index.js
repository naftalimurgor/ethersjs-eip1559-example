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

main()
  .catch(err => console.log(err))