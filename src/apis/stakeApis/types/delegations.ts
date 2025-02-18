export interface Delegation {
  stakingTxHashHex: string;
  stakerPkHex: string;
  finalityProviderPkHex: string;
  state: string;
  stakingValueSat: number;
  stakingTx: StakingTx;
  unbondingTx: UnbondingTx | undefined;
  isOverflow: boolean;
}

export interface StakingTx {
  txHex: string;
  outputIndex: number;
  startTimestamp: string;
  startHeight: number;
  timelock: number;
}

export interface UnbondingTx {
  txHex: string;
  outputIndex: number;
}

export const ACTIVE = 'active';
export const UNBONDING_REQUESTED = 'unbonding_requested';
export const UNBONDING = 'unbonding';
export const UNBONDED = 'unbonded';
export const WITHDRAWN = 'withdrawn';
export const PENDING = 'pending';
export const OVERFLOW = 'overflow';
export const EXPIRED = 'expired';
export const INTERMEDIATE_UNBONDING = 'intermediate_unbonding';
export const INTERMEDIATE_WITHDRAWAL = 'intermediate_withdrawal';

// Define the state of a delegation as per API
export const DelegationState = {
  ACTIVE,
  UNBONDING_REQUESTED,
  UNBONDING,
  UNBONDED,
  WITHDRAWN,
  PENDING,
  OVERFLOW,
  EXPIRED,
  INTERMEDIATE_UNBONDING,
  INTERMEDIATE_WITHDRAWAL,
};

export const DeleStateInfos = {
  [DelegationState.ACTIVE]: {
    text: 'Active',
    bg: '#EAf5FF',
    color: '#248AE8',
  },
  [DelegationState.UNBONDED]: {
    text: 'Withdrawable',
    bg: '#EDFBF5',
    color: '#15BC76',
  },
  [DelegationState.PENDING]: {
    text: 'Pending',
    bg: '#EDFBF5',
    color: '#15BC76',
  },
  [DelegationState.OVERFLOW]: {
    text: 'Overflow',
    bg: '#EDFBF5',
    color: '#15BC76',
  },
  [DelegationState.UNBONDING]: {
    text: 'Unbonding',
    bg: '#FFF8E7',
    color: '#B58407',
  },
  [DelegationState.UNBONDING_REQUESTED]: {
    text: 'UnbondingRequested',
    bg: '#FFF8E7',
    color: '#B58407',
  },
  [DelegationState.INTERMEDIATE_UNBONDING]: {
    text: 'IntermediateUnbonding',
    bg: '#FFF8E7',
    color: '#B58407',
  },
  [DelegationState.INTERMEDIATE_WITHDRAWAL]: {
    text: 'IntermediateWithdrawal',
    bg: '#EAf5FF',
    color: '#248AE8',
  },
}
