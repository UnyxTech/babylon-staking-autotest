import { useEffect, useState } from 'react'
import autoTestController from '@/utils/autoTestController'
import { formatParams } from '@/utils'
import { status } from '@/constants/page'
import './index.css'

function Home() {
  const [wallet, setWallet] = useState('')
  const [stakeStatus, setStakeStatus] = useState(status.running)
  const [unbondingStatus, setUnbondingStatus] = useState(status.notStart)

  const initPage = () => {
    const params = formatParams(location.search)
    setWallet(params?.wallet || '')
  }

  const setStakeResult = (res: string) => {
    setStakeStatus(res)
  }

  const setUnbondingResult = (res: string) => {
    setUnbondingStatus(res)
  }

  useEffect(() => {
    initPage()
    autoTestController.start({
      setStakeResult,
      setUnbondingResult,
    })
  }, [])

  const getShowClass = (stat: string) => {
    if (stat === status.success) {
      return 'success'
    }
    if (stat === status.failed) {
      return 'failed'
    }
    if (stat === status.notStart) {
      return 'not-start'
    }
    return ''
  }

  return (
    <div>
      <h2>Auto Test For Babylon Stake</h2>
      <hr />
      <div>
        <span>Current wallet : </span>
        <strong>{wallet.toUpperCase()}</strong>
      </div>
      <div>
        <span>Process of stake : </span>
        <strong id="stake-status" className={getShowClass(stakeStatus)}>
          {stakeStatus}
        </strong>
      </div>
      <div>
        <span>Process of unbind : </span>
        <strong id="unbonding-status" className={getShowClass(unbondingStatus)}>
          {unbondingStatus}
        </strong>
      </div>
    </div>
  )
}

export default Home
