const { Tray, Menu, shell } = require('electron');
const path = require('path');
const Ps = require('ee-core/ps');
const Log = require('ee-core/log');
const Electron = require('ee-core/electron');
const CoreWindow = require('ee-core/electron/window');
const Conf = require('ee-core/config');
const EE = require('ee-core/ee');
const is = require('ee-core/utils/is');

/**
 * 托盘插件
 * @class
 */
class TrayAddon {

  constructor() {
    this.tray = null;
  }

  /**
   * 创建托盘
   */
  create () {
    // 开发环境，代码热更新开启时，会导致托盘中有残影
    if (Ps.isDev() && Ps.isHotReload()) return;
    
    Log.info('[addon:tray] load');
    const { CoreApp } = EE;
    const cfg = Conf.getValue('addons.tray');
    const mainWindow = CoreWindow.getMainWindow();

    // 托盘图标
    let iconPath = path.join(Ps.getHomeDir(), is.macOS() ? cfg.macIcon : cfg.icon);
  
    // 托盘菜单功能列表
    let trayMenuTemplate = [
      {
        label: '显示',
        click: function () {
          mainWindow.show();
        }
      },
      {
        label: 'Quit',
        type: 'normal',
        accelerator: 'Command+Q',
        click: function () {
          CoreApp.appQuit();
        }
      }
    ]
  
    // 点击关闭，最小化到托盘
    mainWindow.on('close', (event) => {
      if (Electron.extra.closeWindow == true) {
        return;
      }
      mainWindow.hide();
      event.preventDefault();
    });
    
    // 实例化托盘
    this.tray = new Tray(iconPath);
    this.tray.setToolTip(cfg.title);
    const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
    this.tray.setContextMenu(contextMenu);
    this.tray.on('double-click', () => {
      mainWindow.show()
    })

    // 使用默认浏览器打开链接
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' }
    })
  }
}

TrayAddon.toString = () => '[class TrayAddon]';
module.exports = TrayAddon;