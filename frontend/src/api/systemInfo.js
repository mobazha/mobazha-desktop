import { myGet } from './api.js';

/**
 * 获取系统信息，包括当前时间戳
 * @returns {Promise} 返回包含timestamp的Promise
 */
export function getSystemInfo() {
  return myGet('/v1/ob/systemInfo');
}

/**
 * 获取当前服务器时间戳
 * @returns {Promise<number>} 返回时间戳
 */
export async function getCurrentTimestamp() {
  const response = await getSystemInfo();
  return response.timestamp;
}
