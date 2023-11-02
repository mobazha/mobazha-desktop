const { app: electronApp } = require('electron');
const Log = require('ee-core/log');
const Conf = require('ee-core/config');

/**
 * 唤醒插件
 * @class
 */
class AwakenAddon {

  constructor() {
    this.protocol = '';
  }

  /**
   * 创建
   */
  create () {
    Log.info('[addon:awaken] load');

    const cfg = Conf.getValue('addons.awaken');
    this.protocol = cfg.protocol;
  
    electronApp.setAsDefaultProtocolClient(this.protocol);
  
    this.handleArgv(process.argv);
    electronApp.on('second-instance', (event, argv) => {
      if (process.platform === 'win32') {
        this.handleArgv(argv)
      }
    })
  
    // 仅用于macOS
    electronApp.on('open-url', (event, urlStr) => {
      this.handleUrl(urlStr)
    })
  }

  /**
   * 参数处理
   */  
  handleArgv(argv) {
    const offset = electronApp.isPackaged ? 1 : 2;
    const url = argv.find((arg, i) => i >= offset && arg.startsWith(this.protocol));
    this.handleUrl(url)
  }

  /**
   * url解析
   */
  handleUrl(awakeUrlStr) {
    if (!awakeUrlStr || awakeUrlStr.length === 0) {
      return
    }
    const {hostname, pathname, search} = new URL(awakeUrlStr);
    let awakeUrlInfo = {
      urlStr: awakeUrlStr,
      urlHost: hostname,
      urlPath: pathname,
      urlParams: search && search.slice(1)
    }
    Log.info('[addon:awaken] awakeUrlInfo:', awakeUrlInfo);

    global.externalRoute = awakeUrlInfo.urlStr;

    if (app.mainWindow) {
      // if our app router is fully loaded it will process the event sent below, otherwise
      // the global.externalRoute will be used
      app.mainWindow.webContents.send('external-route', awakeUrlInfo.urlStr);
    }
  }
}

AwakenAddon.toString = () => '[class AwakenAddon]';
module.exports = AwakenAddon;