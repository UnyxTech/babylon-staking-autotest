import {initEccLib} from 'bitcoinjs-lib'
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs'
import {formatParams, sleepTime} from './index'
import {walletDataMap} from '@/constants/user'
import {status} from '@/constants/page'
import * as twp from '@tomo-inc/tomo-wallet-provider'
import {CosmosProvider} from '@tomo-inc/tomo-wallet-provider'
import {TestController} from "@/utils/autoTestController.ts";

initEccLib(ecc)

class AutoTestCosmosController extends TestController{

  walletProvider: undefined | CosmosProvider

  constructor() {
    super()
  }

  async start({ setStakeResult, setUnbondingResult }: any) {
    try{
      // 1. get running wallet
      const params = formatParams(location.search)
      console.log('params ==>', params)

      const {wallet} = params


      if (!wallet || !Object.keys(walletDataMap).includes(wallet)) {
        return console.log('Err: Unsupported wallet or chain')
      }

      // 2. choose provider according to wallet
      await this.initWallet(wallet)
      const result = await this.signMessage()
      console.log('sign result ==>', result)
      setStakeResult(result?.signature ? status.success : status.failed)
    }catch (e){
      console.log('error ==>', e)
      setStakeResult(status.failed)
    }


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
      const walletProvider = new walletMeta.connectProvider([{
        network: 'cosmoshub-4',
      }]) as CosmosProvider

      // @ts-ignore
      console.log('walletProvider ==>', window.walletProvider = walletProvider)

      await walletProvider.connectWallet()
      await sleepTime(1000)

      const address = await walletProvider.getAddress()
      if(!address){
        throw new Error('Failed to connect wallet')
      }


      if (address) {
        console.log('connected successfully', address)
        this.walletProvider = walletProvider
      }
    }
  }

  async signMessage() {
    return await this.walletProvider?.signArbitrary(await this.walletProvider?.getAddress(), 'test message')
  }

}

export default new AutoTestCosmosController()
