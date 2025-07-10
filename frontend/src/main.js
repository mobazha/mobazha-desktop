import { createApp } from 'vue';

import ElementPlus from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import 'element-plus/dist/index.css';
import './assets/scss/main.scss';

import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';

import VueVideoPlayer from '@videojs-player/vue'
import 'video.js/dist/video-js.css'

import '/node_modules/ionicons/css/ionicons.min.css';
import '/node_modules/trumbowyg/dist/ui/trumbowyg.min.css';
import '/node_modules/selectize/dist/css/selectize.css';
import '/styles/lib/select2.css';
import "/styles/main.scss";

// 导入浏览器风格布局样式
import './assets/scss/browser-layout.scss';

import VueBackbone from './plugins/vue-backbone/vue-backbone';
import ChatPlugin from './plugins/chat';

// 添加i18n导入
import i18n from './i18n';

import app from '../backbone/app';

import App from './App.vue';
import baseVw from './mixins/baseVw';
import Router from './router/index';
import components from './components/global';
import pinia from './stores';

import * as templateHelpers from '../backbone/utils/templateHelpers';

import VueScrollTo from 'vue-scrollto';

import { Buffer } from 'buffer';
window.Buffer = Buffer;

import $ from 'jquery';
window.jQuery = window.$ = $;

window.app = app;

const queryClient = new QueryClient();

function mountVueApp(container) {
  const vueApp = createApp(App);
  vueApp.config.productionTip = false;
  vueApp.use(VueScrollTo);
  vueApp.use(VueVideoPlayer);
  vueApp.use(VueQueryPlugin, { queryClient })

  vueApp.use(ElementPlus);
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    vueApp.component(key, component);
  }

  // components
  for (const i in components) {
    vueApp.component(i, components[i]);
  }

  vueApp.config.globalProperties.templateHelpers = { ...templateHelpers };
  vueApp.mixin(baseVw);

  vueApp.directive('focus', {
      mounted: (el) => el.focus()
    }
  );

  // 使用i18n插件
  const appInstance = vueApp.use(Router).use(pinia).use(i18n).use(VueBackbone).use(ChatPlugin).mount(container);
  
  Router.beforeEach((to, from) => {
    appInstance.showLoadingModal = true;
  });

  Router.afterEach(() => {
    appInstance.showLoadingModal = false;
  });
  return appInstance;
}
window.vueApp = mountVueApp('#appFrame');