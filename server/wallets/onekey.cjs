const { By } = require('selenium-webdriver')
const walletType = require('../constants/walletType.cjs')
const { mnemonicsWords, password } = require('../constants/user.cjs')
const { extensionCollections } = require('../constants/config.cjs')
const BaseWallet = require('./baseWallet.cjs')

class OnekeyWallet extends BaseWallet {
  constructor() {
    super()
    this.name = walletType.ONEKEY
  }

  async takeControll() {
    let driver
    try {
      // get driver
      driver = await this.createDriver()
      // open web page
      this.openMainPage()

      // waiting
      await driver.sleep(5000)

      // wait wallet popup
      const handles2 = await driver.getAllWindowHandles()

      // switch to wallet popup（it's the second window）
      if (handles2[1]) {
        await driver.switchTo().window(handles2[1])

        // import
        const btn = await driver.findElement(
          By.xpath("//*[contains(text(), 'Import wallet')]")
        )
        await btn.click()

        // waiting
        await driver.sleep(4000)

        // choose seed phrase
        const btn2 = await driver.findElement(
          By.xpath("//*[contains(text(), 'Recovery phrase')]")
        )
        await btn2.click()

        // waiting
        await driver.sleep(4000)

        // confirm
        const confirm = await driver.findElement(
          By.xpath("//*[contains(text(), 'Acknowledged')]")
        )
        await confirm.click()

        // waiting
        await driver.sleep(4000)

        // uncheck touch id
        await this.tryTodo(async () => {
          const touchCheck = await driver.findElement(
            By.xpath("//*[contains(@data-state, 'checked')]")
          )
          if (touchCheck) {
            await touchCheck.click()
            await driver.sleep(2000)
          }
        })

        // input password
        const inputs2 = await driver.findElements(
          By.css('form input[type="password"]')
        )
        inputs2.forEach((input) => {
          input.sendKeys(password)
        })

        // waiting
        await driver.sleep(1000)

        // confirm
        const setPassword = await driver.findElement(
          By.xpath("//*[contains(@data-testid, 'set-password')]")
        )
        await setPassword.click()

        // waiting
        await driver.sleep(3000)

        // input seed phrase
        const inputs = await driver.findElements(
          By.css("form input[data-testid*='phrase-input']")
        )
        mnemonicsWords.split(' ').forEach((word, index) => {
          inputs[index].sendKeys(word)
        })

        // waiting
        await driver.sleep(3000)

        // confirm
        const btn3 = await driver.findElement(
          By.xpath("//*[contains(text(), 'Confirm')]")
        )
        await btn3.click()

        // waiting
        await driver.sleep(6000)

        // click Done
        await this.tryTodo(async () => {
          const complete = await driver.findElement(
            By.xpath("//*[contains(text(), 'Done')]")
          )
          await complete.click()
        })

        // waiting
        await driver.sleep(4000)

        // Onekey could quit at this time, open new window to do the settings
        // after setting, go back previous page and refresh to continue process

        // open new window base on main page
        await this.reGetAndSetWindow(0)

        // open extension in new tab
        this.openNewTabPage({
          url: `chrome-extension://${extensionCollections[this.name].extId}/ui-popup.html`,
        })

        // waiting
        await driver.sleep(3000)

        // process onekey account issue
        await this.handleOneKey(driver)

        // close all pages except main page
        await this.closeOtherPage(driver)

        // waiting
        await driver.sleep(2000)

        // refresh
        await driver.navigate().refresh()

        // waiting
        await driver.sleep(5000)

        // Proceed at my own risk could not be popup
        await this.reGetAndSetWindow(1)
        await this.tryTodo(async () => {
          const risk = await driver.findElement(
            By.xpath("//label[contains(text(), 'Proceed at my own risk')]")
          )
          // risk.click() not work，maybe blocked by other element
          // await risk.click()
          await driver.executeScript('arguments[0].click()', risk)
          await driver.sleep(2000)
        })
        
        // approve connect
        const accredit = await driver.findElement(
          By.xpath("//button[.//span[contains(text(), 'Approve')]]")
        )
        await accredit.click()

        // At this point, the connection is successful, the pop-up window is closed, and the web page is preparing to stake. Later, a signature interface will pop up.

        // waiting Note that it opens very slowly here, need to wait longer
        await driver.sleep(10000)

        // Sign the transaction
        await this.reGetAndSetWindow(1)
        const sign = await driver.findElement(
          By.xpath("//button[.//span[contains(text(), 'Sign')]]")
        )
        await sign.click()

        // waiting
        await driver.sleep(3000)

        // Network fee warning
        await this.tryTodo(async () => {
          const check = await driver.findElement(
            By.xpath("//label[contains(text(), 'I still want to')]")
          )
          // await check.click()
          await driver.executeScript('arguments[0].click()', check)

          await driver.sleep(1000)

          const continueBtn = await driver.findElement(
            By.xpath("//button[.//span[contains(text(), 'Continue')]]")
          )
          await continueBtn.click()

          await driver.sleep(1000)
        })

        // At this point, the pledging process is over.

        // Wait for the unbond process pop-up window
        await driver.sleep(10000)

        // Sign the unbond
        await this.reGetAndSetWindow(1)
        const sign2 = await driver.findElement(
          By.xpath("//button[.//span[contains(text(), 'Sign')]]")
        )
        await sign2.click()

        // waiting
        await driver.sleep(3000)

        // Network fee warning
        await this.tryTodo(async () => {
          const check = await driver.findElement(
            By.xpath("//label[contains(text(), 'I still want to')]")
          )
          // await check.click()
          await driver.executeScript('arguments[0].click()', check)

          await driver.sleep(1000)

          const continueBtn = await driver.findElement(
            By.xpath("//button[.//span[contains(text(), 'Continue')]]")
          )
          await continueBtn.click()

          await driver.sleep(1000)
        })

        // At this point, the unbond process is over.
      }
    } catch (error) {
      console.error("Error: ", error)
    } finally {
      // Post-processing
      await this.postProcessing()
      // Close the browser
      await driver.quit()
    }
  }

  async handleOneKey(driver) {
    // Got it
    await this.tryTodo(async () => {
      const isee = await driver.findElement(
        By.xpath("//span[contains(text(), 'Got it')]")
      )
      await isee.click()
    })

    // waiting initing
    await driver.sleep(4000)

    // Try to click Done, which may not have been closed before, and the window closes early
    await this.tryTodo(async () => {
      const complete = await driver.findElement(
        By.xpath("//*[contains(text(), 'Done')]")
      )
      await complete.click()
      await driver.sleep(2000)
    })

    // Click on All Networks
    const allNetwork = await driver.findElement(
      By.xpath("//span[contains(text(), 'All networks')]")
    )
    await allNetwork.click()

    // waiting initing
    await driver.sleep(3000)

    // Search for signet in the search box
    // Click on All Networks
    const input = await driver.findElement(By.css("input[placeholder='Search']"))
    await input.sendKeys('signet')

    // waiting initing
    await driver.sleep(2000)

    // click signet
    const signet = await driver.findElement(
      By.xpath("//span[contains(@data-testid, 'select-item-tbtc') and .//span[contains(text(), 'Signet')]]")
    )
    await signet.click()

    // waiting initing
    await driver.sleep(3000)

    // Click on Select Address
    const choose = await driver.findElement(
      By.xpath("//div[@data-testid='wallet-derivation-path-selector-trigger']")
    )
    await choose.click()

    // waiting initing
    await driver.sleep(1000)

    // Select the address
    const address = await driver.findElement(
      By.xpath("//span[contains(text(), 'Taproot')]")
    )
    await address.click()

    // waiting initing
    await driver.sleep(3000)
  }
}

module.exports = new OnekeyWallet()
