const express = require('express')
const formidable = require('express-formidable')
const sh = require('shelljs')
const path = require('path')

class Service {
  constructor() {
    this.port = 3003
    this.isStakeRunning = false
  }

  startup() {
    const app = express()
    app.use('/assets', express.static(path.join(__dirname, '../static')))
    app.use(formidable()) // for all Content-type

    app.get('/', (req, res) => {
      console.log('query ==>', req.query)

      res.send({ ok: true, message: 'success' })

      if (req.query?.operation === 'publish-check') {
        this.doPublishCheck(req.query)
      }
    })

    app.post('/post', (req, res) => {
      console.log('query ==>', req.query)
      console.log('fields ==>', req.fields)

      res.send({ ok: true, message: 'success' })
    })

    app.listen(this.port, (err) => {
      if (!err) {
        console.log(`Server running at port ${this.port} ...`)
      } else {
        console.log('service listen err: ', err?.message)
      }
    })
  }

  async doPublishCheck(query) {
    try {
      const repoAddress = 'git@github.com:UnyxTech/tomo-wallet-provider.git'
      // Pull the latest code into the .tmp directory
      const repoName = this.getRepositoryName(repoAddress)
      const cloneToDir = path.join(__dirname, `./.tmp/${repoName}`)
      // If it exists, delete it
      this.exec(`rm -rf ${cloneToDir}`)
      // Pull the latest
      this.exec(`git clone ${repoAddress} ${cloneToDir}`)
      console.log('Clone done!')
      // Get the package name
      const libName = this.getLibName(cloneToDir)
      console.log('libName ==>', libName)
      // Add to node_modules using npm
      this.exec(`npm add ${cloneToDir}`)
      console.log('Add done!')
      // Execute tests
      await this.execStakeTest()
    } catch (err) {
      console.log('doPublishCheck err: ', err?.message)
    } finally {
      // delete tmp lib in package.json
      this.exec(`npm rm ${libName}`)
      // Restore to the original repository
      console.log('Reset to origin lib: ')
      this.exec(`npm add ${libName}`)
    }
  }

  getRepositoryName(address) {
    const regex = /\/(.+).git$/
    const match = address.match(regex)
    return match ? match[1] : ''
  }

  exec(command) {
    console.log(command)
    sh.exec(command)
  }

  getLibName(libDir) {
    const packageJSON = require(path.join(libDir, 'package.json'))
    return packageJSON?.name || ''
  }

  async execStakeTest() {
    if (this.isStakeRunning) {
      return console.log('Currently executing, please try again later!')
    }
    this.isStakeRunning = true
    this.exec('npm run test:all')
    // this.exec('npm run test:okx')
    this.isStakeRunning = false
  }
}

module.exports = new Service()
