const { isV3 } = require( '../components/Changelog.js')
const mys = require( "../model/mhyTopUpLogin.js")
const Common = require( "../components/Common.js")
const { bindStoken } = require( './user.js')
const common = require(  "../../lib/common/common")
const { segment } = require( 'oicq')

const _path = process.cwd();
const rule = {
	qrCodeLogin: {
		reg: `^#(扫码|二维码|辅助)(登录|绑定|登陆)$`,
		describe: "扫码登录"
	},
	UserPassMsg: {
		reg: `^#(账号|密码)(密码)?(登录|绑定|登陆)$`,
		describe: "账号密码登录"
	},
	UserPassLogin: {
		reg: `^账号(.*)密码(.*)$`,
		describe: "账号密码登录"
	},
	payOrder: {
		/** 命令正则匹配 */
		reg: '^#?((原神(微信)?充值(微信)?(.*))|((商品|充值)列表)|((订单|查询)(订单|查询)(.*)))$',
		/** 执行方法 */
		describe: '原神充值（离线）'
	}
}


async function payOrder(e, { render }) {
	let Mys = new mys(e)
	if (/(商品|充值)列表/.test(e.msg)) {
		return await Mys.showgoods( { render })
	} else if (/(订单|查询)(订单|查询)/.test(e.msg)) {
		return await Mys.checkOrder()
	} else if (e.msg.includes('充值')) {
		return await Mys.GetCode({ render })
	}
	return false;
}

async function qrCodeLogin(e, { render }) {
	let Mys = new mys(e)
	let res = await Mys.qrCodeLogin()
	if (!res?.data) return false;
	e._reply = e.reply
	let sendMsg = [segment.at(e.user_id), '\n请扫码以完成绑定\n']
	e.reply = (msg) => {
		sendMsg.push(msg)
	}
	await Common.render(`qrCode/index`, {
		url: res.data.url
	}, {
		e,
		render,
		scale: 1.2, retMsgId: true
	})
	let r = await e._reply(sendMsg)
	//utils.recallMsg(e, r, 30) //默认30，有需要请自行修改
	e.reply = e._reply
	res = await Mys.GetQrCode(res.data.ticket)
	if (!res) return true;
	await bindSkCK(e, res)
	return true;
}


async function UserPassMsg(e) {
	if (!e.isPrivate) {
		return false;
	}
	let Mys = new mys(e)
	await Mys.UserPassMsg()
	return true;
}


async function UserPassLogin(e) {
	if (!e.isPrivate) {
		return false;
	}
	let Mys = new mys(e)
	let res = await Mys.UserPassLogin();
	if (res) await bindSkCK(e, res)
	return res;
}

async function bindSkCK(e, res) {
	e.msg = res?.stoken, e.raw_message = res?.stoken
	e.isPrivate = true
	await bindStoken(e)
	e.ck = res?.cookie, e.msg = res.cookie, e.raw_message = res.cookie;
	if (isV3) {
		let userck = (require(`${common.getPluginsPath()}/genshin/model/user.js`))
		await (new userck(e)).bing()
	} else {
		let {
			bingCookie
		} = (await import(`${_path}/lib/app/dailyNote.js`))
		await bingCookie(e)
	}
}
exports.rule = rule
exports.payOrder = payOrder
exports.qrCodeLogin = qrCodeLogin
exports.UserPassMsg = UserPassMsg
exports.UserPassLogin = UserPassLogin
exports.bindSkCK = bindSkCK
exports.payOrder = payOrder
