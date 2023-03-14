class MapApp {
  constructor(app, ctx, config) {
    ctx.guild().command('genshin.wiki.map', { authority: 1 })
      .shortcut(/^#(刷新|更新)?(.*)(在(哪|那)里*)$/)
      .action(async ({session}) => {
        new app(ctx, session).dispatch()
      })
  }
}

module.exports = MapApp
