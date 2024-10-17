
function execImport(params) {
  let module
  return async () => {
    if (!module) {
      module = (await import('chalk')).default
    }
    return module
  }
}

module.exports = execImport()
