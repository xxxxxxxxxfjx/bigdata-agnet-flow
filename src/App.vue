<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/workflows', label: '工作流', icon: '⚡' },
  { path: '/lowcode', label: '大屏', icon: '📊' },
]
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-left">
        <div class="logo" @click="router.push('/')" style="cursor: pointer;">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">BigData Agent Flow</span>
        </div>
        <nav class="header-nav">
          <button
            v-for="item in navItems"
            :key="item.path"
            class="nav-btn"
            :class="{ active: route.path === item.path }"
            @click="router.push(item.path)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </nav>
      </div>
      <div class="header-center">
        <span class="project-name">大数据Agent工作流编排平台</span>
      </div>
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
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 20px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
}

.logo-icon {
  font-size: 22px;
}

.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.3px;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.nav-btn:hover {
  color: #334155;
  background: #f1f5f9;
}

.nav-btn.active {
  color: #6366f1;
  background: #eef2ff;
}

.nav-icon {
  font-size: 14px;
  line-height: 1;
}

.nav-label {
  font-size: 13px;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.project-name {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.version-badge {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 3px 10px;
  border-radius: 10px;
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Page transition */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
