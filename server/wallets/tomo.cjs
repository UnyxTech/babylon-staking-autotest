const { By } = require('selenium-webdriver')
const walletType = require('../constants/walletType.cjs')
const { mnemonicsWords, password } = require('../constants/user.cjs')
const BaseWallet = require('./baseWallet.cjs')

class TomoWallet extends BaseWallet {
  constructor() {
    super()
    this.name = walletType.TOMO
  }

  async takeControll() {
    let driver
    try {
      // get driver
      driver = await this.createDriver({
        extensionHandler: this.tomoCreateAccount,
      })

      // open web page
      this.openMainPage()

      // waiting...
      await driver.sleep(2000)

      // wait for extension popup
      const handles = await driver.getAllWindowHandles()

      // switch to new window(wallet is the second)
      if (handles[1]) {
        await driver.switchTo().window(handles[1])

        // connect
        const btn = await driver.findElement(
          By.xpath("//button[contains(text(), 'Connect')]")
        )
        btn.click()

        // waiting...
        await driver.sleep(2000)

        // The connection window may appear a second time in a new window.
        try {
          await this.reGetAndSetWindow(1)
          const btn_repeat = await driver.findElement(
            By.xpath("//button[contains(text(), 'Connect')]")
          )
          btn_repeat.click()
        } catch {
          console.log('Ignore: "connect button" did not appear a second time!')
        }

        // waiting...
        await driver.sleep(2000)

        // switch network, new window
        await this.reGetAndSetWindow(1)
        const btn2 = await driver.findElement(
          By.xpath("//div[contains(text(), 'Switch Network')]")
        )
        // await btn2.click()
        await this.elementScriptClick(btn2)

        // At this point, the connection is successful, the pop-up window is closed, and the web page is preparing the staking data, after which a signature interface will be displayed shortly.

        // waiting...
        await driver.sleep(5000)

        // on new window, click sign, sign tx
        await this.reGetAndSetWindow(1)
        const btn3 = await driver.findElement(By.xpath("//div[text()='Sign']"))
        // await btn3.click()
        await this.elementScriptClick(btn3)

        // stake process end

        // wait for unbond window
        await driver.sleep(3000)

        // on new window, click sign, sign unbond tx
        await this.reGetAndSetWindow(1)
        const btn4 = await driver.findElement(By.xpath("//div[text()='Sign']"))
        // await btn4.click()
        await this.elementScriptClick(btn4)

        // unbond process end
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

  async tomoCreateAccount(driver) {
    const handles = await driver.getAllWindowHandles()
    await driver.switchTo().window(handles[1])

    await driver.sleep(1000)

    // add wallet
    const btn = await driver.findElement(
      By.xpath("//button[contains(text(), 'Import Wallet')]")
    )
    btn.click()

    await driver.sleep(1000)

    // import wallet
    await this.tryTodo(async () => {
      const btn2 = await driver.findElement(
        By.xpath("//div[contains(text(), 'Import Wallet')]")
      )
      btn2.click()
      await driver.sleep(1000)
    })

    // name the wallet
    const inputs = await driver.findElements(By.css('input'))
    inputs[0].sendKeys('selenium')

    // When importing seed phrases, note that the first input is not the seed phrase input field
    mnemonicsWords.split(' ').forEach((word, index) => {
      inputs[index + 1].sendKeys(word)
    })

    await driver.sleep(1000)

    // click continue
    const btn3 = await driver.findElement(
      By.xpath("//button[contains(text(), 'Continue')]")
    )
    btn3.click()

    await driver.sleep(1000)

    // set password
    // Note that there are three inputs here, the first one is not a password input field.
    const inputs2 = await driver.findElements(By.css('input'))
    inputs2.forEach((input, index) => {
      if (index === 0) return
      input.sendKeys(password) 
    })

    await driver.sleep(1000)

    // click check
    const check =  await driver.findElement(
      By.xpath("//input[contains(@class, 'checkboxPink')]")
    )
    await check.click()

    await driver.sleep(500)

    // click continue
    const btn4 = await driver.findElement(
      By.xpath("//button[contains(text(), 'Continue')]")
    )
    btn4.click()

    await driver.sleep(1000)

    // Start Your Web3 Journey
    const btn5 = await driver.findElement(
      By.xpath("//button[contains(text(), 'Start Your Web3 Journey')]")
    )
    // await btn5.click()
    await this.elementScriptClick(btn5)

    await driver.sleep(1000)

    // Start Exploring
    const btn6 = await driver.findElement(
      By.xpath("//button[contains(text(), 'Start Exploring')]")
    )
    // await btn6.click()
    await this.elementScriptClick(btn6)

    // create account end

    // go to main page
    await driver.sleep(3000)
  }
}

module.exports = new TomoWallet()
