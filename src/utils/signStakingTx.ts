import { networks } from 'bitcoinjs-lib'
import { stakingTransaction } from 'btc-staking-ts'
import { GlobalParamsVersion, SignStakingTxType, UTXO } from '@/types/index'
import { apiDataToStakingScripts } from './apiDataToStakingScripts'
import { isTaproot } from './index'
import { getStakingTerm } from './getStakingTerm'
import { txFeeSafetyCheck } from './fee'
import { signPsbtTransaction } from './psbt'
import { WalletProvider } from '@/types/walletProvider'

export const createStakingTx = (
  globalParamsVersion: GlobalParamsVersion,
  stakingAmountSat: number,
  stakingTimeBlocks: number,
  finalityProviderPublicKey: string,
  btcWalletNetwork: networks.Network,
  address: string,
  publicKeyNoCoord: string,
  feeRate: number,
  inputUTXOs: UTXO[],
) => {
  // Get the staking term, it will ignore the `stakingTimeBlocks` and use the value from params
  // if the min and max staking time blocks are the same
  const stakingTerm = getStakingTerm(globalParamsVersion, stakingTimeBlocks)

  // Check the staking data
  if (
    stakingAmountSat < globalParamsVersion.minStakingAmountSat ||
    stakingAmountSat > globalParamsVersion.maxStakingAmountSat ||
    stakingTerm < globalParamsVersion.minStakingTimeBlocks ||
    stakingTerm > globalParamsVersion.maxStakingTimeBlocks
  ) {
    throw new Error('Invalid staking data')
  }

  if (inputUTXOs.length === 0) {
    throw new Error('Not enough usable balance')
  }

  if (feeRate <= 0) {
    throw new Error('Invalid fee rate')
  }

  // Create the staking scripts
  let scripts;
  try {
    scripts = apiDataToStakingScripts(
      finalityProviderPublicKey,
      stakingTerm,
      globalParamsVersion,
      publicKeyNoCoord,
    )
  } catch (error: Error | any) {
    throw new Error(error?.message || 'Cannot build staking scripts')
  }

  // Create the staking transaction
  let unsignedStakingPsbt;
  let stakingFeeSat;
  try {
    const { psbt, fee } = stakingTransaction(
      scripts,
      stakingAmountSat,
      address,
      inputUTXOs,
      btcWalletNetwork,
      feeRate,
      isTaproot(address) ? Buffer.from(publicKeyNoCoord, 'hex') : undefined,
      globalParamsVersion.activationHeight - 1,
    );
    unsignedStakingPsbt = psbt;
    stakingFeeSat = fee;
  } catch (error: Error | any) {
    throw new Error(
      error?.message || 'Cannot build unsigned staking transaction',
    )
  }

  return { unsignedStakingPsbt, stakingFeeSat, stakingTerm, feeRate }
}

export const signStakingTx = async (stakingTx: any, btcWallet: WalletProvider): SignStakingTxType => {
  let { unsignedStakingPsbt, stakingTerm, stakingFeeSat, feeRate } = stakingTx

  let signedStakingTx
  try {
    signedStakingTx = await signPsbtTransaction(btcWallet)(unsignedStakingPsbt.toHex())
  } catch (error: Error | any) {
    throw new Error(error?.message || 'Staking transaction signing PSBT error')
  }

  // Get the staking transaction hex
  const signedStakingTxHex = signedStakingTx.toHex();

  // ...
  console.log('signStakeRes ==>', {
    signedStakingTx,
    signedStakingTxHex,
  })

  try {
    // const signedStakingTx = Transaction.fromHex(signedStakingTxHex)
    txFeeSafetyCheck(signedStakingTx, feeRate, stakingFeeSat)
  } catch (err: any) {
    throw new Error(err?.message || 'TxFee check error')
  }

  return { signedStakingTxHex, stakingTerm }
}
