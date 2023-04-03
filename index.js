const { fs } = require('node:fs')
// export * from './apps/index.js'
const common = require("../../lib/common/common")
const files = fs.readdirSync(`${common.getPluginsPath()}/xiaoyao-plugin/apps`).filter(file => file.endsWith('index.js'))

async function init() {
  console.log("-------------------------")
  //console.log(Atlas)
  let ret = []
  files.forEach((file) => {
    ret.push(import(`./apps/${file}`))
  })
  ret = await Promise.allSettled(ret)
  let apps = {}
  for (let i in files) {
    let name = files[i].replace('.js', '')
    if (ret[i].status != 'fulfilled') {
      continue
    }
    apps = ret[i].value[Object.keys(ret[i].value)[0]]["apps"]
  }
  return apps
}

exports.init = init
