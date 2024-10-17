import { networks } from 'bitcoinjs-lib'

export enum Network {
  MAINNET = 'MAINNET',
  SIGNET = 'SIGNET',
}

interface NetworkConfig {
  coinName: string
  coinSymbol: string
  networkName: string
  network: Network
  btcWalletNetwork: networks.Network
}

const mainnetConfig: NetworkConfig = {
  coinName: 'BTC',
  coinSymbol: 'BTC',
  networkName: 'BTC',
  network: Network.MAINNET,
  btcWalletNetwork: networks.bitcoin,
}

const signetConfig: NetworkConfig = {
  coinName: 'Signet BTC',
  coinSymbol: 'sBTC',
  networkName: 'BTC signet',
  network: Network.SIGNET,
  btcWalletNetwork: networks.testnet,
}

const config: Record<string, NetworkConfig> = {
  mainnet: mainnetConfig,
  signet: signetConfig,
}

export const network = import.meta.env.VITE_TOMO_BTC_NETWORK || Network.SIGNET

export function getBtcNetworkConfig(): NetworkConfig {
  switch (network) {
    case Network.MAINNET:
      return config.mainnet
    case Network.SIGNET:
      return config.signet
    default:
      return config.signet
  }
}
