<script setup>
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const navItems = [
  { path: '/', label: '首页', icon: '⌂' },
  { path: '/workflows', label: '工作流', icon: '⚙' },
  { path: '/lowcode', label: '大屏', icon: '▦' },
  { path: '/ai', label: 'AI 助手', icon: '✦' },
]
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-left">
        <button class="logo" @click="router.push('/')">
          <span class="logo-icon">◆</span>
          <span class="logo-text">BigData Agent Flow</span>
        </button>
        <nav class="header-nav">
          <button
            v-for="item in navItems"
            :key="item.path"
            class="nav-btn"
            :class="{ active: route.path === item.path }"
            @click="router.push(item.path)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </div>
      <div class="header-center">大数据 Agent 工作流与可视化大屏平台</div>
      <div class="header-right">
        <span class="version-badge">v0.1.0</span>
      </div>
    </header>
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 0 18px;
  background: #ffffff;
  border-bottom: 1px solid #dbe3ef;
  z-index: 100;
}

.header-left,
.header-right,
.header-nav,
.logo,
.nav-btn {
  display: flex;
  align-items: center;
}

.header-left {
  gap: 22px;
}

.logo {
  gap: 8px;
  padding: 0;
  color: #0f172a;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.logo-icon {
  color: #2563eb;
  font-size: 16px;
}

.logo-text {
  font-size: 15px;
  font-weight: 800;
}

.header-nav {
  gap: 4px;
}

.nav-btn {
  gap: 6px;
  height: 34px;
  padding: 0 13px;
  border: 0;
  border-radius: 6px;
  color: #64748b;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.nav-btn:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.nav-btn.active {
  color: #2563eb;
  background: #eff6ff;
}

.nav-icon {
  font-size: 14px;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.version-badge {
  padding: 3px 10px;
  border-radius: 999px;
  color: #64748b;
  background: #f1f5f9;
  font-size: 11px;
  font-weight: 700;
}

.app-main {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 确保 router-view 及 transition 撑满 */
.app-main > :deep(div) {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
