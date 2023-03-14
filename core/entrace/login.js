class LoginApp {
  constructor(app, ctx, config) {
    ctx.command('genshin.user.login', { authority: 1 }).userFields(['id'])
      .alias("#扫码登录")
      .shortcut(/^#(扫码|二维码|辅助)(登录|绑定|登陆)$/)
      .action(async ({session}) => {
        //if(session.subtype != 'private') return '请私聊发送'
        new app(ctx, session).dispatch()
      })
  }
}

module.exports = LoginApp
