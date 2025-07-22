import { createI18n } from 'vue-i18n'
import { getTranslationLangByCode } from '../backbone/data/languages'
import app from '../backbone/app'

// 自动导入所有语言包
const modules = import.meta.glob('../backbone/languages/*.json', { eager: true })

const messages = {}
for (const path in modules) {
  // 文件名如 ../backbone/languages/zh_CN.json
  const match = path.match(/([a-zA-Z_]+)\.json$/)
  if (match) {
    const locale = match[1]
    messages[locale] = modules[path].default || modules[path]
  }
}

// 使用现有的语言验证逻辑
function getValidLanguage(lang) {
  if (getTranslationLangByCode(lang)) {
    return lang
  }
  return 'en_US'
}

// 从 app.localSettings 或 localStorage 或默认值获取初始语言
const getInitialLanguage = () => {
  try {
    // 优先从 app.localSettings 获取
    if (typeof window !== 'undefined' && window.app && window.app.localSettings) {
      const lang = window.app.localSettings.get('language')
      if (lang) return getValidLanguage(lang)
    } else if (app && app.localSettings) {
      const lang = app.localSettings.get('language')
      if (lang) return getValidLanguage(lang)
    }
    // 其次从 localStorage
    const savedLang = localStorage.getItem('language')
    return getValidLanguage(savedLang || 'en_US')
  } catch {
    return 'en_US'
  }
}

const i18n = createI18n({
  legacy: false, // 使用 Composition API
  locale: getInitialLanguage(),
  fallbackLocale: 'en_US',
  messages,
})

// 导出语言列表供组件使用
export const availableLocales = Object.keys(messages)

// 语言切换函数
export function changeLanguage(locale) {
  const validLocale = getValidLanguage(locale)
  i18n.global.locale.value = validLocale
  localStorage.setItem('language', validLocale)
  
  // 同步到现有的 Polyglot 系统（如果存在）
  if (window.app && window.app.polyglot) {
    window.app.polyglot.locale(validLocale)
  }
  
  return validLocale
}

export default i18n 