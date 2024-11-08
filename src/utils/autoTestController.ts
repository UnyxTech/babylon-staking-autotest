import { initEccLib } from 'bitcoinjs-lib'
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs'
import { getGlobalParams } from '@/apis/stakeApis/getGlobalParams'
import { getFinalityProviders } from '@/apis/stakeApis/getFinalityProviders'
import { getBtcNetworkFees, getBtcTipHeight } from '@/apis'
import { btcToSatoshi, formatParams, getCurrentGlobalParamsVersion, getFeeRateFromMempool, getFundingUTXOs, getPublicKeyNoCoord, sleepTime } from './index'
import { getBtcNetworkConfig } from '@/constants/config'
import { walletDataMap } from '@/constants/user'
import { status } from '@/constants/page'
import { createStakingTx, signStakingTx } from './signStakingTx'
import { signUnbondingTx } from './signUnbondingTx'
import  * as twp from '@tomo-inc/tomo-wallet-provider'
import { WalletProvider } from '@/types/walletProvider'
import { walletTypes } from '@/types'

initEccLib(ecc)

export abstract class TestController{
  abstract start({ setStakeResult, setUnbondingResult }: any): Promise<void>
}

class AutoTestController extends TestController{
  urlParams: any
  globalParams: any
  btcHeight: number
  fees: any
  amount: number
  term: number
  providers: any
  provider: any
  address: string
  publicKey: string
  delegation: any
  utxos: any
  btcWallet: null | WalletProvider

  constructor() {
    super()
    this.globalParams = null
    this.btcHeight = 0
    this.fees = null
    this.amount = 0.0003
    this.term = 150
    this.providers = null
    this.provider = null
    this.utxos = null
    this.address = ''
    this.publicKey = ''
    this.delegation = null
    this.btcWallet = null
  }

  async start({ setStakeResult, setUnbondingResult }: any) {
    // 1. get running wallet
    const params = formatParams(location.search)
    console.log('params ==>', params)

    const {wallet} = params


    if (!wallet || !Object.keys(walletDataMap).includes(wallet)) {
      return console.log('Err: Unsupported wallet!')
    }

    const walletData = walletDataMap[wallet as walletTypes]

    this.address = walletData.ADDRESS
    this.publicKey = walletData.PUBLIC_KEY
    this.delegation = walletData.DELEGATION

    // 2. choose provider according to wallet
    await this.initWallet(wallet)

    // switch
    // return

    // 3. prepare data to sign
    await this.getData()

    // 4. stake process
    // 5. raise chrome extension wallet
    // 6. After waiting for a while with Selenium, check if there are two windows. If so, start the operation.
    // 7. import seed phrase
    // 8. when enter page, mock click sign button
    const stakeRes = await this.stake()
    setStakeResult(stakeRes ? status.success : status.failed)

    // 9. start unbond
    setUnbondingResult(status.running)

    // 10. unbond
    const unbondingRes = await this.unbonding()
    setUnbondingResult(unbondingRes ? status.success : status.failed)
  }

  async initWallet(walletId: string) {
    // @ts-ignore
    console.log('twp ==>', window.twp = twp)
    // @ts-ignore
    await twp.__tla
    const walletMeta = twp.walletList.find(v => v.id === `${walletId}`)

    // @ts-ignore
    console.log('walletMeta ==>', window.walletMeta = walletMeta)

    if (walletMeta) {
      // @ts-ignore
      const walletProvider = new walletMeta.connectProvider()

      // @ts-ignore
      console.log('walletProvider ==>', window.walletProvider = walletProvider)

      await walletProvider.connectWallet()
      await sleepTime(1000)

      await walletProvider.switchNetwork('signet')


      const address = await walletProvider.getAddress()

      if (address) {
        console.log('connected successfully', address)
        this.btcWallet = walletProvider
      }
    }
  }

  async getData() {
    // get data with two requests to stop data override
    const [globalParams, btcHeight, fees] = await Promise.all([
      getGlobalParams(),
      getBtcTipHeight(),
      getBtcNetworkFees(),
    ])
    const [providers, utxos] = await Promise.all([
      getFinalityProviders(''),
      getFundingUTXOs(this.address),
    ])
    console.log('data ==>', {
      globalParams,
      btcHeight,
      fees,
      providers,
      utxos,
    })
    this.globalParams = globalParams
    this.btcHeight = btcHeight
    this.fees = fees
    this.providers = providers
    this.provider = providers.finalityProviders[0]
    this.utxos = utxos
  }

  async stake() {
    try {
      const paramCtx = getCurrentGlobalParamsVersion(
        this.btcHeight + 1,
        this.globalParams
      )
      const stakingAmountSat = btcToSatoshi(this.amount)
      const { btcWalletNetwork } = getBtcNetworkConfig()
      const publicKeyNoCoord = getPublicKeyNoCoord(this.publicKey).toString('hex')
      const { defaultFeeRate } = getFeeRateFromMempool(this.fees)
  
      const data = {
        paramCtxCurrentVersion: paramCtx.currentVersion,
        stakingAmountSat,
        term: this.term,
        providerBtcPk: this.provider.btcPk,
        btcWalletNetwork,
        address: this.address,
        publicKeyNoCoord,
        defaultFeeRate,
        utxos: this.utxos,
      }
  
      // ...
      console.log('createStakingData ==>', data)
  
      // create tx
      const stakingTx = createStakingTx(
        paramCtx.currentVersion!,
        stakingAmountSat,
        this.term,
        this.provider.btcPk,
        btcWalletNetwork,
        this.address,
        publicKeyNoCoord,
        defaultFeeRate,
        this.utxos,
      )
  
      // sign tx
      await signStakingTx(stakingTx, this.btcWallet as WalletProvider)

      return true

    } catch (err) {
      console.log(err)
      console.log('Stake Err: ', err)
      return false
    }
  }

  async unbonding() {
    try {
      const publicKeyNoCoord = getPublicKeyNoCoord(this.publicKey).toString('hex')
      const { btcWalletNetwork } = getBtcNetworkConfig()

      const data = {
        delegation: this.delegation,
        publicKeyNoCoord,
        btcWalletNetwork,
        btcWallet: this.btcWallet,
      }
  
      // ...
      console.log('signUnbondingData ==>', data)

      await signUnbondingTx(
        this.delegation,
        publicKeyNoCoord,
        btcWalletNetwork,
        this.btcWallet as WalletProvider,
      )

      return true

    } catch (err) {
      console.log('Unbonding Err: ', err)
      return false
    }
  }

  // ...
}

export default new AutoTestController()
