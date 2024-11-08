const walletType = require('./walletType.cjs')
const okxWallet = require('../wallets/okx.cjs')
const tomoWallet = require('../wallets/tomo.cjs')
const oneKeyWallet = require('../wallets/onekey.cjs')
const bitgetWallet = require('../wallets/bitget.cjs')
const cosmosKeplrWallet = require('../wallets/cosmosKeplr.cjs')
const cosmosOkxWallet = require('../wallets/okxCosmos.cjs')

const walletHandlers = {
  [walletType.OKX]: okxWallet,
  [walletType.TOMO]: tomoWallet,
  [walletType.BITGET]: bitgetWallet,
  [walletType.ONEKEY]: oneKeyWallet,
  [walletType.COSMOS_KEPLR]: cosmosKeplrWallet,
  [walletType.COSMOS_OKX]: cosmosOkxWallet,
}

module.exports = {
  walletHandlers,
}
