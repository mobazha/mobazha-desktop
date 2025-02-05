import { createApp } from 'vue';
import { createStore } from 'vuex';

import ElementPlus from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import 'element-plus/dist/index.css';
import './assets/scss/main.scss';
// import { TUIComponents, TUICore } from './TUIKit';

import VueVideoPlayer from '@videojs-player/vue'
import 'video.js/dist/video-js.css'

import '/node_modules/ionicons/css/ionicons.min.css';
import '/node_modules/trumbowyg/dist/ui/trumbowyg.min.css';
import '/node_modules/selectize/dist/css/selectize.css';
import '/styles/lib/select2.css';
import "/styles/main.scss";

import VueBackbone from './plugins/vue-backbone/vue-backbone';

import app from '../backbone/app';

import App from './App.vue';
import baseVw from './mixins/baseVw';
import Router from './router/index';
import components from './components/global';

import * as templateHelpers from '../backbone/utils/templateHelpers';

import cart from './store/cart.module';
import VueScrollTo from 'vue-scrollto';

import $ from 'jquery';
window.jQuery = window.$ = $;

// // init TUIKit
// const TUIKit = TUICore.init({});
// // TUIKit add TUIComponents
// TUIKit.use(TUIComponents);

// window.TUIKit = TUIKit;

window.app = app;

function mountVueApp(container) {
  const vueApp = createApp(App);
  vueApp.config.productionTip = false;
  vueApp.use(VueScrollTo);
  vueApp.use(VueVideoPlayer);

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

  const store = createStore({
    modules: {
      cart,
    },
  });

  const appInstance = vueApp.use(Router).use(store).use(VueBackbone).mount(container);
  Router.beforeEach((to, from) => {
    appInstance.showLoadingModal = true;
  });

  Router.afterEach(() => {
    appInstance.showLoadingModal = false;
  });
  return appInstance;
}
window.vueApp = mountVueApp('#appFrame');
