const lodash = require( "lodash")
const schedule = require( "node-schedule")
const {AtlasAlias,getBasicVoide} = require( "./xiaoyao_image.js")
const {versionInfo, help} = require( "./help.js")
const {rule : mapRule, genShenMap,delMapData}= require( './map.js')
const {Note, DailyNoteTask, Note_appoint, noteTask, pokeNote} = require( "./Note.js")
const {rule : adminRule, updateRes, sysCfg, updateTemp, updateMiaoPlugin} = require( "./admin.js")

const {rule : userRule, delSign, updCookie, userInfo, gclog, mytoken, gcPaylog, bindStoken, bindLogin_ticket, cloudToken} = require( "./user.js")
const {rule : signRule, sign, bbsSign, cloudSign, seach, cookiesDocHelp, signTask} = require( "./sign.js")

const {rule : topupLoginRule, qrCodeLogin,UserPassMsg,UserPassLogin,payOrder} = require( './mhyTopUpLogin.js')
const gsCfg = require( '../model/gsCfg.js')
const _path = process.cwd();

let rule = {
	versionInfo: {
		reg: "^#图鉴版本$",
		describe: "【#帮助】 图鉴版本介绍",
	},
	help: {
		reg: "^#?(图鉴)?(命令|帮助|菜单|help|说明|功能|指令|使用说明)$",
		describe: "查看插件的功能",
	},
	AtlasAlias: {
		reg: "^(#(.*)|.*图鉴)$",
		describe: "角色、食物、怪物、武器信息图鉴",
	},
	Note: {
		reg: "^#*(多|全|全部)*(体力|树脂|查询体力|便笺|便签)$",
		describe: "体力",
	},
	noteTask: {
		reg: "^#*((开启|关闭)体力推送|体力设置群(推送(开启|关闭)|(阈值|上限)(\\d*)))$",
		describe: "体力推送",
	},
	Note_appoint: {
		reg: "^#(体力模板(设置(.*)|列表(.*))|(我的体力模板列表|体力模板移除(.*)))$",
		describe: "体力模板设置",
	},

	pokeNote: {
		reg: "#poke#",
		describe: "体力",
	},
	getBasicVoide: {
		reg: '#?(动态|幻影)',
		describe: "动态",
	},
	...userRule,
	...signRule,
	...adminRule,
	...topupLoginRule,
	...mapRule
};

lodash.forEach(rule, (r) => {
	r.priority = r.priority || 50;
	r.prehash = true;
	r.hashMark = true;
});
// task();
//定时任务
async function task() {
	if (typeof test != "undefined") return;
	let set = gsCfg.getfileYaml(`${_path}/plugins/xiaoyao-plugin/config/`, "config")
	schedule.scheduleJob(set.mysBbsTime, function () {
		if (set.ismysSign) {
			signTask('bbs')
		}
	});
	schedule.scheduleJob(set.allSignTime, function () {
		if (set.isSign) {
			signTask('mys')
		}
	});
	schedule.scheduleJob(set.cloudSignTime, function () {
		if (set.isCloudSign) {
			signTask('cloud')
		}
	});
	schedule.scheduleJob(set.noteTask, function () {
		if (set.isNoteTask) {
			DailyNoteTask()
		}
	});
}
exports.updateRes = updateRes
exports.updateTemp = updateTemp
exports.delSign = delSign
exports.gcPaylog = gcPaylog
exports.cloudSign = cloudSign
exports.qrCodeLogin = qrCodeLogin
exports.seach = seach
exports.bindLogin_ticket = bindLogin_ticket
exports.payOrder = payOrder
exports.bbsSign = bbsSign
exports.delSign = delSign
exports.gcPaylog = gcPaylog
exports.UserPassMsg = UserPassMsg
exports.UserPassLogin = UserPassLogin
exports.gclog = gclog
exports.mytoken = mytoken
exports.getBasicVoide = getBasicVoide
exports.bindStoken = bindStoken
exports.updateMiaoPlugin = updateMiaoPlugin
exports.userInfo = userInfo
exports.sign = sign
exports.versionInfo = versionInfo
exports.cloudToken = cloudToken
exports.Note_appoint = Note_appoint
exports.signTask = signTask
exports.pokeNote = pokeNote
exports.genShenMap = genShenMap
exports.cookiesDocHelp = cookiesDocHelp
exports.sysCfg = sysCfg
exports.help = help
exports.updCookie = updCookie
exports.DailyNoteTask = DailyNoteTask
exports.noteTask = noteTask
exports.AtlasAlias = AtlasAlias
exports.Note = Note
exports.rule = rule
