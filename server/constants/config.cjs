const path = require('path')
const fs = require('fs')
const walletType = require('./walletType.cjs')
const utils = require('../utils/index.cjs')

const createCrxPathGetFn = (name) => {
  let params
  let files
  return () => {
    let filePath = path.resolve(__dirname, `../crxs/${name}_wallet.crx`)
    try {
      if (!params) params = utils.getStartParams()
      if (!files) files = fs.readdirSync(params.crxsDownloadDir)
      const filename = files.find((v) => v.startsWith(`${name}_wallet`))
      if (filename) {
        filePath = path.join(params.crxsDownloadDir, filename)
      }
    } catch (err) {
      console.log('getCrxPath err: ', err)
    }
    console.log(`${name} crxPath: `, filePath)
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
}

const processRes = {
  success: 'succeeded',
  failed: 'failed',
}

module.exports = {
  extensionCollections,
  processRes,
}
