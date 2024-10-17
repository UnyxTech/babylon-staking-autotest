const { By } = require('selenium-webdriver')
const walletType = require('../constants/walletType.cjs')
const { mnemonicsWords, password } = require('../constants/user.cjs')
const BaseWallet = require('./baseWallet.cjs')

class BitgetWallet extends BaseWallet {
  constructor() {
    super()
    this.name = walletType.BITGET
  }

  async takeControll() {
    let driver
    try {
      // get driver object
      driver = await this.createDriver()
      // open web page
      this.openMainPage()

      // waiting
      await driver.sleep(3000)

      // wait for wallet popup
      const handles2 = await driver.getAllWindowHandles()

      // switch to wallet popup（it's the second window）
      if (handles2[1]) {
        await driver.switchTo().window(handles2[1])

        await driver.sleep(2000)

        // import 
        const btn = await driver.findElement(
          By.xpath("//button[contains(text(), 'Import a wallet')]")
        )
        await btn.click()

        // waiting
        await driver.sleep(2000)

        // password
        const inputs = await driver.findElements(By.css('input'))
        inputs.forEach((input) => input.sendKeys(password))

        // waiting
        await driver.sleep(2000)

        // next
        const btn2 = await driver.findElement(
          By.xpath("//span[contains(text(), 'Next')]")
        )
        await btn2.click()

        // waiting
        await driver.sleep(2000)

        // input seed phrase
        const inputs2 = await driver.findElements(By.css('input'))
        mnemonicsWords.split(' ').forEach((word, index) => {
          inputs2[index].sendKeys(word)
        })

        // waiting
        await driver.sleep(2000)

        // confirm
        const btn3 = await driver.findElement(
          By.xpath("//span[@class='MuiButton-label' and contains(text(), 'Confirm')]")
        )
        await btn3.click()

        // waiting animation finish
        await driver.sleep(10000)

        // connect
        const btn4 = await driver.findElement(
          By.xpath("//button[.//span[contains(text(), 'Connect')]]")
        )
        await btn4.click()

        // waiting
        await driver.sleep(2000)

        // approval
        await this.reGetAndSetWindow(1)
        const btn5 = await driver.findElement(
          By.xpath("//button[.//span[contains(text(), 'Approve')]]")
        )
        await btn5.click()

        // stake sign window, will popup

        // waiting
        await driver.sleep(20*1000)

        // stake sign confirm
        await this.reGetAndSetWindow(1)
        const btn6 = await driver.findElement(
          By.xpath("//button[.//span[contains(text(), 'Agree')]]")
        )
        await btn6.click()

        // unbond

        // waiting
        await driver.sleep(8000)

        // unbond agree
        await this.reGetAndSetWindow(1)
        const btn7 = await driver.findElement(
          By.xpath("//button[.//span[contains(text(), 'Agree')]]")
        )
        await btn7.click()

        // end
      }
    } catch (error) {
      console.error('Error: ', error)
    } finally {
      // post processing
      await this.postProcessing()
      // close browser
      await driver.quit()
    }
  }
}

module.exports = new BitgetWallet()
