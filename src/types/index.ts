import { Delegation } from '@/apis/stakeApis/types/delegations'

export interface GlobalParamsVersion {
  version: number;
  activationHeight: number;
  stakingCapSat: number;
  stakingCapHeight: number;
  tag: string;
  covenantPks: string[];
  covenantQuorum: number;
  unbondingTime: number;
  unbondingFeeSat: number;
  maxStakingAmountSat: number;
  minStakingAmountSat: number;
  maxStakingTimeBlocks: number;
  minStakingTimeBlocks: number;
  confirmationDepth: number;
}

export interface ParamsWithContext {
  currentVersion: GlobalParamsVersion | undefined;
  nextVersion: GlobalParamsVersion | undefined;
  isApprochingNextVersion: boolean;
  firstActivationHeight: number;
}

export type Fees = {
  // fee for inclusion in the next block
  fastestFee: number;
  // fee for inclusion in a block in 30 mins
  halfHourFee: number;
  // fee for inclusion in a block in 1 hour
  hourFee: number;
  // economy fee: inclusion not guaranteed
  economyFee: number;
  // minimum fee: the minimum fee of the network
  minimumFee: number;
}

// UTXO is a structure defining attributes for a UTXO
export interface UTXO {
  // hash of transaction that holds the UTXO
  txid: string;
  // index of the output in the transaction
  vout: number;
  // amount of satoshis the UTXO holds
  value: number;
  // the script that the UTXO contains
  scriptPubKey: string;
}

export type SignStakingTxType = Promise<{ signedStakingTxHex: string; stakingTerm: number; txId?: string }>

export type walletTypes = 'okx' | 'tomo' | 'onekey' | 'bitget'

export interface IUserData {
  ADDRESS: string
  PUBLIC_KEY: string
  DELEGATION: Delegation
}
