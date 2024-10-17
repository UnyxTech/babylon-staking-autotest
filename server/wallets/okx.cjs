const { By } = require('selenium-webdriver')
const walletType = require('../constants/walletType.cjs')
const { mnemonicsWords, password } = require('../constants/user.cjs')
const BaseWallet = require('./baseWallet.cjs')

class OKXWallet extends BaseWallet {
  constructor() {
    super()
    this.name = walletType.OKX
  }

  async takeControll() {
    let driver
    try {
      // Get the driver object
      driver = await this.createDriver()
      // Open the web page you want to control
      this.openMainPage()

      await driver.sleep(5000)

      // Wait for a new window or extension window to appear
      // you need to create a wallet before establishing a connection
      const handles2 = await driver.getAllWindowHandles()

      // Switch to a new window (the extension window is the second window)
      if (handles2[1]) {
        await driver.switchTo().window(handles2[1])

        // Import existing wallet
        const btn = await driver.findElement(
          By.xpath("//*[contains(@class, 'btn-content') and contains(text(), 'Import wallet')]")
        )
        await btn.click()

        await driver.sleep(1000)

        // Select mnemonic word import
        await this.tryTodo(async () => {
          const btn2 = await driver.findElement(
            By.xpath("//*[contains(@class, '_typography-text') and contains(text(), 'Seed phrase')]")
          )
          await btn2.click()
        })

        // On Linux it might be this character
        await this.tryTodo(async () => {
          const btn2 = await driver.findElement(
            By.xpath("//*[contains(@class, '_typography-text') and contains(text(), 'Import wallet')]")
          )
          await btn2.click()
        })

        await driver.sleep(1000)

        // Enter the mnemonic words
        const inputs = await driver.findElements(By.css('.mnemonic-words-inputs__container input'))
        mnemonicsWords.split(' ').forEach(async (word, index) => {
          await inputs[index].sendKeys(word)
        })

        await driver.sleep(2000)

        const btn3 = await driver.findElement(
          By.xpath("//*[contains(@class, 'btn-content') and contains(text(), 'Confirm')]")
        )
        await btn3.click()

        // waiting
        await driver.sleep(2000)

        // Select Wallet Security, select password
        const psdItem = await driver.findElement(
          By.xpath("//*[contains(text(), 'Password')]")
        )
        await psdItem.click()

        // waiting
        await driver.sleep(500)

        const next = await driver.findElement(
          By.xpath("//*[contains(@class, 'btn-content') and contains(text(), 'Next')]")
        )
        await next.click()

        // waiting
        await driver.sleep(1200)

        // Set a password
        const inputs2 = await driver.findElements(By.css('form[data-testid="okd-form"] input'))
        inputs2.forEach((input) => {
          input.sendKeys(password)
        })

        await driver.sleep(2000)

        const btn4 = await driver.findElement(
          By.xpath("//*[contains(@class, 'btn-content') and contains(text(), 'Confirm')]")
        )
        await btn4.click()

        await driver.sleep(3000)

        // Start your web3 journey
        const btn5 = await driver.findElement(
          By.xpath("//*[contains(@class, 'btn-content') and contains(text(), 'Start your')]")
        )
        await btn5.click()

        await driver.sleep(2000)

        const btn6 = await driver.findElement(
          By.xpath("//*[contains(@class, 'btn-content') and .//div[contains(text(), 'Connect')]]")
        )
        await btn6.click()

        // At this time, the connection is successful, the pop-up window is closed, 
        // the page is preparing to stake data, and the signature interface will pop up later

        await driver.sleep(6000)

        // Click confirm, sign the transaction
        await this.reGetAndSetWindow(1)
        const btn7 = await driver.findElement(
          By.xpath("//*[contains(@class, 'btn-content') and .//div[contains(text(), 'Confirm')]]")
        )
        await btn7.click()

        // At this point the stake process is over

        // Wait to unbind process popup
        await driver.sleep(4000)

        // Click confirm and sign to unbind the transaction
        await this.reGetAndSetWindow(1)
        const btn8 = await driver.findElement(
          By.xpath("//*[contains(@class, 'btn-content') and .//div[contains(text(), 'Confirm')]]")
        )
        await btn8.click()

        // The unbinding process is complete
      }
    } catch (err) {
      console.error('Error: ', err)
    } finally {
      // Mainly log related
      await this.postProcessing()
      // Close the browser
      await driver.quit()
    }
  }
}

module.exports = new OKXWallet()
