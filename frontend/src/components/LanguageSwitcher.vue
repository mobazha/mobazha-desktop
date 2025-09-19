<template>
  <div class="language-switcher">
    <el-dropdown @command="handleLanguageChange">
      <el-button text class="language-btn">
        <span class="current-lang">{{ currentLanguageLabel }}</span>
        <el-icon><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item 
            v-for="lang in availableLanguages" 
            :key="lang.code"
            :command="lang.code"
            :class="{ 'is-active': currentLocale === lang.code }"
          >
            <span class="lang-flag">{{ lang.flag }}</span>
            <span class="lang-name">{{ lang.name }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDown } from '@element-plus/icons-vue'
import { changeLanguage } from '@/i18n'

const { locale } = useI18n()

// 可用语言列表
const availableLanguages = [
  { code: 'zh_CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en_US', name: 'English', flag: '🇺🇸' }
]

// 当前语言
const currentLocale = computed(() => locale.value)

// 当前语言标签
const currentLanguageLabel = computed(() => {
  const current = availableLanguages.find(lang => lang.code === currentLocale.value)
  return current ? `${current.flag} ${current.name}` : '🇺🇸 English'
})

// 处理语言切换
const handleLanguageChange = (langCode) => {
  if (langCode !== currentLocale.value) {
    changeLanguage(langCode)
  }
}
</script>

<style lang="scss" scoped>
.language-switcher {
  .language-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--el-text-color-primary);
    
    .current-lang {
      font-size: 12px;
      font-weight: 500;
    }
  }
  
  :deep(.el-dropdown-menu__item) {
    display: flex;
    align-items: center;
    gap: 8px;
    
    &.is-active {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }
    
    .lang-flag {
      font-size: 14px;
    }
    
    .lang-name {
      font-size: 12px;
    }
  }
}
</style> 