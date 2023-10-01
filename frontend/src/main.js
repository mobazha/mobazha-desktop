import { createApp } from 'vue';
import { createStore } from 'vuex';

import Backbone from 'backbone';
import _ from 'underscore';

import ElementPlus from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import 'element-plus/dist/index.css';
import './assets/scss/main.scss';
import { TUIComponents, TUICore } from './TUIKit';

import VueBackbone from './plugins/vue-backbone/vue-backbone';

import app from '../backbone/app';

import App from './App.vue';
import baseVw from './mixins/baseVw';
import Router from './router/index';
import components from './components/global';

import * as templateHelpers from '../backbone/utils/templateHelpers';

import cart from './store/cart.module';

// init TUIKit
const TUIKit = TUICore.init({});
// TUIKit add TUIComponents
TUIKit.use(TUIComponents);

window.TUIKit = TUIKit;

window.app = app;

function mountVueApp(container) {
  const vueApp = createApp(App);
  vueApp.config.productionTip = false;

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

  const store = createStore({
    modules: {
      cart,
    },
  });


  let app = vueApp.use(Router).use(store).use(VueBackbone).mount(container);
  Router.beforeEach((to, from) => {
    app.showLoadingModal = true;
  });

  Router.afterEach(() => {
    app.showLoadingModal = false;
  })
  return app;
}
window.vueApp = mountVueApp('#appFrame');

// https://github.com/jashkenas/backbone/issues/483#issuecomment-71374622
Backbone.Model.prototype.toJSON2 = function() {
  if (this._isSerializing) {
      return this.id || this.cid;
  }
  this._isSerializing = true;
  var json = _.clone(this.attributes);
  _.each(json, function(value, name) {
      _.isFunction((value || "").toJSON2) && (json[name] = value.toJSON2());
  });
  this._isSerializing = false;
  return json;
}