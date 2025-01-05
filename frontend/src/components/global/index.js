const components = {};

// 自动导入所有组件
const modules = import.meta.glob('./*.vue', { eager: true });

for (const path in modules) {
  const componentName = path.replace(/^\.\//, '').replace(/\.vue$/, '');
  components[componentName] = modules[path].default;
}

export default components;
