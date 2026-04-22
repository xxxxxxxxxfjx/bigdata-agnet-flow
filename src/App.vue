<script setup>
import NodePanel from './components/NodePanel.vue'
import FlowCanvas from './components/FlowCanvas.vue'
import ConfigPanel from './components/ConfigPanel.vue'
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">BigData Agent Flow</span>
        </div>
      </div>
      <div class="header-center">
        <span class="project-name">大数据Agent工作流编排</span>
      </div>
      <div class="header-right">
        <button class="header-btn primary">
          ▶ 运行
        </button>
      </div>
    </header>
    <main class="app-main">
      <NodePanel />
      <FlowCanvas />
      <ConfigPanel />
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
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
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

.header-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.header-btn.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.header-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
