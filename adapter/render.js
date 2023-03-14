const lodash = require( 'lodash')
const { Data } = require( '../components/Data.js')
const puppeteer = require( '../../lib/puppeteer/puppeteer.js')
const { common } = require( "../../lib/common/common")

const plugin = 'xiaoyao-plugin'

const _path = common.getSourcePath();

async function render(app = '', tpl = '', data = {}, imgType = 'jpeg') {
	// 在data中保存plugin信息
	data._plugin = plugin
	if (lodash.isUndefined(data._res_path)) {
		data._res_path = `../../../../../plugins/${plugin}/resources/`
	}
	if (imgType == "png") {
		data.omitBackground = true;
	}
	data.imgType = imgType;
	Data.createDir(common.getDataPath(), `/html/${plugin}/${app}/${tpl}`)
	data.saveId = data.saveId || data.save_id || tpl
	data.tplFile = `plugins/${plugin}/resources/${app}/${tpl}.html`
	data.pluResPath = data._res_path
	data.pageGotoParams = {
		waitUntil: 'networkidle0'
	}
	return await puppeteer.screenshot(`${plugin}/${app}/${tpl}`, data)
}

function getRender() {
	return async function render(app = '', tpl = '', data = {}, imgType = 'jpeg') {
		// 在data中保存plugin信息
		data._plugin = plugin
		if (lodash.isUndefined(data._res_path)) {
			data._res_path = `../../../../../plugins/${plugin}/resources/`
		}
		if (imgType == "png") {
			data.omitBackground = true;
		}
		data.imgType = imgType;
		Data.createDir(_path + '/data/', `html/${plugin}/${app}/${tpl}`)
		data.saveId = data.saveId || data.save_id || tpl
		data.tplFile = `./${plugin}/resources/${app}/${tpl}.html`
		data.pluResPath = data._res_path
		data.pageGotoParams = {
			waitUntil: 'networkidle0'
		}
		return await puppeteer.screenshot(`${plugin}/${app}/${tpl}`, data)
	}
}

exports.render = render
exports.getRender = getRender
