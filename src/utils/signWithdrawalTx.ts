import { Transaction, networks, Psbt } from 'bitcoinjs-lib'
import { PsbtTransactionResult, withdrawEarlyUnbondedTransaction, withdrawTimelockUnbondedTransaction } from 'btc-staking-ts'
import { getGlobalParams } from '../../api/stakeApis/getGlobalParams'
import { Delegation as DelegationInterface } from '../../api/stakeApis/types/delegations'
import { BTCNetworkAddressType } from '../../api/type'
import { Fees } from '../provider/types'
import { apiDataToStakingScripts } from './apiDataToStakingScripts'
import { getCurrentGlobalParamsVersion, GlobalParamsVersion } from './index'
import { getFeeRateFromMempool } from './index'
import { txFeeSafetyCheck } from './fee'
import btcProvider from '../provider/btcProvider'

export const createWithdrawalTx = async (
  delegation: DelegationInterface,
  publicKeyNoCoord: string,
  btcWalletNetwork: networks.Network,
  address: string,
) => {
  if (!delegation) {
    throw new Error('Delegation not found')
  }

  const [paramVersions, fees] = await Promise.all([
    getGlobalParams(),
    btcProvider.getNetworkFees(),
  ])

  // State of global params when the staking transaction was submitted
  const { currentVersion: globalParamsWhenStaking } =
    getCurrentGlobalParamsVersion(
      delegation.stakingTx.startHeight,
      paramVersions as GlobalParamsVersion[],
    )

  if (!globalParamsWhenStaking) {
    throw new Error('Current version not found')
  }

  // Recreate the staking scripts
  const {
    timelockScript,
    slashingScript,
    unbondingScript,
    unbondingTimelockScript,
  } = apiDataToStakingScripts(
    delegation.finalityProviderPkHex,
    delegation.stakingTx.timelock,
    globalParamsWhenStaking,
    publicKeyNoCoord,
  )

  const feeRate = getFeeRateFromMempool(fees as Fees)

  // Create the withdrawal transaction
  let withdrawPsbtTxResult: PsbtTransactionResult
  if (delegation?.unbondingTx) {
    // Withdraw funds from an unbonding transaction that was submitted for early unbonding and the unbonding period has passed
    withdrawPsbtTxResult = withdrawEarlyUnbondedTransaction(
      {
        unbondingTimelockScript,
        slashingScript,
      },
      Transaction.fromHex(delegation.unbondingTx.txHex),
      address,
      btcWalletNetwork,
      feeRate.defaultFeeRate,
    )
  } else {
    // Withdraw funds from a staking transaction in which the timelock naturally expired
    withdrawPsbtTxResult = withdrawTimelockUnbondedTransaction(
      {
        timelockScript,
        slashingScript,
        unbondingScript,
      },
      Transaction.fromHex(delegation.stakingTx.txHex),
      address,
      btcWalletNetwork,
      feeRate.defaultFeeRate,
      delegation.stakingTx.outputIndex,
    )
  }
  const { psbt, fee } = withdrawPsbtTxResult
  return { psbt, fee, feeRate: feeRate.defaultFeeRate }
}

// Sign a withdrawal transaction
// Returns:
// - signedWithdrawalTxHex: the signed withdrawal transaction Hex
// - delegation: the initial delegation
export const signWithdrawalTx = async (
  withdrawalPsbtTx,
  addressType: BTCNetworkAddressType
): Promise<{
  signedWithdrawalTxHex: string
  txId: string
}> => {
  const { psbt, fee, feeRate } = withdrawalPsbtTx

  // Sign the withdrawal transaction
  let signedWithdrawalTxHex
  try {
    signedWithdrawalTxHex = await btcProvider.signPsbt(psbt.toHex(), addressType)
  } catch (error) {
    throw new Error('Failed to sign PSBT for the withdrawal transaction')
  }

  try {
    const signedWithdrawalTx = Transaction.fromHex(signedWithdrawalTxHex)
    // Perform a safety check on the estimated transaction fee
    txFeeSafetyCheck(signedWithdrawalTx, feeRate, fee)
  } catch (err) {
    throw new Error(err?.message || 'TxFee check error')
  }

  // Broadcast withdrawal transaction
  const txId = await btcProvider.pushTx(signedWithdrawalTxHex)

  return { signedWithdrawalTxHex, txId }
}
