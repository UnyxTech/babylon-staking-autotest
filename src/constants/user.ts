import { IUserData, walletTypes } from '@/types'

// Please enter your data
const dataCommon: IUserData = {
  ADDRESS: '',
  PUBLIC_KEY: '',
  DELEGATION: {
    "stakingTxHashHex": "",
    "stakerPkHex": "",
    "finalityProviderPkHex": "",
    "state": "",
    "stakingValueSat": 30000,
    "stakingTx": {
      "txHex": "",
      "outputIndex": 0,
      "startTimestamp": "",
      "startHeight": 213046,
      "timelock": 150,
    },
    "unbondingTx": undefined,
    "isOverflow": false,
  },
}

// Please enter your data
const dataTomo: IUserData = {
  ADDRESS: '',
  PUBLIC_KEY: '',
  DELEGATION: {
    "stakingTxHashHex": "",
    "stakerPkHex": "",
    "finalityProviderPkHex": "",
    "state": "",
    "stakingValueSat": 30000,
    "stakingTx": {
      "txHex": "",
      "outputIndex": 0,
      "startTimestamp": "",
      "startHeight": 213046,
      "timelock": 150,
    },
    "unbondingTx": undefined,
    "isOverflow": false,
  },
}

// The key here corresponds to the wallet parameter in the URL.
// The addresses and public keys in the data can also be obtained directly by calling methods from the provider.
export const walletDataMap: Record<walletTypes, IUserData> = {
  bitcoin_okx: dataCommon,
  bitcoin_tomo: dataTomo,
  bitcoin_bitget: dataCommon,
  bitcoin_onekey: dataCommon,
  cosmos_keplr: dataCommon,
}

