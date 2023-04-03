const { Cfg  } = require( "./index.js")
const { segment } = require( "oicq")
const { currentVersion, yunzaiVersion,isV3 } = require( "./Changelog.js")
const common = require( '../../lib/common/common')

const render = async function (path, params, cfg) {
  let paths = path.split("/");
  let { render, e } = cfg;
  let _layout_path = common.getPluginsPath() + "/xiaoyao-plugin/resources/";
  let layout_path= common.getPluginsPath()  + "/xiaoyao-plugin/resources/common/layout/";
  let base64 = await render(paths[0], paths[1], {
    ...params,
    _layout_path,
	 _tpl_path: common.getPluginsPath()+ '/xiaoyao-plugin/resources/common/tpl/',
    defaultLayout: layout_path + "default.html",
    elemLayout: layout_path + "elem.html",
    sys: {
      scale: Cfg.scale(cfg.scale || 1),
      copyright: `Created By Koishi<span class="version">1.0.0</span> &  xiaoyao-cvs-Plugin<span class="version">${currentVersion}</span>`
    }
  },"png");
 let ret = true
  if (base64) {
    await e.reply(base64)
  }
  return cfg.retMsgId ? ret : true
}

const render_path = async function (path, params, cfg,path_) {
  let paths = path.split("/");
  let { render, e } = cfg;
  let _layout_path = common.getRootPath()  +path_;
  let base64 = await render(paths[0], paths[1], {
    ...params,
    _layout_path,
	_tpl_path: common.getPluginsPath() + '/xiaoyao-plugin/resources/common/tpl/',
    defaultLayout: _layout_path + "default.html",
    elemLayout: _layout_path + "elem.html",
    sys: {
      scale: Cfg.scale(cfg.scale || 1),
      copyright: `Created By koishi & xiaoyao-cvs-Plugin<span class="version">${currentVersion}</span>`
    }
  });
 let ret = true
  if (base64) {
    ret = isV3 ? await e.reply(base64) : await e.reply(segment.image(`base64://${base64}`))
  }
  return cfg.retMsgId ? ret : true
}

exports.render_path = render_path
exports.render = render
exports.cfg = Cfg.get
exports.isDisable = Cfg.isDisable
