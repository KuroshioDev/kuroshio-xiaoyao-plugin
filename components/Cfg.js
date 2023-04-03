const fs = require( "fs")
const lodash = require( 'lodash')
const common = require( '../../lib/common/common')

const _path = common.getPluginsPath();
const _cfgPath = `${_path}/xiaoyao-plugin/components/`;
let cfg = {};

try {
  if (fs.existsSync(_cfgPath + "cfg.json")) {
    cfg = JSON.parse(fs.readFileSync(_cfgPath + "cfg.json", "utf8")) || {};
  }
} catch (e) {
  // do nth
}

let Cfg = {
  get(rote, def = '') {
    return lodash.get(cfg, rote, def);
  },
  set(rote, val) {
    lodash.set(cfg, rote, val);
    fs.writeFileSync(_cfgPath + "cfg.json", JSON.stringify(cfg, null, "\t"));
  },
  scale(pct = 1) {
    let scale = Cfg.get("sys.scale", 100);
    scale = Math.min(2, Math.max(0.5, scale / 100));
    pct = pct * scale;
    return `style=transform:scale(${pct})`;
  },
  isDisable(e, rote) {
    if (Cfg.get(rote, true)) {
      return false;
    }
    if (/^#*图鉴/.test(e.msg || "")) {
      return false;
    }
    return true;
  },
  /** 合并默认配置和用户配置 */
  merged() {
    return lodash.merge({}, cfg)
  }
};

exports.Cfg = Cfg
