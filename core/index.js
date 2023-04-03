const { Context, Schema } = require( 'koishi')
const { Logger } = require( 'koishi')
const { app } = require( '../adapter/index.js')
const AdminApp = require( "./entrace/admin.js")
const ImageApp = require( "./entrace/image.js")
const UserApp = require( "./entrace/user.js")
const initDB = require( "./database/db.js")
const SignApp = require( "./entrace/sign.js")
const NoteApp = require( "./entrace/note.js")
const LoginApp = require( "./entrace/login.js")
const common = require("../../lib/common/common.js")
const fs = require( "fs")
const MapApp = require( "./entrace/map")
const YAML = require('yaml')

const logger = new Logger("Kuroshio-Genshin-Plugin")

class XiaoyaoPlugin {

  constructor(ctx, config) {
    // ready
    ctx.on("ready", async ()=>{
      let locale = YAML.parse(
        fs.readFileSync(`${common.getPluginsPath()}/xiaoyao-plugin/core/locales/zh.yml`, 'utf8')
      )
      ctx.i18n.define('zh', locale)
      initDB(ctx)
      new AdminApp(app,ctx,config)
      new ImageApp(app,ctx, config)
      new UserApp(app,ctx, config)
      new SignApp(app,ctx, config)
      new NoteApp(app,ctx, config)
      new LoginApp(app,ctx, config)
      new MapApp(app, ctx, config)
    })
  }
}

exports.default = XiaoyaoPlugin
exports.name = 'xiaoyao-plugin'
