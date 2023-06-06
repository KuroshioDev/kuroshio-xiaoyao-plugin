const { miHoYoApi } = require( "../model/mys/mihoyoApi.js")
const fs  = require( 'node:fs')
const lodash = require( 'lodash')
const utils = require( '../model/mys/utils.js')
const gsCfg = require( './gsCfg.js')
const {isV3} = require( '../components/Changelog.js')
const {Cfg, Data} = require( "../components/index.js")
const moment = require( 'moment')
const MysInfo = require( "../../genshin/model/mys/mysInfo")
const common = require( '../../lib/common/common')
const _path = common.getPluginsPath();
const plugin = "xiaoyao-plugin"
const nameData = ["原神", "崩坏3", "崩坏2", "未定事件簿"];
const yamlDataUrl = `${_path}/xiaoyao-plugin/data/yaml`;
const cloudDataUrl = `${_path}/xiaoyao-plugin/data/yunToken/`

let bbsTask = false;
let cloudTask = false;
let mysTask = false;
const { Logger } = require( 'koishi')
const logger = new Logger("xiaoyao-model-user")

/** 配置文件 */class user {
    constructor(e) {
        this.e = e;
        this.stokenPath = `./plugins/${plugin}/data/yaml/`
        this.yunPath = `./plugins/${plugin}/data/yunToken/`;
        Data.createDir("", this.yunPath, false)
        this.ForumData = Data.readJSON(`${_path}/xiaoyao-plugin/defSet/json`, "mys")
        this.configSign = gsCfg.getfileYaml(`${_path}/xiaoyao-plugin/config/`, "config");
        this.configSign.signlist = this.configSign.signlist || "原神|崩坏3|崩坏2|未定事件簿".split("|")
        this.getToken = this.configSign.getToken || ''
        this.getyunToken(this.e)
    }

    async getCkData() {
        let sumData = {};
        let yunres = await this.cloudSeach();
        let yundata = yunres.data
        if (yunres.retcode === 0) {
            sumData["云原神"] = {
                "今日可获取": yundata?.coin?.free_coin_num,
                "米云币": yundata?.coin?.coin_num,
                "免费时长": yundata?.free_time?.free_time,
                "总时长": yundata.total_time
            }
        }
        let mysres = await this.bbsSeachSign();
        if (mysres.retcode === 0) {
            sumData["米游社"] = {
                "米游币任务": mysres.data.can_get_points != 0 ? "未完成" : "已完成",
                "米游币余额": mysres.data.total_points,
                "今日剩余可获取": mysres.data.can_get_points
            }
        }
        let resSign = await this.multiSign(this.ForumData);
        if (resSign?.upData) {
            for (let item of resSign?.upData) {
                let num = lodash.random(0, 9999);
                item.upName = item.upName == "原神" ? "ys" : item.upName == "崩坏3" ? "bh3" : item.upName ==
                    "崩坏2" ? "bh2" : item.upName == "未定事件簿" ? "wdy" : item.upName
                sumData[item.upName + "" + num] = {
                    "uid": item.game_uid,
                    "游戏昵称": item.nickname,
                    "等级": item.level,
                    "今日签到": item.is_sign ? "已签到" : "未签到",
                    "累计签到": item.total_sign_day + "天",
                    "今天奖励": item.awards
                }
            }
        }
        return sumData;
    }

    async getData(type, data = {}, isck = true) {
        if (isck) {
            await this.cookie(this.e)
        }
        this.miHoYoApi = new miHoYoApi(this.e);
        let sk = await global.dbHelper.get('genshin_user_stoken', {
          user_id: [this.e.user_id],
          $and: [{uid: this.e.uid}]
        })
        if(!sk) {
          return {uid: this.e.uid, message: "查找stoken失败"}
        }else {
          this.miHoYoApi.cookies = `stuid=${sk.stuid};stoken=${sk.stoken};mid=${sk.mid};`
        }
        let res = await this.miHoYoApi.getData(type, data)
        return res
    }

    async multiSign(forumData, isCk = false) {
        let upData = [],
            message = '';
        if (isCk) {
            await this.cookie(this.e)
        }
        for (let forum of forumData) {
            if (!(this.configSign.signlist.includes(forum.name))) {
                continue;
            }
            let res
            try {
                message += `**${forum.name}**\n`
                res = await this.getData("userGameInfo", forum, false)
                await utils.sleepAsync(3000) //等几毫秒免得请求太频繁了
                if (res.retcode === -100) {
                    message = `用户：${this.e.user_id}：cookie失效`
                    return {
                        message,
                        upData
                    };
                }
                if (res?.data?.list?.length === 0 || !res?.data?.list) {
                    message += `签到: 未绑定${forum.name}信息\n`;
                    if (this.allSign) {
                        this.allSign[forum.name].bindGame++;
                    }
                    await utils.randomSleepAsync()
                    continue;
                }
                message += `${forum.name}共计${res?.data?.list.length}个账号\n`;

                for (let item of res?.data?.list) {
                    let data = Object.assign({}, forum, item)
                    item.is_sign = true;
                    item.upName = forum.name
                    res = await this.getData("isSign", data, false)
                    await utils.sleepAsync(500)
                    item.total_sign_day = res?.data?.total_sign_day
                    if (res?.data?.is_sign) {
                        if (this.allSign) {
                            this.allSign[forum.name].isSign++;
                        }
                        message += `${item.nickname}-${item.game_uid}：今日已签到~\n`;
                    } else {
                        let signMsg = '';
                        for (let i = 0; i < 2; i++) { //循环请求
                            await utils.sleepAsync(2000)
                            res = await this.getData("sign", data, false)
                            if (res?.data?.gt) {
                                let validate = await this.geetest(res.data)
                                if (validate) {
                                    let header = {}
                                    header["x-rpc-challenge"] = res["data"]["challenge"]
                                    header["x-rpc-validate"] = validate
                                    header["x-rpc-seccode"] = `${validate}|jordan`
                                    data.headers = header
                                    res = await this.getData("sign", data, false)
                                    if (!res?.data?.gt) {
                                        if (this.allSign) {
                                            this.allSign[forum.name].sign++;
                                        }
                                        signMsg = `${item.nickname}-${item.game_uid}:验证码签到成功~\n`
                                        item.total_sign_day++;
                                        break;
                                    } else {
                                        if (this.allSign) {
                                            this.allSign[forum.name].error++;
                                        }
                                        item.is_sign = false;
                                        signMsg =
                                            `${item.nickname}-${item.game_uid}:签到出现验证码~\n请晚点后重试，或者手动上米游社签到\n`;
                                    }
                                } else {
                                    if (this.allSign) {
                                        this.allSign[forum.name].error++;
                                    }
                                    signMsg = `${item.nickname}-${item.game_uid}:验证码失败~\n`
                                }

                            } else {
                                if (this.allSign) {
                                    this.allSign[forum.name].sign++;
                                }
                                item.total_sign_day++;
                                signMsg =
                                    `${item.nickname}-${item.game_uid}：${res.message == "OK" ? "签到成功" : res.message}\n`
                                break;
                            }
                        }
                        message += signMsg
                    }
                    //获取签到信息和奖励信息
                    const SignInfo = await this.getData("home", data, false)
                    if (SignInfo) {
                        let awards = SignInfo.data.awards[item.total_sign_day - 1];
                        item.awards = awards?.name + "*" + awards?.cnt
                    }
                    upData.push(item)
                    await utils.randomSleepAsync()
                }
            } catch (e) {
                if (this.allSign) {
                    this.allSign[forum.name].error++;
                }
                Bot.logger.error(`${forum.name} 签到失败 [${res?.message}]`);
                message += `签到失败: [${res?.message}]\n`;
            }
        }
        return {
            message,
            upData
        }
    }

    async docHelp(type) {
        return this.configSign[type.includes("云") ? "cloudDoc" : "cookiesDoc"]
    }

    async cloudSign() {
        await this.cloudSeach()
        let res = await this.getData("cloudReward")
        Bot.logger.mark(`\n云原神签到用户:${this.e.user_id}:[接口返回]${res.message}\n`)
        if (res?.data?.list?.length == 0 || !res?.data?.list) {
            res.message = `您今天的奖励已经领取了~`
        } else {
            let sendMsg = ``
            for (let item of res?.data?.list) {
                let reward_id = item.id;
                let reward_msg = item.msg;
                res = await this.getData("cloudGamer", {
                    reward_id
                })
                // let row=JSON.parse(reward_msg);
                sendMsg += `\n领取奖励,ID:${reward_id},Msg:${reward_msg}`
            }
            res.message = sendMsg;
        }
        Bot.logger.mark(`\n云原神签到用户:${this.e.user_id}:${res.message}\n`)
        return res
    }

    async cloudSeach() {
        let res = await this.getData("cloudGet")
        if (res?.retcode == -100) {
            res.message = "云原神token失效/防沉迷"
            res.isOk = false;
        } else {
            res.isOk = true;
            if (res?.data?.total_time) {
                res.message =
                    `米云币:${res?.data?.coin?.coin_num},免费时长:${res?.data?.free_time?.free_time}分钟,总时长:${res?.data?.total_time}分钟`;
            }
        }
        return res;
    }

    async bbsSeachSign() {
        let res = await this.getData("bbsisSign", {
            name: "原神"
        })
        if (!res?.data) {
            res.message = `登录Stoken失效请重新获取cookies或stoken保存~`;
            res.isOk = false;
            this.delSytk(yamlDataUrl, this.e)
        } else {
            res.message = `当前米游币数量为：${res.data.total_points},今日剩余可获取：${res.data.can_get_points}`
            res.isOk = true;
        }
        return res;
    }

    async getbbsSign(forumData) {
        let message = '',
            challenge = '',
            res;
        try {
            res = await this.bbsSeachSign()
            if (res?.data?.can_get_points == 0) {
                return {
                    message: `签到任务已完成，无需重复签到`
                }
            }
            for (let forum of forumData) {
                let trueDetail = 0;
                let Vote = 0;
                let Share = 0;
                let sumcount = 0;
                message += `\n**${forum.name}**\n`
                res = await this.getData("bbsSign", forum, false)
                if (res?.retcode == -100) {
                    return {
                        message: '登录失效'
                    }
                }
                if (res?.retcode == 1034) {
                    challenge = await this.bbsGeetest()
                    if (challenge) {
                        forum["headers"] = {
                            "x-rpc-challenge": challenge
                        }
                        res = await this.getData("bbsSign", forum, false)
                        if (res?.retcode == 1034) {
                            message += `社区签到: 验证码失败\n`;
                        } else {
                            message += `社区签到: 验证码成功\n`;
                        }
                    } else {
                        message += `社区签到: 验证码失败\n`;
                    }
                } else {
                    message += `社区签到: ${res.message}\n`;
                }
                Bot.logger.mark(`${this.e.user_id}:${this.e.uid}:${forum.name} 社区签到结果: [${res.message}]`);
                res = await this.getData("bbsPostList", forum, false)
                sumcount++;
                let postList = res.data.list;
                let postId
                for (let post of postList) {
                    post = post.post;
                    postId = post['post_id']
                    res = await this.getData("bbsPostFull", {
                        postId
                    }, false)
                    if (res?.message && res?.retcode == 0) {
                        trueDetail++;
                    }
                    if (res?.retcode == 1034) {
                        challenge = await this.bbsGeetest()
                        if (challenge) {
                            let data = {
                                postId,
                                headers: {
                                    "x-rpc-challenge": challenge,
                                }
                            }
                            await this.getData("bbsPostFull", data, false)
                        }
                    }
                    res = await this.getData("bbsVotePost", {
                        postId
                    }, false)
                    if (res?.message && res?.retcode == 0) {
                        Vote++;
                    }
                    if (res?.retcode == 1034) {
                        challenge = await this.bbsGeetest()
                        if (challenge) {
                            let data = {
                                postId,
                                headers: {
                                    "x-rpc-challenge": challenge,
                                }
                            }
                            await this.getData("bbsVotePost", data, false)
                        }
                    }
                    await utils.randomSleepAsync(2);
                }
                res = await this.getData("bbsShareConf", {
                    postId
                }, false)
                if (res?.message && res?.retcode == 0) {
                    Share++;
                }
                message += `共读取帖子记录${20 * sumcount}\n浏览：${trueDetail}  点赞：${Vote}  分享：${Share}\n`;
                Bot.logger.mark(`\n用户${this.e.user_id}:\n${message}`)
                await utils.randomSleepAsync(3);
            }
        } catch (ex) {
            Bot.logger.error(`出问题了：${ex}`);
            message += `${this.e.user_id}获取米游币异常`;
        }
        return {
            message
        }
    }

    async signTask(e = "") {
        let mul = e;
        //暂不支持多个uid签到
        Bot.logger.mark(`开始米社签到任务`);
        let isAllSign = this.configSign.isAllSign
        let userIdList = [];
        let dir = './data/MysCookie/'
        if (isV3) {
            if (!fs.existsSync(dir)) {
                let NoteUser = (await import(`file://${_path}/plugins/genshin/model/mys/NoteUser.js`)).default
                await NoteUser.forEach(async (user) => {
                    await user.eachMysUser(async (mys) => {
                        let { qq } = user
                        let { ck, ltuid, device_id } = mys
                        if (Object.keys(userIdList).includes(qq+'')) {
                            let seed_id = lodash.sample('abcdefghijklmnopqrstuvwxyz', 4).replace(/,/g, '')
                            userIdList[qq + seed_id] = {
                                qq, ck, device_id,
                                ltuid,
                            }
                        } else {
                            userIdList[qq] = {
                                qq, ck, device_id,
                                ltuid,
                            }
                        }
                    })
                })
            } else {
                userIdList = (await gsCfg.getBingAllCk()).ckQQ
            }
        } else {
            userIdList = NoteCookie;
        }
        if (mysTask) {
            e.reply(`米社自动签到任务进行中，请勿重复触发指令`)
            return false
        }
        mysTask = true;
        let userIdkeys = Object.keys(userIdList);
        let tips = ['开始米社签到任务']
        let time = userIdkeys.length * 25 + 5 + (userIdkeys.length / 3 * 60)
        let finishTime = moment().add(time, 's').format('MM-DD HH:mm:ss')
        tips.push(`\n签到用户：${userIdkeys.length}个`)
        tips.push(`\n预计需要：${this.countTime(time)}`)
        if (time > 120) {
            tips.push(`\n完成时间：${finishTime}`)
        }
        Bot.logger.mark(`签到用户:${userIdkeys.length}个，预计需要${this.countTime(time)} ${finishTime} 完成`)
        if (mul) {
            await this.e.reply(tips)
            if (this.e.msg.includes('force')) this.force = true
        } else {
            await utils.relpyPrivate(await gsCfg.getMasterQQ(), tips)
            await utils.sleepAsync(lodash.random(1, 20) * 1000)
        }
        let _reply = e.reply
        let msg = e?.msg;
        //暂时先这样吧，等有空再优化~
        this.allSign = {
            findModel: ["崩坏3", "崩坏2", '原神', '未定事件簿', '崩坏星穹铁道'],
            "崩坏3": {
                bindGame: 0,
                sign: 0,
                isSign: 0,
                error: 0,
            },
            "崩坏2": {
                bindGame: 0,
                sign: 0,
                isSign: 0,
                error: 0,
            },
            "原神": {
                bindGame: 0,
                sign: 0,
                isSign: 0,
                error: 0,
            },
            "未定事件簿": {
                bindGame: 0,
                sign: 0,
                isSign: 0,
                error: 0,
            },
            "崩坏星穹铁道": {
                bindGame: 0,
                sign: 0,
                isSign: 0,
                error: 0,
            },
            sendReply() {
                let msg = ""
                for (let item of this.findModel) {
                    msg +=
                        `**${item}**\n已签：${this[item].isSign}\n签到成功：${this[item].sign}\n未绑定信息：${this[item].bindGame}\n签到失败异常：${this[item].error}\n`
                }
                return msg
            }
        }
        for (let qq of userIdkeys) {
            let user_id = qq.replace(/\s+(?:n$)?/gi, '');
            let ltuid=userIdList[qq]?.ltuid
            let e = {
                user_id,
                qq: user_id,
                isTask: true,
                uid: userIdList[qq].uid,
                cookie: userIdList[qq].cookie || userIdList[qq].ck,
            };
            if (msg) {
                e.msg = msg.replace(/全部|签到|米社/g, "");
            } else {
                e.msg = "全部"
            }
            Bot.logger.mark(`正在为qq:${user_id},通行证id:${ltuid}米社签到中...`);

            this.e = e;
            let res = await this.multiSign(this.getDataList(e.msg));
            Bot.logger.mark(`${res.message}`)
            e.reply = (msg) => {
                if (!isAllSign || mul) {
                    return;
                }
                if (msg.includes("OK")) {
                    utils.relpyPrivate(user_id, msg + "\n自动签到成功");
                }
            };
            e.reply(res.message)
            this.e.reply(res.message)
            await utils.sleepAsync(15000);
        }
        msg = `米社签到任务完成\n` + this.allSign.sendReply()
        Bot.logger.mark(msg);
        if (mul) {
            _reply(msg)
        } else {
            await utils.relpyPrivate(await gsCfg.getMasterQQ(), msg)
        }
        mysTask = false;
    }

    async cloudTask(e = "") {
        let mul = e;
        Bot.logger.mark(`云原神签到任务开始`);
        let files = fs.readdirSync(this.yunPath).filter(file => file.endsWith('.yaml'))
        if (files.length == 0) return;
        let isCloudSignMsg = this.configSign.isCloudSignMsg
        let userIdList = (files.join(",").replace(/.yaml/g, "").split(","))
        if (cloudTask) {
            e.reply(`云原神自动签到任务进行中，请勿重复触发指令`)
            return false
        }
        let tips = ['开始云原神签到任务']
        let time = userIdList.length * 3.5 + 5
        let finishTime = moment().add(time, 's').format('MM-DD HH:mm:ss')
        tips.push(`\n签到用户：${userIdList.length}个`)
        tips.push(`\n预计需要：${this.countTime(time)}`)
        if (time > 120) {
            tips.push(`\n完成时间：${finishTime}`)
        }
        Bot.logger.mark(`签到用户:${userIdList.length}个，预计需要${this.countTime(time)} ${finishTime} 完成`)
        if (mul) {
            await this.e.reply(tips)
        } else {
            await utils.relpyPrivate(await gsCfg.getMasterQQ(), tips)
            await utils.sleepAsync(lodash.random(1, 20) * 1000)
        }
        cloudTask = true;
        let _reply = e.reply
        for (let qq of userIdList) {
            let user_id = qq;
            let e = {
                user_id,
                qq,
                isTask: true
            };
            Bot.logger.mark(`正在为qq${user_id}云原神签到中...`);
            e.msg = "全部"
            e.reply = (msg) => {
                if (!isCloudSignMsg || mul) {
                    return;
                }
                if (msg.includes("领取奖励")) {
                    utils.relpyPrivate(qq, msg + "\n云原神自动签到成功");
                }
            };
            this.e = e
            await this.getyunToken(e)
            let res = await this.cloudSign();
            this.e.reply(res.message)
            await utils.sleepAsync(10000);
        }
        let msg = `云原神签到任务完成`
        Bot.logger.mark(msg);
        if (mul) {
            _reply(msg)
        } else {
            await utils.relpyPrivate(await gsCfg.getMasterQQ(), msg)
        }
        cloudTask = false;
    }

    countTime(time) {
        let hour = Math.floor((time / 3600) % 24)
        let min = Math.floor((time / 60) % 60)
        let sec = Math.floor(time % 60)
        let msg = ''
        if (hour > 0) msg += `${hour}小时`
        if (min > 0) msg += `${min}分钟`
        if (sec > 0) msg += `${sec}秒`
        return msg
    }

    async bbsTask(e = "") {
        let mul = e;
        Bot.logger.mark(`开始米社米币签到任务`);
        let stoken = await gsCfg.getBingStoken();
        let isPushSign = this.configSign.isPushSign
        let userIdList = Object.keys(stoken)
        if (bbsTask) {
            e.reply(`米游币自动签到任务进行中，请勿重复触发指令`)
            return false
        }
        let tips = ['开始米游币签到任务']
        let time = userIdList.length * 100 + 5
        let finishTime = moment().add(time, 's').format('MM-DD HH:mm:ss')
        tips.push(`\n签到用户：${userIdList.length}个`)
        tips.push(`\n预计需要：${this.countTime(time)}`)
        if (time > 120) {
            tips.push(`\n完成时间：${finishTime}`)
        }
        Bot.logger.mark(`签到用户:${userIdList.length}个，预计需要${this.countTime(time)} ${finishTime} 完成`)
        if (mul) {
            await this.e.reply(tips)
            if (this.e.msg.includes('force')) this.force = true
        } else {
            await utils.relpyPrivate(await gsCfg.getMasterQQ(), tips)
            await utils.sleepAsync(lodash.random(1, 20) * 1000)
        }
        bbsTask = true;
        let _reply = e.reply
        let counts = 0;
        //获取需要签到的用户
        for (let dataUid of stoken) {
            for (let uuId in dataUid) {
                try {
                    if (uuId[0] * 1 > 5) {
                        continue;
                    }
                    let data = dataUid[uuId]
                    let user_id = data.userId * 1;
                    let e = {
                        user_id,
                        isTask: true
                    };
                    counts++;
                    e.cookie = `stuid=${data.stuid};stoken=${data.stoken};ltoken=${data.ltoken};`;
                    Bot.logger.mark(`[米游币签到][第${counts}个]正在为qq${user_id}：uid:${uuId}签到中...`);
                    e.msg = "全部"
                    e.reply = (msg) => {
                        //关闭签到消息推送
                        if (!isPushSign || mul) {
                            return;
                        }
                        if (msg.includes("OK")) { //签到成功并且不是已签到的才推送
                            utils.relpyPrivate(user_id, msg + "uid:" + uuId + "\n自动签到成功");
                        }
                    };
                    this.e = e;
                    //await 代表同步 你可以尝试去除await以进行优化速度
                    let res = await this.getbbsSign(this.ForumData);
                    e.reply(res.message)
                    await utils.sleepAsync(10000);
                } catch (error) {
                    logger.error(`米游币签到报错：` + error)
                }

			}
		}
		let msg = `米社米币签到任务完成`
		logger.info(msg);
		if (mul) {
			_reply(msg)
		} else {
			await utils.relpyPrivate(await gsCfg.getMasterQQ(), msg)
		}
		bbsTask = false;
	}
	async bbsGeetest() {
		if(!this.getToken) return ""
		try {
			let res = await this.getData('bbsGetCaptcha', false)
			// let challenge = res.data["challenge"]
			// await this.getData("geeType", res.data, false)
			res.data.getToken = this.getToken
			res = await this.getData("validate", res.data, false)
			if (res?.data?.validate) {
				res = await this.getData("bbsCaptchaVerify", res.data, false)
				return res["data"]["challenge"]
			}
		} catch (error) {
			//大概率是数据空导致报错这种情况很少见捏，所以你可以忽略不看
			logger.error('[validate][接口请求]异常信息：' + error)
			return ""
		}
		return ""
	}
	async geetest(data) {
		if(!this.getToken) return ""
		try {
			data.getToken = this.getToken
			let res = await this.getData("validate", data, false)
			if (res?.data?.validate) {
				let validate = res?.data?.validate
				return validate
			}
		} catch (error) {
			//大概率是数据空导致报错这种情况很少见捏，所以你可以忽略不看
			logger.error('[validate][接口请求]异常信息：' + error)
			return ""
		}
		return ""
	}
	async getyunToken(e) {
    let userData = await global.dbHelper.list('genshin_user_cookie', {
      user_id: [e.userId],
      isMain: true
    })
		try {
			let ck = userData.ck
			this.e.devId = ck.devId;
			this.e.yuntoken = ck.yuntoken;
			return ck
		} catch (error) {
			return ""
		}
	}
	async cookie(e) {
		let {
			cookie,
			uid,
			skuid
		} = await this.getCookie(e);
		let cookiesDoc = await this.getcookiesDoc();
		if (!cookie) {
			return false;
		}
		let stokens = this.getStoken(e.user_id)
		if (!stokens) {
			return true;
		}
		if (!cookie.includes("login_ticket") && (isV3 && !skuid?.login_ticket)) {
			return false;
		}
		let flot = await this.stoken(cookie, e)
		await utils.sleepAsync(1000); //延迟加载防止文件未生成
		if (!flot) {
			return false;
		}
		return true;
	}
	async getcookiesDoc() {
		return await gsCfg.getfileYaml(`${_path}/${plugin}/config/`, "config").cookiesDoc
	}
	async getCookie(e) {
		let skuid, cookie, uid
    skuid = await gsCfg.getBingCookie(e.user_id);
    cookie = skuid?.ck;
    uid = skuid?.item;
		if (!uid) {
			uid = e.runtime?.user?._regUid
		}
		this.e.uid = uid;
		this.e.cookie = cookie;
		return {
			cookie,
			uid,
			skuid
		}
	}
	async stoken(cookie, e) {
		this.e = e;
		let datalist = this.getStoken(e.user_id) || {}
		if (Object.keys(datalist).length > 0) {
			return true;
		}
		const map = await utils.getCookieMap(cookie);
		let loginTicket = map?.get("login_ticket");
		const loginUid = map?.get("login_uid") ? map?.get("login_uid") : map?.get("ltuid");
		if (isV3) {
			loginTicket = gsCfg.getBingCookie(e.user_id).login_ticket
		}
		let mhyapi = new miHoYoApi(this.e);
    await mhyapi.init();
		let res = await mhyapi.getData("bbsStoken", {
			loginUid,
			loginTicket
		}, false)
		if (res?.data) {
			datalist[e.uid] = {
				stuid: map?.get("account_id"),
				stoken: res.data.list[0].token,
				ltoken: res.data.list[1].token,
				uid: e.uid,
				userId: e.user_id,
				is_sign: true,
        login_ticket: login_ticket
			}
			gsCfg.saveBingStoken(e.user_id, datalist)
		}
		return true;
	}
	async getStoken(userId) {
    let ck = await global.dbHelper.get('genshin_user_cookie', {
      user_id: [userId],
      $and: [{isMain: true}]
    })
    if (ck) {
      let stoken = await global.dbHelper.get('genshin_user_stoken', {
        user_id: [userId],
        $and: [{uid: ck.uid}]
      })
      return stoken
    }
    return {}
  }
	async seachUid(data) {
		let ltoken = '', v2Sk;
		if (data?.data) {
			let res;
			if (this.e.sk) {
				if (this.e.sk.get('stoken').includes('v2_')) {
					res = await this.getData('getLtoken', { cookies: this.e.raw_message }, false)
					ltoken = res?.data?.ltoken
				} else {
					v2Sk = await this.getData('getByStokenV2', { headers: { Cookie: this.e.raw_message } }, false)
				}
				this.e.cookie =
					`ltoken=${this.e.sk?.get('ltoken') || ltoken};ltuid=${this.e.sk?.get('stuid')};cookie_token=${data.data.cookie_token}; account_id=${this.e.sk?.get('stuid')};`
				// if(this.e.sk?.get('mid')){
				// 	this.e.cookie =
				// 		`ltoken_v2=${this.e.sk?.get('ltoken')||ltoken};cookie_token_v2=${data.data.cookie_token}; account_mid_v2=${this.e.sk.get('mid')};ltmid_v2=${this.e.sk.get('mid')}`
				// }
			} else {
				this.e.cookie = this.e.original_msg //发送的为cookies
				this.cookies = `stuid=${this.e.stuid};stoken=${data?.data?.list[0].token};ltoken=${data?.data?.list[1].token}`
				res = await this.getData('getLtoken', { cookies: this.cookies }, false)
				v2Sk = await this.getData('getByStokenV2', { headers: { Cookie: this.cookies } }, false)
			}
			res = await this.getData("userGameInfo", this.ForumData[1], false)
			if (res?.retcode != 0) {
				return false;
			}
			// console.log(res,this.e.sk)
			let uids = []
			for (let s of res.data.list) {
				let datalist = {}
				let uid = s.game_uid
				uids.push(uid)
				datalist[uid] = {
					stuid: this.e?.sk?.get('stuid') || this.e.stuid,
					stoken: v2Sk?.data?.token?.token || this.e?.sk?.get('stoken') || data?.data?.list[0].token,
					ltoken: this.e?.sk?.get('ltoken') || ltoken || data?.data?.list[1].token,
					mid: this.e?.sk?.get('mid') || v2Sk?.data?.user_info?.mid,
					uid: uid,
					user_id: this.e.user_id,
					is_sign: true,
          login_ticket: data.loginTicket
				}
        let query = {uid: uid, $and: [{user_id: this.e.user_id}]}
        let loginTicket = data.loginTicket
        await global.dbHelper.update("genshin_user_cookie", query, {login_ticket: loginTicket})
				await gsCfg.saveBingStoken(this.e.user_id, datalist)
			}
			let msg = `uid:${uids.join(',')}\nstoken绑定成功您可通过下列指令进行操作:`;
			msg += '\n【#米币查询】查询米游币余额'
			msg += '\n【#mys原神签到】获取米游币'
			msg += '\n【#更新抽卡记录】更新抽卡记录'
			msg += '\n【#刷新ck】刷新失效cookie'
			msg += '\n【#我的stoken】查看绑定信息'
			msg += '\n【#删除stoken】删除绑定信息'
			this.e.reply(msg)
		}
	}

	async delSytk(path = yamlDataUrl, e, type = "stoken") {
    let ck = await this.getCookie(this.e);

		if (type != "stoken") {
			path = cloudDataUrl
		}else {
      if(!ck){
        await global.dbHelper.remove('genshin_user_stoken', {
          user_id: e.user_id,
        })
        e.reply(`未绑定ck，已删除全部stoken`)
      }else if(ck.uid){
        await global.dbHelper.remove('genshin_user_stoken', {
          user_id: e.user_id,
          $and: [{uid: ck.uid}]
        })
        e.reply(`已删除${ck.uid}的stoken`)
      }
    }
    return true;
	}
	getDataList(name) {
		for (let item of this.ForumData) {
			if (item.name == name) { //循环结束未找到的时候返回原数组签到全部
				return [item]
			}
		}
		return this.ForumData;
	}
}

module.exports = user
