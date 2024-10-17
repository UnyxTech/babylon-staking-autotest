const utils = require('./utils/index.cjs')
const { walletHandlers } = require('./constants/wallet.cjs')

const params = utils.getStartParams()

console.log('params ==>', params)

doWalletStakeControl(params)

function doWalletStakeControl(params) {
  const wallets = Object.keys(walletHandlers)

  if (!params?.wallet || !wallets.includes(params.wallet)) {
    return console.log(`Unsupported wallet types: ${params?.wallet}`)
  }

  const walletHandler = walletHandlers[params.wallet]
  walletHandler.start()
}
