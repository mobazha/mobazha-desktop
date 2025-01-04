import * as casdoor from '../utils/casdoor';

// 不需要登录就能访问的路由名称
const whiteList = ['Search', 'UserPage', 'Callback'];

export function setupRouterGuard(router) {
  router.beforeEach((to, from, next) => {
    // 如果是web版本
    if (!import.meta.env.VITE_APP) {
      // 白名单路由或重定向到白名单路由直接放行
      if (whiteList.includes(to.name) || 
          (to.redirectedFrom === '/' && to.name === 'Search')) {
        next();
        return;
      }

      // 其他路由需要登录
      if (!casdoor.isLoggedIn()) {
        // 保存原目标路由
        const redirect = encodeURIComponent(to.fullPath);
        // 跳转到登录
        window.location.href = casdoor.getSigninUrl() + `&redirect_uri=${redirect}`;
        return;
      }
    }
    
    next();
  });
}