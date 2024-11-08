const walletType = require('./walletType.cjs')
const okxWallet = require('../wallets/okx.cjs')
const tomoWallet = require('../wallets/tomo.cjs')
const oneKeyWallet = require('../wallets/onekey.cjs')
const bitgetWallet = require('../wallets/bitget.cjs')
const keplrWallet = require('../wallets/keplr.cjs')

const walletHandlers = {
  [walletType.OKX]: okxWallet,
  [walletType.TOMO]: tomoWallet,
  [walletType.BITGET]: bitgetWallet,
  [walletType.ONEKEY]: oneKeyWallet,
  [walletType.KEPLR]: keplrWallet,
}

module.exports = {
  walletHandlers,
}
