const sh = require('shelljs')
const service = require('../service/index.cjs')

const gap = process.env.STAKE_LOOP_GAP || 2 * 24 * 60 * 60 * 1000

async function loopRunner() {
  await service.execStakeTest()

  const timer = setTimeout(() => {
    loopRunner()
    clearTimeout(timer)
  }, gap)
}

loopRunner()
service.startup()
