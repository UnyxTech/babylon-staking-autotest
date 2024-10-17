const path = require('path')

const { STAKE_PAGE_URL, STAKE_LOG_FOLDER, STAKE_CRXS_DOWNLOAD_DIR } = process.env

const defaultPageUrl = 'http://localhost:3826/'
const defaultLogFolder = path.resolve(__dirname, '../../logs')
const defaultCrxsDownloadDir = path.resolve(__dirname, '../crxs/downloaded/')

const envConfig = {
  pageUrl: STAKE_PAGE_URL || defaultPageUrl,
  logFolder: STAKE_LOG_FOLDER || defaultLogFolder,
  crxsDownloadDir: STAKE_CRXS_DOWNLOAD_DIR || defaultCrxsDownloadDir,
  filenamePrefix: 'auto-test-stake',
  fileHeaderTextFlag: 'AUTO-TEST-STAKE',
  // Please enter your TG channel data
  tgInfo: {
    botToken: 'your botToken',
    channelId: 'your channelId',
  },
}

const getEnvConfig = () => {
  return envConfig
}

const getShellParams = (params) => {
  let res = ''
  for (let key in params) {
    res += ` --${key}=${params[key]}`
  }
  return res.slice(1)
}

module.exports = {
  getEnvConfig,
  getShellParams,
}
