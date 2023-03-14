class ImageApp {
  constructor(app, ctx, config) {
    ctx.guild().command('genshin.wiki.atlas', { authority: 1 })
      .alias('#原神图鉴')
      .shortcut(/#*(.*)图鉴/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
  }
}

module.exports = ImageApp
