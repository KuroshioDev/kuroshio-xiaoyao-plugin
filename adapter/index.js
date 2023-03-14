const { plugin } = require("../../lib/plugins/plugin.js")
const Atlas =  require('../apps/index.js')
const { render } = require('./render.js')
const { getMysApi } = require('./mys.js')

class atlas extends plugin {
  constructor (ctx, session) {
	let rule = {
	  reg: '.+',
	  fnc: 'dispatch'
	}
    super({
      name: 'xiaoyao-cvs-plugin',
      desc: '图鉴插件',
      event: 'message',
      priority: 50,
      rule: [rule],
      ctx: ctx,
      session: session
    })
	Object.defineProperty(rule, 'log', {
	  get: () => !!this.isDispatch
	   // get: () =>true
	})
  }
  accept () {
	if(this.event==='notice.*.poke'&&this.e.target_id === Bot.uin){
	  this.e.user_id=this.e.operator_id;
	  this.e.msg = '#poke#'
	}
    this.e.original_msg = this.e.original_msg || this.e.msg
  }
  async dispatch (e) {
    e = this.e
    let msg = e.original_msg || ''
    if (!msg) {
      return false
    }
    e.checkAuth = async function (cfg) {
      return true
    }
    e.getMysApi = async function (cfg) {
      return await getMysApi(e, cfg)
    }
    msg = msg.replace(/#|＃/, '#').trim()
    for (let fn in Atlas.rule) {
      let cfg = Atlas.rule[fn]
      if (Atlas[fn] && new RegExp(cfg.reg).test(msg)) {
        let ret = await Atlas[fn](e, {
          render
        })
        if (ret === true) {
          return true
        }
      }
    }

    return false
  }
}

exports.app = atlas
