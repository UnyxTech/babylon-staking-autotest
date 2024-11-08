const path = require('path')
const fs = require('fs')
const walletType = require('./walletType.cjs')
const utils = require('../utils/index.cjs')

const createCrxPathGetFn = (name) => {
  let params
  let files
  const walletName = name.split('_')[1]
  return () => {
    let filePath = path.resolve(__dirname, `../crxs/${walletName}_wallet.crx`)
    try {
      if (!params) params = utils.getStartParams()
      if (!files) files = fs.readdirSync(params.crxsDownloadDir)
      const filename = files.find((v) => v.startsWith(`${walletName}_wallet`))
      if (filename) {
        filePath = path.join(params.crxsDownloadDir, filename)
      }
    } catch (err) {
      console.log('getCrxPath err: ', err)
    }
    console.log(`${walletName} crxPath: `, filePath)
    return filePath
  }
}

const extensionCollections = {
  [walletType.OKX]: {
    getCrxPath: createCrxPathGetFn(walletType.OKX),
    extId: 'mcohilncbfahbmgdjkbpemcciiolgcge',
  },
  [walletType.TOMO]: {
    getCrxPath: createCrxPathGetFn(walletType.TOMO),
    extId: 'pfccjkejcgoppjnllalolplgogenfojk',
  },
  [walletType.ONEKEY]: {
    getCrxPath: createCrxPathGetFn(walletType.ONEKEY),
    extId: 'jnmbobjmhlngoefaiojfljckilhhlhcj',
  },
  [walletType.BITGET]: {
    getCrxPath: createCrxPathGetFn(walletType.BITGET),
    extId: 'jiidiaalihmmhddjgbnbgdfflelocpak',
  },
  [walletType.COSMOS_KEPLR]: {
    getCrxPath: createCrxPathGetFn(walletType.COSMOS_KEPLR),
    extId: 'dmkamcknogkgcdfhhbddcghachkejeap',
  },
}
Object.assign(extensionCollections, {
  [walletType.COSMOS_OKX]: extensionCollections[walletType.OKX]
})


const processRes = {
  success: 'succeeded',
  failed: 'failed',
}

module.exports = {
  extensionCollections,
  processRes,
}
