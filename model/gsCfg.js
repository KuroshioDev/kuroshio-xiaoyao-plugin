const YAML  = require( 'yaml')
const fs  = require( 'node:fs')
const lodash = require( 'lodash')
const {isV3}  = require( '../components/Changelog.js')
const { common } = require( '../../lib/common/common')

const { Logger } = require( "koishi")
const plugin = "xiaoyao-plugin"
/**
 * 配置文件
 * 主要用于处理 stoken以及云原神账号数据
 */
const logger = new Logger("xiaoyao-model-GsCfg")
const _path = common.getPluginsPath();
class GsCfg {
	constructor() {

	}
	/** 通用yaml读取*/
	getfileYaml(path, name) {
		this.cpCfg('config', 'config')
		return YAML.parse(
			fs.readFileSync(path + name + ".yaml", 'utf8')
		)
	}
	cpCfg (app, name) {
	  if (!fs.existsSync(`${_path}/${plugin}/config`)) {
	    fs.mkdirSync(`${_path}/${plugin}/config`)
	  }

	  let set = `${_path}/${plugin}/config/${name}.yaml`
	  if (!fs.existsSync(set)) {
	    fs.copyFileSync(`${_path}/${plugin}/defSet/${app}/${name}.yaml`, set)
	  }
	}
	async getMasterQQ(){
		let qq;
		if(isV3){
			let config=(await import(`file://${_path}/lib/config/config.js`)).default
			qq=config.default.masterQQ[0]
		}else{
			qq=BotConfig.masterQQ[0]
		}
		return qq
	}
	/** 读取用户绑定的ck */
	async getBingCk() {
		let ck = {}
		let ckQQ = {}

    let userData = await global.dbHelper.list('genshin_user_cookie')
    userData.forEach((v) => {
			lodash.forEach(v, (v, i) => {
				ck[String(i)] = v
				if (v.isMain && !ckQQ[String(v.qq)]) {
					ckQQ[String(v.qq)] = v
				}
			})
		})

		return {
			ck,
			ckQQ
		}
	}

	/** 读取所有用户绑定的ck */
	async getBingAllCk () {
	  let ck = {}
	  let ckQQ = {}
	  let qqCk={}

    let userData = await global.dbHelper.list('genshin_user_cookie')

    userData.forEach((v) => {
	    let qq
	    lodash.forEach(v, (item, uid) => {
	      qq = item.qq
	      ck[String(uid)] = item
		  if(!qqCk[String(item.qq)]) qqCk[String(item.qq)]=[]
		  qqCk[String(item.qq)].push(item)
	      if (item.isMain && !ckQQ[String(item.qq)]) {
	        ckQQ[String(item.qq)] = item
	      }
	    })
	    if (qq && !ckQQ[String(qq)]) {
	      ckQQ[String(qq)] = Object.values(v)[0]
	    }
	  })

	  return { ck, ckQQ,qqCk }
	}

	async getUserStoken(userId){
    let userData = await global.dbHelper.list('genshin_user_stoken', {
      user_id: [userId],
    })

    let result = {}
    userData.forEach(data =>{
      result[data.uid] = data
    })
    return result
	}
	/** 读取所有用户绑定的stoken */
	async getBingStoken() {
		let ck = []
    let userData = await global.dbHelper.list('genshin_user_stoken')
    userData.forEach((v, index) => {
			ck.push(v)
		})
		return ck
	}
	async getBingCkSingle(userId) {
    let userData = await global.dbHelper.list('genshin_user_cookie', {
      user_id: [userId],
    })

    let result = {}
    userData.forEach(data =>{
      result[data.uid] = data
    })
    return result
  }
	async getBingCookie(userId) {
    let userData = await global.dbHelper.list('genshin_user_cookie', {
      user_id: [userId],
    })
    try {
      for (let index = 0; index < userData.length; index++) {
        let item = userData[index]
        let login_ticket;
        if (!item.isMain) {
          continue;
        }
        login_ticket = item?.login_ticket
        let ck = item.ck
        return {
          ck,
          "item": item.uid,
          login_ticket
        };
      }
    } catch (error) {
      return {}
    }
  }
	async saveBingStoken(userId, data) {
    for (const [uid, st] of Object.entries(data)) {
      if(uid == null || uid.trim() == 'null') {
        continue
      }
      let dbData = await global.dbHelper.get('genshin_user_stoken', {
        user_id: [userId],
        $and: [{uid: uid}]
      })
      st["qq"] = st.user_id
      logger.info(uid,st)
      if(dbData) {
        st["update_time"] = new Date();
        await global.dbHelper.update('genshin_user_stoken', {id: dbData.id}, st)
      }else {
        st["create_time"] = new Date()
        st["update_time"] = new Date();
        await global.dbHelper.create('genshin_user_stoken', st)
      }
    }
  }
}


module.exports = new GsCfg()

