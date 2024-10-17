import axios from 'axios'

const mempoolApi = axios.create({ baseURL: import.meta.env.VITE_MEMPOOL_API })

export const getBtcTipHeight = async () => {
  try {
    const res = await mempoolApi.get(`/api/blocks/tip/height`)
    return res.data
  } catch (err) {
    console.log('req getBtcHeight failed: ', err)
    return null
  }
}

export const getBtcNetworkFees = async () => {
  try {
    const res = await mempoolApi.get(`/api/v1/fees/recommended`)
    return res.data
  } catch (err) {
    console.log('req getBtcNetworkFees failed: ', err)
    return null
  }
}

export const getBtcUtxos = async (address: string) => {
  try {
    const res = await mempoolApi.get(`/api/address/${address}/utxo`)
    return res.data
  } catch (err) {
    console.log('req getBtcUtxos failed: ', err)
    return []
  }
}

export const validateAddressUrl = async (address: string) => {
  try {
    const res = await mempoolApi.get(`/api/v1/validate-address/${address}`)
    return res.data
  } catch (err) {
    console.log('req validateAddressUrl failed: ', err)
    return []
  }
}

export const getTxInfo = async (txId: string) => {
  try {
    const res = await mempoolApi.get(`/api/tx/${txId}`)
    return res.data
  } catch (err) {
    console.log('req getTxInfo failed: ', err)
    return []
  }
}
