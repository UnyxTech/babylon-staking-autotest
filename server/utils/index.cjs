
const getStartParamsClosure = () => {
  let target = ''
  return () => {
    if (!target) {
      const argv = process.argv
      const customParams = argv.filter(v => v.startsWith('--'))
      target = customParams.reduce((prev, cur) => {
        const item = cur.slice(2)
        const [key, value] = item.split('=')
        return {
          ...prev,
          [key]: value,
        }
      }, {})
    }
    return target
  }
}

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}_${month}_${day}-${hours}_${minutes}_${seconds}`
}

const getItemByXPath = (xpath, mode) => {
  if (typeof document === 'undefined') return

  // find single element
  if (mode === 1) {
    const xpathResult = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    )
    return xpathResult.singleNodeValue
  }

  if (mode === 2) {
    // find multiple elements.
    const xpathResult2 = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    )
    const res = []
    for (var i = 0; i < xpathResult2.snapshotLength; i++) {
      res.push(xpathResult2.snapshotItem(i))
    }
    return res
  }
}

module.exports = {
  getStartParams: getStartParamsClosure(),
  formatTimestamp,
  getItemByXPath,
}
