const sh = require('shelljs')
const fs = require('fs')
const path = require('path')
const utils = require('../utils/index.cjs')
const walletType = require('../constants/walletType.cjs')
const { getEnvConfig, getShellParams } = require('./env.cjs')
const Downloader = require('./downloader.cjs')
const notification = require('./notification.cjs')

const startParams = utils.getStartParams()

const envConfig = getEnvConfig()
const outputLogFilePath = initLogFilePath(envConfig)

const shellEnvString = getShellParams({
  pageUrl: envConfig.pageUrl,
  crxsDownloadDir: envConfig.crxsDownloadDir,
  logFilePath: outputLogFilePath,
})

const downloader = new Downloader({ outputDir: envConfig.crxsDownloadDir })

// start
startExecTest()

async function startExecTest() {
  const {wallet, chain} = startParams
  let execWallets = Object.values(walletType)
  if (wallet !== 'all') {
    execWallets = [wallet]
  }else if(chain){
    execWallets = execWallets.filter((w) => w.startsWith(chain))
  }
  console.log('execWallets', execWallets)
  // await downloader.check(execWallets)
  for (let i = 0; i < execWallets.length; i++) {
    sh.exec(`npm run stake -- --wallet=${execWallets[i]} ${shellEnvString}`)
  }

  await notification.toTelegram({
    logPath: outputLogFilePath,
    tgInfo: envConfig.tgInfo,
  })
  console.log('Testing completed!')
}

function initLogFilePath(env) {
  const { logFolder, filenamePrefix, fileHeaderTextFlag } = env
  const filePath = path.join(logFolder, `./${generateFilename(filenamePrefix)}`)
  const content = generateContent(fileHeaderTextFlag)
  try {
    fs.writeFileSync(filePath, content)
    return filePath
  } catch (err) {
    throw new Error('create log file failed: ', err)
  }
}

function generateFilename(prefix) {
  return `${prefix}-${utils.formatTimestamp(Date.now())}.log`
}

function generateContent(headerTextFlag) {
  const time = new Date()
  let content = `${headerTextFlag} ${time.toLocaleDateString()} ${time.toLocaleTimeString()}\r\n`
  content += '\r\n'
  content += `Provider version: ${getProviderVersion()}\r\n`
  return content
}

function getProviderVersion() {
  const providerPath = path.resolve(
    __dirname,
    '../../node_modules/@tomo-inc/tomo-wallet-provider/package.json'
  )
  const packageJSON = require(providerPath)
  return  packageJSON?.version || ''
}
