class SignApp {
  constructor(app, ctx, config) {
    ctx.guild().command('genshin.xiaoyao.sign', { authority: 1 }).userFields(['id'])
      .shortcut(/#(原神|崩坏3|崩坏2|未定事件簿)签到$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
      ctx.guild().command('genshin.xiaoyao.signall', { authority: 4 }).userFields(['id'])
      .shortcut(/#*(米游社|mys|社区)(原神|崩坏3|崩坏2|未定事件簿|大别野|崩坏星穹铁道|绝区零|全部)签到$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
      ctx.command('genshin.xiaoyao.help', { authority: 1 }).userFields(['id'])
      .alias('#米游社帮助')
      .shortcut(/#*(米游社|cookies|米游币|stoken|Stoken|云原神|云)(帮助|教程|绑定)$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
      ctx.guild().command('genshin.xiaoyao.status', { authority: 1 }).userFields(['id'])
      .alias('#米游币查询')
      .shortcut(/^#*(米游币|米币|云原神)查询$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
  }
}

module.exports = SignApp
