<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const platforms = [
  {
    key: 'workflow',
    title: '工作流编排',
    subtitle: 'Agent Workflow Orchestration',
    icon: '⚡',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
    description: '拖拽式大数据 Agent 工作流编排引擎。支持 10+ 节点类型，涵盖数据接入、SQL 处理、Python 脚本、LLM 模型调用、Agent 智能体等能力，可视化构建端到端数据处理管线。',
    features: [
      { icon: '🗄️', label: '10+ 节点类型', desc: '数据源、SQL、Python、LLM、Agent 等' },
      { icon: '🔗', label: '可视化连线', desc: '拖拽连线构建数据处理流程' },
      { icon: '💾', label: '导入/导出', desc: 'JSON 格式工作流持久化' },
    ],
    route: '/workflows',
    btnLabel: '进入工作流',
  },
  {
    key: 'lowcode',
    title: '可视化大屏',
    subtitle: 'Low-Code Big Screen Builder',
    icon: '📊',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #14b8a6 100%)',
    description: '低代码数据可视化大屏搭建平台。提供丰富的图表组件库，支持自由拖拽布局、像素级精准定位，一键预览发布，适配 4K/8K 超宽屏幕，实时数据刷新。',
    features: [
      { icon: '📈', label: '20+ 图表类型', desc: '柱状图、折线图、饼图、雷达图等' },
      { icon: '🎨', label: '自由布局', desc: '拖拽定位、像素级精准控制' },
      { icon: '👁️', label: '预览发布', desc: '全屏预览、自适应缩放' },
    ],
    route: '/lowcode',
    btnLabel: '进入大屏',
  },
]
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-content">
      <!-- Hero -->
      <div class="hero">
        <h1 class="hero-title">
          <span class="hero-highlight">BigData Agent Flow</span>
        </h1>
        <p class="hero-desc">
          大数据智能体工作流编排与可视化大屏搭建平台 — 一站式构建数据驱动的 Agent 管线与可视化展示
        </p>
      </div>

      <!-- Platform Cards -->
      <div class="platform-grid">
        <div
          v-for="p in platforms"
          :key="p.key"
          class="platform-card"
          :style="{ '--accent': p.color, '--gradient': p.gradient }"
        >
          <!-- Card Header -->
          <div class="card-header">
            <div class="card-icon-wrap">
              <span class="card-icon">{{ p.icon }}</span>
            </div>
            <div class="card-title-group">
              <h2 class="card-title">{{ p.title }}</h2>
              <span class="card-subtitle">{{ p.subtitle }}</span>
            </div>
          </div>

          <!-- Card Body -->
          <p class="card-desc">{{ p.description }}</p>

          <!-- Features -->
          <div class="card-features">
            <div
              v-for="(feat, i) in p.features"
              :key="i"
              class="feature-item"
            >
              <span class="feature-icon">{{ feat.icon }}</span>
              <div class="feature-info">
                <span class="feature-label">{{ feat.label }}</span>
                <span class="feature-desc">{{ feat.desc }}</span>
              </div>
            </div>
          </div>

          <!-- Action -->
          <button class="card-btn" @click="router.push(p.route)">
            {{ p.btnLabel }}
            <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="dashboard-footer">
        <p>Built with Vue 3 + Vue Flow + ECharts · 大数据全链路平台</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  flex: 1;
  overflow-y: auto;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
}

.dashboard-content {
  max-width: 1060px;
  margin: 0 auto;
  padding: 48px 24px 32px;
}

/* Hero */
.hero {
  text-align: center;
  margin-bottom: 48px;
}

.hero-title {
  font-size: 32px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.5px;
  margin-bottom: 12px;
}

.hero-highlight {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 15px;
  color: #64748b;
  line-height: 1.7;
  max-width: 640px;
  margin: 0 auto;
}

/* Platform Cards */
.platform-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 48px;
}

.platform-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  border: 1.5px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: all 0.25s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.platform-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient);
  border-radius: 0 0 2px 2px;
}

.platform-card:hover {
  border-color: var(--accent);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

/* Card Header */
.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.card-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--accent) 10%, white);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon {
  font-size: 28px;
  line-height: 1;
}

.card-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
}

.card-subtitle {
  font-size: 12px;
  color: #94a3b8;
  font-family: 'Consolas', 'Monaco', monospace;
}

/* Card Description */
.card-desc {
  font-size: 13.5px;
  color: #64748b;
  line-height: 1.7;
  margin: 0 0 24px 0;
}

/* Features */
.card-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
  flex: 1;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.feature-icon {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 1px;
}

.feature-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.feature-label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.feature-desc {
  font-size: 11.5px;
  color: #94a3b8;
}

/* Action Button */
.card-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  background: var(--gradient);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.card-btn:active {
  transform: scale(0.98);
}

.btn-arrow {
  font-size: 16px;
  transition: transform 0.2s;
}

.card-btn:hover .btn-arrow {
  transform: translateX(3px);
}

/* Footer */
.dashboard-footer {
  text-align: center;
}

.dashboard-footer p {
  font-size: 12px;
  color: #94a3b8;
}

/* Responsive */
@media (max-width: 800px) {
  .platform-grid {
    grid-template-columns: 1fr;
  }

  .hero-title {
    font-size: 24px;
  }
}
</style>
