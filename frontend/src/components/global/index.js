const components = {};

// 递归导入所有组件
const modules = import.meta.glob('./**/*.vue', { eager: true });

for (const path in modules) {
  // 从路径中提取组件名称，保持目录结构
  const componentName = path
    .replace(/^\.\//, '')  // 移除开头的 ./
    .replace(/\.vue$/, '') // 移除 .vue 后缀
    .split('/')            // 分割路径
    .map(part => part.charAt(0).toUpperCase() + part.slice(1)) // 首字母大写
    .join('');            // 重新组合
  
  components[componentName] = modules[path].default;
}

export default components;
