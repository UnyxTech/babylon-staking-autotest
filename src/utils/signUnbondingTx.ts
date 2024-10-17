import { Transaction, networks } from 'bitcoinjs-lib'
import { unbondingTransaction } from 'btc-staking-ts'
import { getGlobalParams } from '@/apis/stakeApis/getGlobalParams'
// import { getUnbondingEligibility } from '@/apis/stakeApis/getUnbondingEligibility'
// import { postUnbonding } from '@/apis/stakeApis/postUnbonding'
import { Delegation as DelegationInterface } from '@/apis/stakeApis/types/delegations'
import { apiDataToStakingScripts } from './apiDataToStakingScripts'
import { getCurrentGlobalParamsVersion } from './index'
import { signPsbtTransaction } from './psbt'
import { WalletProvider } from '@/types/walletProvider'

// Get the staker signature from the unbonding transaction
// const getStakerSignature = (unbondingTx: Transaction): string => {
//   try {
//     return unbondingTx.ins[0].witness[0].toString('hex')
//   } catch (error) {
//     throw new Error('Failed to get staker signature')
//   }
// }

export const signUnbondingTx = async (
  delegation: DelegationInterface,
  publicKeyNoCoord: string,
  btcWalletNetwork: networks.Network,
  btcWallet: WalletProvider,
): Promise<{ unbondingTxHex: string; delegation: DelegationInterface }> => {
  if (!delegation) {
    throw new Error('Delegation not found')
  }

  // Check if the unbonding is possible
  // This must ensure that the delegation is available online in order to be detected.
  // const unbondingEligibility = await getUnbondingEligibility(
  //   delegation.stakingTxHashHex,
  // )
  // if (!unbondingEligibility) {
  //   throw new Error('Not eligible for unbonding')
  // }

  const paramVersions = await getGlobalParams()
  // State of global params when the staking transaction was submitted
  const { currentVersion: globalParamsWhenStaking } =
    getCurrentGlobalParamsVersion(
      delegation.stakingTx.startHeight,
      paramVersions,
    )

  if (!globalParamsWhenStaking) {
    throw new Error('Current version not found')
  }

  // Recreate the staking scripts
  const scripts = apiDataToStakingScripts(
    delegation.finalityProviderPkHex,
    delegation.stakingTx.timelock,
    globalParamsWhenStaking,
    publicKeyNoCoord,
  )

  // Create the unbonding transaction
  const { psbt } = unbondingTransaction(
    scripts,
    Transaction.fromHex(delegation.stakingTx.txHex),
    globalParamsWhenStaking.unbondingFeeSat,
    btcWalletNetwork,
    delegation.stakingTx.outputIndex,
  )
  
  // ...
  console.log('psbt ==>', psbt)

  // Sign the unbonding transaction
  let unbondingTx
  try {
    unbondingTx = await signPsbtTransaction(btcWallet)(psbt.toHex())
  } catch (error) {
    throw new Error('Failed to sign PSBT for the unbonding transaction')
  }

  // Get the staker signature
  // const stakerSignature = getStakerSignature(unbondingTx)

  // Get the unbonding transaction hex
  const unbondingTxHex = unbondingTx.toHex()

  // ...
  console.log('signUnbondingRes ==>', {
    unbondingTx,
    unbondingTxHex,
  })

  // POST unbonding to the API
  // await postUnbonding(
  //   stakerSignature,
  //   delegation.stakingTxHashHex,
  //   unbondingTx.getId(),
  //   unbondingTxHex,
  // )

  return { unbondingTxHex, delegation }
}
