const { Builder, By } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const fs = require('fs')
const utils = require('../utils/index.cjs')
const { processRes } = require('../constants/config.cjs')
const { extensionCollections } = require('../constants/config.cjs')

const params = utils.getStartParams()

class BaseWallet {
  constructor() {
    this.name = ''
    this.driver = null
    this.pageUrl = params.pageUrl
    this.walletVersion = ''
  }

  start() {
    if (!this.name) {
      return console.log('Err: Wallet name not defined!')
    }
    console.log(`Wallet ${this.name} stake process starts!`)
    this.takeControll()
  }

  takeControll() {
    console.log('Err: The takeControll method is not defined in the wallet!')
  }

  async createDriver(config) {
    // Set Chrome options
    let options = new chrome.Options()

    // Set the preferred website language to English
    // Note: For the chrome browser itself, you need to set the system language
    options.setUserPreferences({
      'intl.accept_languages': 'en,en-US',
    })

    // The extension allows you to add others
    const extensions = [extensionCollections[this.name]]
    if (config?.extraExtensions) {
      extensions.push(...config.extraExtensions)
    }

    // Load Chrome extension (path of .crx file)
    extensions.forEach((extension) => {
      options.addExtensions(extension.getCrxPath())
    })

    // Create a WebDriver instance
    const driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build()

    // Here, the subclass overrides the superclass, and this 'this' belongs to the subclass
    this.driver = driver

    // Open an initial page to ensure that the extension has loaded
    // Visit the extension management page
    await driver.get('chrome://extensions/')

    // Check that the extension is displayed
    extensions.forEach(async (extension, index) => {
      await driver.wait(this.checkId(extension.extId, driver), 10000)
      // It is wallet extension
      if (index === 0) {
        this.walletVersion = await this.getExtensionVersion(extension.extId, driver)
      }
    })

    // In the chrome://extensions/ page, an extension is displayed, 
    // but it may not be fully loaded yet, allow some time for the extension to load
    await driver.sleep(5000)

    // For the Tomo Wallet, if an account is not created, it cannot be invoked,
    // to handle this situation, an account must be created on the opened extension page
    if (config?.extensionHandler) {
      try {
        await config.extensionHandler.call(this, driver)
      } catch (err) {
        console.log('extensionHandler execute err: ', err)
      }
    }

    // Close all pages except the home page
    await this.closeOtherPage(driver)

    // Return the driver to perform operations on the main page
    return driver
  }

  // Close all pages except the first (home) page
  async closeOtherPage(driver) {
    const handles = await driver.getAllWindowHandles()
    for (let handle of handles.slice(1)) {
      await driver.switchTo().window(handle)
      await driver.close()
    }
    // Restore focus to the home page
    await driver.switchTo().window(handles[0])
  }

  async openMainPage() {
    if (!this.driver) {
      throw new Error('Driver object not initialized!')
    }
    await this.driver.get(`${this.pageUrl}?wallet=${this.name}`)
  }

  // Due to security restrictions in the Chrome browser,
  // extension pages opened with window.open may be blocked,
  // Using the driver.get method will replace the current page and cannot open a new tab page,
  // So here, first use window.open to open a new page,
  // and then use driver.get to replace it with the target page,
  // This way, it achieves opening various pages in a new tab
  async openNewTabPage({ url }) {
    try {
      await this.driver.executeScript(`window.open('${url}', '_blank')`)
      await this.reGetAndSetWindow('latest')
      await this.driver.get(url)
    } catch (err) {
      console.log('openNewTabPage err: ', err)
    }
  }

  async tryTodo(func) {
    try {
      if (typeof func === 'function') await func()
    } catch (err) {
      console.log('Ignore: Tried but did not do it', err)
    }
  }

  async elementScriptClick(element) {
    await this.driver.executeScript('arguments[0].click()', element)
  }

  async checkId(id, driver) {
    // Find the Shadow Host element
    let shadowHost = await driver.findElement(By.css('body > extensions-manager'))

    // Get the Shadow DOM using JavaScript execution
    const targetElement = await driver.executeScript(`
      const hostShadowRoot = arguments[0].shadowRoot
      const nestedShadowHost = hostShadowRoot.querySelector("#items-list").shadowRoot
      return nestedShadowHost.querySelector('#${id}')
    `, shadowHost)

    return targetElement !== null
  }

  async getExtensionVersion(id, driver) {
    try {
      const root = await driver.findElement(By.css('body > extensions-manager'))
      const version = await driver.executeScript(`
        const shadowRoot1 = arguments[0].shadowRoot
        const shadowRoot2 = shadowRoot1.querySelector("#items-list").shadowRoot
        const shadowRoot3 = shadowRoot2.querySelector('#${id}').shadowRoot
        return shadowRoot3.querySelector('#version').innerText
      `, root)
      return version.trim()
    } catch (err) {
      console.log('getExtensionVersion err: ', err)
      return ''
    }
  }

  async reGetAndSetWindow(number) {
    const handles = await this.driver.getAllWindowHandles()
    if (number === 'latest') number = handles.length - 1
    if (handles[number]) {
      await this.driver.switchTo().window(handles[number])
    }
  }

  async postProcessing() {
    // Wait for the browser process to finish
    await this.driver.sleep(2000)
    // Switch to the main window
    await this.reGetAndSetWindow(0)
    // Handle the logs
    await this.logHandler()
    // Wait for 2 seconds before closing the browser
    await this.driver.sleep(2000)
  }

  async logHandler() {
    // Check if there is the phrase 'successful'
    const { stakeText, unBondingText } = await this.getStatus()

    // Write to the log
    this.writeLog({
      wallet: this.name,
      stakeRes: !!stakeText,
      unBondingRes: !!unBondingText,
    })
  }

  async getStatus() {
    const stakeText = await this.driver.findElement(
      By.xpath("//*[@id='stake-status' and contains(text(), 'Successful')]")
    ).catch(() => false)

    const unBondingText = await this.driver.findElement(
      By.xpath("//*[@id='unbonding-status' and contains(text(), 'Successful')]")
    ).catch(() => false)

    return { stakeText, unBondingText }
  }

  writeLog(info) {
    const { wallet, stakeRes, unBondingRes } = info
    const filePath = params.logFilePath
    let content = `\r\n${wallet.toUpperCase()}:\r\n`
    content += `version: ${this.walletVersion}\r\n`
    content += `process-of-stake: ${stakeRes ? processRes.success : processRes.failed}\r\n`
    content += `process-of-unbonding: ${unBondingRes ? processRes.success : processRes.failed}\r\n`
    try {
      fs.appendFileSync(filePath, content)
      console.log(`Wallet ${wallet} log write complete!`)
    } catch (err) {
      throw new Error('write log file failed: ', err)
    }
  }
}

module.exports = BaseWallet
