class AdminApp {
  constructor(app, ctx, config) {
    ctx.command('genshin.xiaoyao.updateatlas', { authority: 4 })
      .alias('#图鉴更新')
      .shortcut(/^#图鉴(强制)?更新$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
    ctx.command('genshin.xiaoyao.updatetemplate', { authority: 4 })
      .alias('#图鉴模板更新')
      .shortcut(/^#图鉴模板(强制)?更新$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
    ctx.command('genshin.xiaoyao.alisSetting', { authority: 4 })
      .alias('#图鉴设置')
      .shortcut(/^#图鉴设置目录(开启|关闭)/)
      .shortcut(/^#图鉴设置体力(开启|关闭)/)
      .shortcut(/^#图鉴设置匹配(开启|关闭)/)
      .shortcut(/^#图鉴设置模板(.*)$/)
      .shortcut(/^#图鉴设置获取sk(开启|关闭)/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
    ctx.guild().command('genshin.xiaoyao.alishelp', { authority: 1 })
      .alias('#图鉴帮助')
      .shortcut(/^#图鉴(命令|帮助|菜单|help|说明|功能|指令|使用说明)$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
    ctx.command('genshin.xiaoyao.alisversion', { authority: 4 })
      .alias('#图鉴版本')
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
  }
}

module.exports = AdminApp
