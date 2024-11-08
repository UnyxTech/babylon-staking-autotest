const { By, until } = require('selenium-webdriver')
const walletType = require('../constants/walletType.cjs')
const { mnemonicsWords, password } = require('../constants/user.cjs')
const BaseWallet = require('./baseWallet.cjs')

class CosmosKeplrWallet extends BaseWallet {
  constructor() {
    super()
    this.name = walletType.COSMOS_KEPLR
  }

  async takeControll() {
    let driver
    try {
      // Get the driver object
      driver = await this.createDriver()
      await driver.get('chrome-extension://dmkamcknogkgcdfhhbddcghachkejeap/register.html#')
      await driver.sleep(1000)
      console.log("link ------------------------------------- keplr");
      // Import existing wallet
      (await driver.findElement(
        By.xpath("//div[contains(text(), 'Import an existing wallet')]/..")
      )).click()

      await driver.sleep(1000);

      (await driver.findElement(
        By.xpath("//div[contains(text(), 'Use recovery phrase or private key')]/..")
      )).click();

      await driver.sleep(1000);
      // Enter the mnemonic words
      const mInputs = await driver.findElements(By.xpath('/html/body/div/div/div[2]/div/div/div[3]/div/div/form/div[3]/div/div/div[1]//input'))
      await Promise.all(mnemonicsWords.split(' ').map(async (word, index) => {
        await mInputs[index].sendKeys(word)
      }));
      await driver.sleep(500);
      (await driver.findElement(
        By.xpath("//div[text()='Import']/..")
      )).click();
      await driver.sleep(1000);
      // Enter wallet info
      const walletInputs = await driver.findElements(By.xpath('/html/body/div/div/div[2]/div/div/div[4]/div/div/form//input'))
      await walletInputs[0].sendKeys('test')
      await walletInputs[1].sendKeys(password)
      await walletInputs[2].sendKeys(password);
      (await driver.findElement(
        By.xpath("//div[text()='Next']/..")
      )).click();

      // save
      const saveBtn = await driver.wait(until.elementLocated(By.xpath("//div[text()='Save']/..")), 1000 * 15);
      // let saveBtn = await driver.findElement(By.xpath("//div[text()='Save']/.."));
      await driver.sleep(500);
      await saveBtn.click();
      await driver.sleep(1000);
      // Open the web page you want to control
      await this.openMainPage();
      //
      await driver.sleep(3000);

      // Wait for a new window or extension window to appear
      // you need to create a wallet before establishing a connection
      const handles2 = await driver.getAllWindowHandles()

      // Switch to a new window (the extension window is the second window)
      if (handles2[1]) {
        await driver.switchTo().window(handles2[1]);
        // Approve
        (await driver.findElement(
          By.xpath("//div[text()='Approve']/..")
        )).click();

        await driver.sleep(3000);

        // Click confirm, sign the transaction
        await this.reGetAndSetWindow(1);

        // Approve
        (await driver.findElement(
          By.xpath("//div[text()='Approve']/..")
        )).click();

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

module.exports = new CosmosKeplrWallet()
