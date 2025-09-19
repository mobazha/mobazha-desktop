# Mobazha Desktop 前端设计规范

## 🎨 核心设计原则

### Web3现代化风格
- 使用毛玻璃效果（backdrop-filter: blur(8px)）
- 半透明背景：rgba(255, 255, 255, 0.8)
- 现代科技感的配色和渐变

### 色彩系统
```scss
// 主色调
$primary: hsl(220, 15%, 97%);           // 科技蓝灰色
$emphasis1: hsl(230, 70%, 50%);         // Web3蓝色强调

// 统一背景
background: linear-gradient(180deg, #fafbfc 0%, #f4f6f8 100%);

// 卡片/容器背景
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(8px);
border: 1px solid rgba(220, 225, 230, 0.4);
```

## 🧩 组件规范

### 按钮样式
```scss
.btn {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(100, 115, 135, 0.2);
  }
}
```

### 导航按钮
```scss
.nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &::before {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before { opacity: 1; }
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
}
```

## 📐 布局规范

### Flexbox优先
- 使用flex + gap替代float + margin
- 标准间距：gap: 12px
- 避免过度嵌套的float布局

### 响应式断点
```scss
$mobile: 480px;
$tablet: 768px;
$desktop: 1024px;
```

### 层级管理
```scss
$z-navigation: 1002;        // 导航栏
$z-dropdown: 1001;          // 下拉菜单  
$z-overlay: 999;            // 遮罩层
$z-content: 2;              // 内容区域
```

## ⚡ 交互效果

### 标准过渡
```scss
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### 悬停效果
```scss
&:hover {
  transform: translateY(-1px);        // 轻微上浮
  box-shadow: 0 4px 16px rgba(100, 115, 135, 0.15);
}
```

### 性能优化
- 使用transform代替position变化
- 优先使用cubic-bezier缓动函数
- 合理设置will-change属性

## 🚫 避免使用

1. **纯白色背景** → 改用半透明+毛玻璃效果
2. **float布局** → 改用flexbox + gap
3. **硬阴影** → 改用柔和的box-shadow
4. **突兀的颜色变化** → 使用渐变过渡
5. **position变化动画** → 使用transform

## ✅ 新建组件检查清单

- [ ] 使用了统一的半透明背景和毛玻璃效果
- [ ] 布局使用flex+gap，避免float
- [ ] 添加了hover动画和过渡效果
- [ ] 设置了合理的z-index层级
- [ ] 考虑了移动端响应式适配
- [ ] 使用transform进行动画，避免重绘

## 📱 响应式适配

### 移动端优化
```scss
@media (max-width: 768px) {
  .btn-strip { 
    flex-direction: column; 
    gap: 8px; 
  }
  
  .nav-btn { 
    width: 28px; 
    height: 28px; 
  }
}
```

### 桌面端增强
```scss
@media (min-width: 1024px) {
  .contentBox:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(100, 115, 135, 0.2);
  }
}
```

---

*此规范基于Mobazha Desktop项目的Web3现代化改造，确保界面一致性和用户体验。* 