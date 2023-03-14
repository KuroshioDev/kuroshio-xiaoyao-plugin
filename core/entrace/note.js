class NoteApp {
  constructor(app, ctx, config) {
    ctx.guild().command('genshin.profile.notes', { authority: 1 }).userFields(['id'])
      .alias("#体力")
      .shortcut(/^#*(多|全|全部)(体力|树脂|查询体力|便笺|便签)$/)
      .action(async ({session}) => {
        session.send("耗时操作，请稍候")
        new app(ctx, session).dispatch()
      })
  }
}

module.exports = NoteApp
