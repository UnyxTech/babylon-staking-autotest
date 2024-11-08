import { getBtcUtxos, validateAddressUrl } from '@/apis'
import { GlobalParamsVersion, ParamsWithContext, Fees, UTXO } from '@/types'

const taprootAddressLength = 62

export const isTaproot = (address: string): boolean => {
  return address.length === taprootAddressLength
}

export const sleepTime = (time: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

export const formatParams = (paramsStr: string): Record<string, string> => {
  if (paramsStr.startsWith('?')) {
    paramsStr = paramsStr.slice(1)
  }
  try {
    return paramsStr
      .split('&')
      .map((item) => item.trim())
      .reduce((prev, cur) => {
        const keyVal = cur.split('=')
        const key = keyVal[0]
        const res: Record<string, unknown> = { ...prev }
        if (key) res[key] = keyVal[1] || ''
        return res
      }, {})
  } catch {
    return {}
  }
}

export const getCurrentGlobalParamsVersion = (
  height: number,
  versionedParams: GlobalParamsVersion[],
): ParamsWithContext => {
  if (!versionedParams.length) {
    throw new Error("No global params versions found");
  }
  // Step 1: Sort the versions in descending order based on activationHeight
  // Note, we have cloned the array to avoid mutating the original array
  const sorted = [...versionedParams].sort(
    (a, b) => b.activationHeight - a.activationHeight,
  );

  const firstActivationHeight = sorted[sorted.length - 1].activationHeight;

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    let isApprochingNextVersion = false;
    let nextVersion: GlobalParamsVersion | undefined;
    // Check if the current version is active at the given height
    if (curr.activationHeight <= height) {
      // Check if the next version is approaching
      if (sorted[i - 1]) {
        // Return the current version and whether the next version is approaching
        if (sorted[i - 1].activationHeight <= height + curr.confirmationDepth) {
          isApprochingNextVersion = true;
        }
        nextVersion = sorted[i - 1];
      }
      // Return the current version if the next version is not approaching
      return {
        currentVersion: curr,
        nextVersion,
        isApprochingNextVersion,
        firstActivationHeight,
      }
    }
  }
  return {
    currentVersion: undefined,
    nextVersion: undefined,
    isApprochingNextVersion: false,
    firstActivationHeight,
  }
}

export const nextPowerOfTwo = (x: number) => {
  if (x <= 0) return 2;
  if (x === 1) return 4;

  return Math.pow(2, Math.ceil(Math.log2(x)) + 1);
}

// Returns min, default and max fee rate from mempool
export const getFeeRateFromMempool = (mempoolFeeRates?: Fees) => {
  if (mempoolFeeRates) {
    // The maximum fee rate is at least 128 sat/vB
    const LEAST_MAX_FEE_RATE = 128;
    return {
      minFeeRate: mempoolFeeRates.hourFee,
      defaultFeeRate: mempoolFeeRates.fastestFee,
      maxFeeRate: Math.max(
        LEAST_MAX_FEE_RATE,
        nextPowerOfTwo(mempoolFeeRates.fastestFee),
      ),
    }
  } else {
    return {
      minFeeRate: 0,
      defaultFeeRate: 0,
      maxFeeRate: 0,
    }
  }
}

export const getPublicKeyNoCoord = (pkHex: string): Buffer => {
  const publicKey = Buffer.from(pkHex, 'hex')
  return publicKey.subarray(1, 33)
}

export function btcToSatoshi(btc: string | number): number {
  return Math.round(+btc * 1e8)
}

/**
 * Retrieve a set of UTXOs that are available to an address
 * and satisfy the `amount` requirement if provided. Otherwise, fetch all UTXOs.
 * The UTXOs are chosen based on descending amount order.
 * @param address - The Bitcoin address in string format.
 * @param amount - The amount we expect the resulting UTXOs to satisfy.
 * @returns A promise that resolves into a list of UTXOs.
 */
export async function getFundingUTXOs(
  address: string,
  amount?: number,
): Promise<UTXO[]> {
  let utxos = null;
  try {
    utxos = await getBtcUtxos(address)
  } catch (error: Error | any) {
    throw new Error(error?.message || error);
  }

  // Remove unconfirmed UTXOs as they are not yet available for spending
  // and sort them in descending order according to their value.
  // We want them in descending order, as we prefer to find the least number
  // of inputs that will satisfy the `amount` requirement,
  // as less inputs lead to a smaller transaction and therefore smaller fees.
  const confirmedUTXOs = utxos
    .filter((utxo: any) => utxo.status.confirmed)
    .sort((a: any, b: any) => b.value - a.value);

  // If amount is provided, reduce the list of UTXOs into a list that
  // contains just enough UTXOs to satisfy the `amount` requirement.
  let sliced = confirmedUTXOs;
  if (amount) {
    let sum = 0
    for (var i = 0; i < confirmedUTXOs.length; ++i) {
      sum += confirmedUTXOs[i].value;
      if (sum > amount) break;
    }
    if (sum < amount) {
      return [];
    }
    sliced = confirmedUTXOs.slice(0, i + 1);
  }

  const addressInfo = await validateAddressUrl(address)
  const { isvalid, scriptPubKey } = addressInfo;
  if (!isvalid) {
    throw new Error('Invalid address');
  }

  // Iterate through the final list of UTXOs to construct the result list.
  // The result contains some extra information,
  return sliced.map((s: any) => {
    return {
      txid: s.txid,
      vout: s.vout,
      value: s.value,
      scriptPubKey: scriptPubKey,
    };
  });
}
