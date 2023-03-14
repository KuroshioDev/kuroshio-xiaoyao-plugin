module.exports = function initDB(ctx){
    ctx.model.extend('genshin_user_stoken', {
        // 各字段类型
        id: 'unsigned',
        uid: 'string',
        qq: 'string',
        stuid: 'string',
        stoken: 'string',
        ltoken: 'string',
        mid: 'string',
        is_sign: "boolean",
        user_id: "string",
        login_ticket: "string",
        create_time: "timestamp",
        update_time: "timestamp"
      }, {
        // 使用自增的主键值
        autoInc: true,
    })
}
