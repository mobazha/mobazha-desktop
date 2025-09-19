import { createRouter, createWebHashHistory } from 'vue-router';
import routerMap from './routerMap';
import { setupRouterGuard } from './guard';

const router = createRouter({
  history: createWebHashHistory(),
  routes: routerMap,
  strict: true
})

// 设置路由守卫
setupRouterGuard(router);

export default router
