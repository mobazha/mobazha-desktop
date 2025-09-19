import app from '../../backbone/app';

/**
 * 安全地获取当前用户的profile ID
 * @returns {string} 用户profile ID，如果未初始化则返回空字符串
 */
export function getCurrentProfileId() {
  if (!app.profile || !app.profile.id) {
    return '';
  }
  return app.profile.id;
}

/**
 * 安全地获取当前用户的profile对象
 * @returns {Object|null} 用户profile对象，如果未初始化则返回null
 */
export function getCurrentProfile() {
  if (!app.profile) {
    return null;
  }
  return app.profile;
}

/**
 * 检查用户是否已登录且有有效的profile
 * @returns {boolean} 是否已登录
 */
export function isUserLoggedIn() {
  return !!(app.profile && app.profile.id);
}

/**
 * 获取用户显示名称
 * @returns {string} 用户显示名称
 */
export function getCurrentUserName() {
  if (!app.profile) {
    return '';
  }
  return app.profile.get('name') || app.profile.get('handle') || '';
} 