const { ethers } = require('ethers')
const dotenv = require('dotenv')
dotenv.config()

const BSCrpc = 'https://bsc-testnet.blockpi.network/v1/rpc/public'

const main = async () => {
  const privKey = process.env.PRIVATE_KEY
  const provider = new ethers.providers.JsonRpcProvider(BSCrpc)
  const signer = new ethers.Wallet(privKey, provider)

  const ERC20_CONTRACT_ADDRESS = ''

  const amount = '0.01' // BNB
  const to = '0xe5eC94E4A70F4e0975dD1b215567a3967b1A24Ce' // recepient address

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
}

main()
  .catch(err => console.log(err))