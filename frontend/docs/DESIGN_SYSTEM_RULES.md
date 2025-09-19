# Mobazha Desktop 设计系统规范

> 基于Web3电商平台的现代化设计指导原则

## 📖 目录

1. [设计哲学](#设计哲学)
2. [色彩系统](#色彩系统) 
3. [布局原则](#布局原则)
4. [组件规范](#组件规范)
5. [交互效果](#交互效果)
6. [响应式设计](#响应式设计)
7. [代码规范](#代码规范)

---

## 🎨 设计哲学

### 核心理念
- **现代科技感**：体现Web3/区块链平台的前沿科技属性
- **毛玻璃美学**：使用backdrop-filter和半透明效果营造层次感
- **渐进式现代化**：在保持功能性的基础上提升视觉体验
- **用户友好**：保证可访问性和易用性

### 设计原则
1. **一致性**：所有界面元素保持统一的视觉语言
2. **层次感**：通过z-index、透明度、阴影构建清晰的视觉层级
3. **流畅性**：使用smooth transitions和cubic-bezier缓动
4. **适应性**：设计需适配不同屏幕尺寸和设备

---

## 🎨 色彩系统

### 主色调
```scss
// 基础色彩
$primary: hsl(220, 15%, 97%);           // 现代科技感的淡蓝灰色
$secondary: hsl(220, 15%, 85%);         // 层次感更深的灰色
$text: hsl(0, 0%, 12%);                 // 深色文字
$border: hsl(220, 10%, 85%);            // 统一边框色

// Web3强调色
$emphasis1: hsl(230, 70%, 50%);         // 主要强调色（Web3蓝）
$emphasis2: hsl(230, 70%, 65%);         // 次要强调色
$focusedBorder: hsl(230, 70%, 50%);     // 焦点边框色
```

### 背景色规范
```scss
// 页面背景
background: linear-gradient(180deg, #fafbfc 0%, #f4f6f8 100%);

// 卡片/容器背景
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(8px);
border: 1px solid rgba(220, 225, 230, 0.4);

// 半透明遮罩
background: rgba(45, 55, 72, 0.15);
backdrop-filter: blur(2px);
```

### 渐变系统
```scss
// 强调色渐变
$emphasisGradient: linear-gradient(135deg, $emphasis2, $emphasis1);

// 背景装饰渐变
background: radial-gradient(circle at 30% 20%, rgba(102, 126, 234, 0.015) 0%, transparent 50%);

// 遮罩渐变
background: linear-gradient(135deg, 
  rgba(102, 126, 234, 0.1) 0%, 
  rgba(118, 75, 162, 0.05) 50%,
  transparent 100%
);
```

---

## 📐 布局原则

### 间距系统
```scss
// 标准间距
$pad: 10px;                    // 基础间距
$padSm: calc($pad / 2);        // 小间距 (5px)
$padMd: $pad * 1.5;           // 中等间距 (15px)
$padLg: $pad * 2;             // 大间距 (20px)
$padHg: $pad * 2.5;           // 特大间距 (25px)
```

### Flexbox规范
```scss
// 标准flex容器
.flex-container {
  display: flex;
  gap: 12px;                   // 使用gap代替margin
  align-items: center;
}

// 按钮组容器
.btn-strip {
  display: flex;
  gap: 12px;
  overflow: visible;
  
  & > * {
    float: none;              // 移除浮动，使用flex
  }
}
```

### 层级管理
```scss
// Z-index层级规范
$z-navigation: 1002;          // 导航栏
$z-dropdown: 1001;            // 下拉菜单
$z-overlay: 999;              // 遮罩层
$z-modal: 1000;               // 模态框
$z-header: 1;                 // 页面头部
$z-content: 2;                // 内容区域
```

---

## 🧩 组件规范

### 按钮组件
```scss
.btn {
  // 基础样式
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 8px 16px;
  font-weight: 600;
  
  // 过渡效果
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  // 悬停效果
  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 8px 24px rgba(100, 115, 135, 0.2);
    border-color: rgba(102, 126, 234, 0.3);
  }
  
  &:active {
    transform: translateY(-1px);
  }
}
```

### 卡片组件
```scss
.contentBox {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(220, 225, 230, 0.4);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(100, 115, 135, 0.1);
  
  // 悬停提升效果
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(100, 115, 135, 0.15);
  }
}
```

### 导航组件
```scss
.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-1px);
    
    &::before {
      opacity: 1;
    }
  }
}
```

### 表单组件
```scss
.form-input {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(220, 225, 230, 0.6);
  border-radius: 8px;
  padding: 8px 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
  
  &:focus {
    outline: none;
    border-color: $emphasis1;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }
}
```

---

## ⚡ 交互效果

### 动画规范
```scss
// 标准过渡时间
$transition-fast: 0.2s;
$transition-normal: 0.3s;
$transition-slow: 0.5s;

// 缓动函数
$ease-out-cubic: cubic-bezier(0.4, 0, 0.2, 1);
$ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);

// 标准过渡
transition: all $transition-normal $ease-out-cubic;
```

### 悬停效果
```scss
// 提升效果
&:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(100, 115, 135, 0.2);
}

// 渐变悬停
&:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  transform: translateX(4px);
}
```

### 状态反馈
```scss
// 激活状态
&:active {
  transform: translateY(0);
}

// 禁用状态
&:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

// 加载状态
&.loading {
  position: relative;
  pointer-events: none;
  
  &::after {
    content: '';
    position: absolute;
    /* 加载动画样式 */
  }
}
```

---

## 📱 响应式设计

### 断点系统
```scss
// 屏幕断点
$mobile: 480px;
$tablet: 768px;
$desktop: 1024px;
$large: 1500px;

// 媒体查询混入
@mixin mobile {
  @media (max-width: #{$mobile}) {
    @content;
  }
}

@mixin tablet {
  @media (max-width: #{$tablet}) {
    @content;
  }
}
```

### 响应式布局
```scss
// 响应式间距
.container {
  padding: $padLg;
  
  @include tablet {
    padding: $padMd;
  }
  
  @include mobile {
    padding: $padSm;
  }
}

// 响应式按钮
.btn {
  padding: 8px 16px;
  
  @include mobile {
    padding: 6px 12px;
    font-size: 14px;
  }
}
```

---

## 💻 代码规范

### SCSS组织结构
```
styles/
├── _variables.scss      # 变量定义
├── _mixins.scss        # 混入函数
├── _base.scss          # 基础样式
├── _theme.scss         # 主题样式
├── components/         # 组件样式
│   ├── _buttons.scss
│   ├── _cards.scss
│   └── _forms.scss
└── modules/           # 页面模块样式
    ├── _userPage.scss
    ├── _nav.scss
    └── _modal.scss
```

### 命名规范
```scss
// BEM命名方式
.component__element--modifier

// 示例
.user-card {
  &__header {
    // 头部样式
  }
  
  &__content {
    // 内容样式
  }
  
  &--featured {
    // 特色卡片修饰符
  }
}
```

### 代码格式
```scss
// 选择器格式
.selector {
  property: value;
  
  // 嵌套选择器
  &__element {
    property: value;
  }
  
  // 伪类
  &:hover {
    property: value;
  }
  
  // 修饰符
  &--modifier {
    property: value;
  }
}

// 避免过深嵌套（最多3层）
.parent {
  .child {
    .grandchild {
      // 最深层级
    }
  }
}
```

### 性能优化
```scss
// 使用transform代替position变化
// ✅ 推荐
transform: translateY(-2px);

// ❌ 避免
top: -2px;

// 使用will-change提示浏览器优化
.animated-element {
  will-change: transform, opacity;
}

// 合并重复的transition
transition: transform 0.3s ease, opacity 0.3s ease;
// 简化为
transition: all 0.3s ease;
```

---

## 🎯 实际应用示例

### 创建新页面
```scss
.newPage {
  // 统一背景
  background: linear-gradient(180deg, #fafbfc 0%, #f4f6f8 100%);
  
  // 装饰背景
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 20%, rgba(102, 126, 234, 0.015) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
  
  // 内容区域
  .content {
    position: relative;
    z-index: 1;
    background: transparent;
  }
  
  // 统一卡片样式
  .contentBox {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(220, 225, 230, 0.4);
  }
}
```

### 创建新组件
```scss
.newComponent {
  // 基础布局
  display: flex;
  gap: 12px;
  padding: $padMd;
  
  // 现代化样式
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(220, 225, 230, 0.4);
  border-radius: 12px;
  
  // 交互效果
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(100, 115, 135, 0.15);
  }
  
  // 响应式适配
  @include tablet {
    flex-direction: column;
    gap: 8px;
  }
}
```

---

## 🚀 更新指南

### 迁移现有组件
1. **背景统一**：将solid背景改为半透明+毛玻璃效果
2. **布局现代化**：使用flex+gap替代float+margin
3. **交互提升**：添加hover动画和过渡效果
4. **层级优化**：合理设置z-index和透明度

### 新组件开发
1. **遵循设计系统**：使用统一的色彩、间距、圆角
2. **考虑响应式**：确保在不同设备上的良好表现
3. **性能优先**：使用transform进行动画，避免重绘
4. **可访问性**：保证键盘导航和屏幕阅读器支持

---

## ✅ 检查清单

新页面/组件开发完成后，请检查：

- [ ] 使用了统一的背景和色彩系统
- [ ] 布局使用flex+gap，避免float
- [ ] 添加了适当的hover和交互效果
- [ ] 设置了合理的z-index层级
- [ ] 考虑了移动端响应式适配
- [ ] 代码遵循SCSS规范和命名约定
- [ ] 性能优化：使用transform进行动画
- [ ] 测试了键盘导航和可访问性

---

*此规范基于Mobazha Desktop项目的现代化改造经验总结，旨在指导团队创建一致的、现代的Web3电商平台界面。* 