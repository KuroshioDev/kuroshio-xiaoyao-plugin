class UserApp {
  constructor(app, ctx, config) {
    ctx.command('genshin.user.login_ticket', {hidden: true, authority: 1}).userFields(['id'])
      .shortcut(/^(.*)login_ticket=(.*)$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
      ctx.command('genshin.user.refreshCk' , { authority: 1 }).userFields(['id'])
      .alias('#刷新ck')
      .shortcut(/^#*(刷新|更新|获取)(ck|cookie)$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
      ctx.command('genshin.user.delStoken' , { authority: 1 }).userFields(['id'])
      .alias('#删除stoken')
      .shortcut(/^#*删除(我的)*(stoken|(云原神|云ck))$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
    ctx.command('genshin.user.mystoken' , { authority: 1 }).userFields(['id'])
      .alias('#我的stoken')
      .shortcut(/^#(我的)?(stoken|云ck)$/)
      .action(async ({session}) => {
        if(session.subtype != 'private') return '请私聊发送'
        new app(ctx, session).dispatch()
      })
    ctx.command('genshin.user.stokenurl', {hidden: true, authority: 1}).userFields(['id'])
      .shortcut(/^(.*)stoken=(.*)$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
    ctx.guild().command('genshin.user.signinfo', { authority: 1 }).userFields(['id'])
      .alias('#签到查询')
      .shortcut(/#(我的)?(ck|stoken|cookie|cookies|签到)查询$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
      ctx.command('genshin.profile.upategachalog', { authority: 1 }).userFields(['id'])
      .shortcut(/^#*(更新|获取)抽卡记录$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })

      ctx.command('genshin.profile.upatepaylog').userFields(['id'])
      .shortcut(/^#*(刷新|获取|更新)(充值|氪金)记录$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
  }
}

module.exports = UserApp
