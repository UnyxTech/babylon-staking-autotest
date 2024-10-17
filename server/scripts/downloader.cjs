const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { extensionCollections } = require('../constants/config.cjs')
const chalkPromise = require('../libs/chalk.cjs')

class Downloader {
  constructor({ outputDir }) {
    this.outputDir = outputDir
    this.placeholder = '<extId>'
    this.preUrlTemplate = `https://clients2.google.com/service/update2/crx?response=redirect&os=mac&arch=x86-32&os_arch=x86-32&nacl_arch=x86-32&prod=chromecrx&prodchannel=unknown&prodversion=9999.0.9999.0&acceptformat=crx2,crx3&x=id%3D${this.placeholder}%26uc`
  }

  async check(wallets) {
    const chalk = await chalkPromise()
    console.log(chalk.green('wallet check start!'))
    try {
      const latestCrxList = await this.getLatestCrxList(wallets)
      const preDownloadCrxs = await this.getPreDownloadedCrxs(latestCrxList)
      if (preDownloadCrxs.length) {
        await this.downloadCrxs(preDownloadCrxs)
      } else {
        console.log(chalk.green('The wallet version does not need to be updated!'))
      }
      return true
    } catch (err) {
      console.log(chalk.red('wallet check failed: '), err)
      return false
    }
  }

  async getLatestCrxList(wallets) {
    const chalk = await chalkPromise()
    const preUrlItems = []

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i]
      const extId = extensionCollections[wallet].extId
      preUrlItems.push({
        name: wallet,
        url: this.preUrlTemplate.replace(this.placeholder, extId),
      })
    }

    console.log(chalk.blue('preUrlItems ==>'), preUrlItems)

    const preRequests = preUrlItems.map((item) => this.getCrxLocation(item))
    const latestCrxList = (await Promise.all(preRequests)).filter(Boolean)

    console.log(chalk.blue('latestCrxList ==>'), latestCrxList)

    return latestCrxList
  }

  async getCurPaths() {
    const chalk = await chalkPromise()
    const exceptPaths = ['.gitkeep']
    try {
      return [...fs.readdirSync(this.outputDir)].filter((path) => !exceptPaths.includes(path))
    } catch (err) {
      console.log(chalk.red('getCurPaths err: '), err)
      return []
    }
  }

  async getPreDownloadedCrxs(latestCrxList) {
    const chalk = await chalkPromise()
    const preDownloadCrxs = []
    const curPaths = await this.getCurPaths()

    console.log(chalk.blue('curPaths ==>'), curPaths)

    if (!curPaths.length) {
      latestCrxList.forEach((item) => preDownloadCrxs.push(item))
    } else {
      latestCrxList.forEach((item) => {
        const oldCrxFile = curPaths.find((path) => path.startsWith(item.name))
        if (!oldCrxFile) {
          return preDownloadCrxs.push(item)
        }
        const latestVersion = this.getVersion(item.location)
        const oldVersion = this.getVersion(oldCrxFile)
        if (latestVersion !== oldVersion)
          preDownloadCrxs.push({ ...item, oldCrxFile })
      })
    }

    console.log(chalk.blue('preDownloadCrxs ==>'), preDownloadCrxs)
    
    return preDownloadCrxs
  }

  async downloadCrxs(crxs) {
    if (!crxs.length) return
    const chalk = await chalkPromise()
    const curPaths = await this.getCurPaths()

    for (let i = 0; i < crxs.length; i++) {
      const crxItem = crxs[i]
      const url = crxItem.location
      const filename = `${crxItem.name}_wallet_${this.getVersion(url)}.crx`
      const outputPath = path.join(this.outputDir, `./${filename}`)
      const res = await this.downloadFile(url, outputPath)
      if (res) {
        console.log(chalk.green('file download successful: '), filename)
        this.deleteOldFile(crxItem.oldCrxFile)
      } else {
        console.log(chalk.red('file download failed: '), filename)
      }
    }
  }

  async deleteOldFile(filename) {
    if (!filename) return
    const chalk = await chalkPromise()
    try {
      fs.unlinkSync(path.join(this.outputDir, filename))
      console.log(chalk.green('deleted file: '), filename)
    } catch (err) {
      console.log(chalk.red('deleteOldFile err: '), err)
    }
  }

  getVersion(str) {
    const regex = /_(\d+(_\d+)+)\.crx$/
    const match = str.match(regex)
    return match ? match[1] : null
  }

  async getCrxLocation(urlItem) {
    const chalk = await chalkPromise()
    try {
      const res = await axios({
        method: 'GET',
        url: urlItem.url,
        maxRedirects: 0,
        // Define status codes 2xx and 3xx as successful for the then branch; by default, only 2xx will go to then, and all others will go to catch.
        validateStatus: status => status >= 200 && status < 400,
      })

      if (res.status.toString() === '302') {
        return {
          name: urlItem.name,
          location: res.headers.location,
        }
      } else {
        return null
      }
    } catch (err) {
      console.log(chalk.red('getCrxLocation err: '), err)
      return null
    }
  }

  async downloadFile(url, outputPath) {
    const writer = fs.createWriteStream(outputPath)
    try {
      const res = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
      })
    
      res.data.pipe(writer)
    
      return new Promise((resolve) => {
        writer.on('finish', () => resolve(true))
        writer.on('error', () => resolve(false))
      })
    } catch (err) {
      console.log(chalk.red('downloadFile err: '), { url, err })
      return false
    }
  }
}

module.exports = Downloader
