const User = require( "../model/user.js")
const moment = require( 'moment')
const lodash = require('lodash')
const { Logger } = require( "koishi")
const {Data} = require('../components/index')
const common = require('../../lib/common/common');
let ForumData = Data.readJSON(`${common.getPluginsPath()}/xiaoyao-plugin/defSet/json`, "mys")
const rule = {
	sign: {
		reg: `^#*(${lodash.map(ForumData,v=> v.otherName.join('|')).join('|')}|游戏)签到$`,
		describe: "米社规则签到"
	},
	bbsSign: {
		reg: `^#*(米游社|mys|社区)(原神|崩坏3|崩坏2|未定事件簿|大别野|崩坏星穹铁道|绝区零|全部)签到$`,
		describe: "米游社米游币签到（理论上会签到全部所以区分开了）"
	},
	cloudSign:{
		reg: "^#*云原神签到$",
		describe: "云原神签到"
	},
	seach: {
		reg: `^#*(米游币|米币|云原神)查询$`,
		describe: "米游币、云原神查询"
	},
	cookiesDocHelp: {
		reg: "^#*(米游社|cookies|米游币|stoken|Stoken|云原神|云)(帮助|教程|绑定)$",
		describe: "cookies获取帮助"
	},
	signTask:{
		reg: `^#((米游币|云原神|米社(原神|崩坏3|崩坏2|未定事件簿)*))全部签到$`,
		describe: "米游币、云原神查询"
	},
}
async function cloudSign(e){
	let user = new User(e);
	START = moment().unix();
	if(!e.yuntoken){
		e.reply('尚未绑定云原神账号！')
		return true;
	}
	let res= await user.cloudSign()
	await replyMsg(e, res.message);
	return true;
}
const checkAuth = async function (e) {
  if (!e?.isMaster&&e?.reply) {
    e?.reply(`只有主人才能命令我哦~
    (*/ω＼*)`)
    return false
  }
  return true;
}

async function signTask(e){
	if (e&&!await checkAuth(e)) {
		return true;
	}
	let user = new User(e);
	let task=e?.msg?.includes("米游币")?'bbs':e?.msg?.includes("云原神")?'cloud':e?.msg?.includes("米社")?'mys':''
	if(!task){
		task=e;
		e='';
	}
	if(task==="bbs"){
		await user.bbsTask(e)
	}
	if(task==="cloud"){
		await user.cloudTask(e)
	}
	if(task==="mys"){
		await user.signTask(e)
	}
	return true;
}
async function cookiesDocHelp(e){
	let user = new User(e);
	e.reply(`【${e.msg.replace(/帮助|教程|绑定/g,"")}帮助】${await user.docHelp(e.msg)}`);
	return true;
}
async function seach(e){
	let user = new User(e);
	START = moment().unix();
	let res
	if(e.msg.includes('币')){
		res= await user.bbsSeachSign()
	}else{
		res= await user.cloudSeach()
	}
	await replyMsg(e, res.message);
	return true;
}
async function bbsSign(e) {
	let user = new User(e);
	START = moment().unix();
	let res = await user.bbsSeachSign()
	if(res.isOk&&res?.data?.can_get_points!==0){
		let msg=e.msg.replace(/(米游社|mys|社区|签到|#)/g,"")
		let forumData = await user.getDataList(msg);
		e.reply(`开始尝试${msg}社区签到预计${msg=='全部'?"10-20":"1-3"}分钟~`)
		res=await user.getbbsSign(forumData)
	}
	await replyMsg(e, res.message);
	return true;
}
let START;
async function sign(e) {
	let user = new User(e);
	START = moment().unix();
	let msg = e.msg.replace(/#|签到|井|米游社|mys|社区/g, "");
	let ForumData = await user.getDataList(msg);
	e.reply(`开始尝试${msg}签到\n预计${msg=='全部'?"60":"5-10"}秒~`)
	let res = await user.multiSign(ForumData,true);
	await replyMsg(e, res.message);
	return true;
}
async function replyMsg(e, resultMessage) {
  const logger = new Logger("sign")
	const END = moment().unix();
	logger.info(`运行结束, 用时 ${END - START} 秒`);
	resultMessage += `\n用时 ${END - START} 秒`;
	e.reply(resultMessage);
}
exports.rule = rule
exports.cloudSign = cloudSign
exports.signTask = signTask
exports.cookiesDocHelp = cookiesDocHelp
exports.seach = seach
exports.bbsSign = bbsSign
exports.sign = sign
exports.replyMsg = replyMsg
