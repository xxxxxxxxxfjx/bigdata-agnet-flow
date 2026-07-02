<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const platforms = [
  {
    key: 'workflow',
    title: 'Agent 工作流编排',
    subtitle: 'Data & AI Workflow',
    mark: 'FLOW',
    color: '#2563eb',
    description: '通过可视化节点编排数据接入、SQL、Python、LLM 和 Agent 任务，构建端到端数据处理链路。',
    features: ['拖拽式流程设计', '多类型节点编排', 'JSON 导入导出'],
    route: '/workflows',
    btnLabel: '进入工作流',
  },
  {
    key: 'lowcode',
    title: '可视化大屏 / BI',
    subtitle: 'Redash / DataEase Style',
    mark: 'BI',
    color: '#0f766e',
    description: '面向业务分析和大屏展示的低代码搭建器，支持数据集、SQL 查询、组件拖拽、模板、预览和发布。',
    features: ['数据集与查询管理', '仪表板画布搭建', '多模板快速复用'],
    route: '/lowcode',
    btnLabel: '进入大屏',
  },
  {
    key: 'ai',
    title: 'AI 智能助手',
    subtitle: 'LLM Chat · DeepSeek Ready',
    mark: 'AI',
    color: '#6366f1',
    description: '基于大语言模型的智能问答界面，支持 Markdown 渲染、代码高亮、KaTeX 公式、Mermaid 图表和思维导图。Mock 模式开箱即用，后期可无缝对接 DeepSeek API。',
    features: ['代码高亮', '公式渲染', '思维导图', '图表生成'],
    route: '/ai',
    btnLabel: '进入 AI 助手',
  },
]
</script>

<template>
  <div class="dashboard">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">BigData Agent Flow</p>
        <h1>把数据流程和 BI 大屏放到同一个工作台里</h1>
        <p class="hero-desc">
          一边编排 Agent 数据处理链路，一边搭建可视化分析大屏，适合数据运营、工业监控、政务指挥和业务分析场景。
        </p>
      </div>
    </section>

    <section class="platform-grid">
      <article v-for="p in platforms" :key="p.key" class="platform-card" :style="{ '--accent': p.color }">
        <div class="card-mark">{{ p.mark }}</div>
        <div>
          <h2>{{ p.title }}</h2>
          <span>{{ p.subtitle }}</span>
        </div>
        <p>{{ p.description }}</p>
        <ul>
          <li v-for="feature in p.features" :key="feature">{{ feature }}</li>
        </ul>
        <button @click="router.push(p.route)">{{ p.btnLabel }}</button>
      </article>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  flex: 1;
  overflow-y: auto;
  background: #f3f6fb;
}

.hero {
  padding: 56px 28px 24px;
}

.hero-copy {
  max-width: 920px;
  margin: 0 auto;
}

.eyebrow {
  margin: 0 0 10px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

h1 {
  max-width: 760px;
  margin: 0;
  color: #0f172a;
  font-size: 40px;
  line-height: 1.18;
}

.hero-desc {
  max-width: 720px;
  margin: 16px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.8;
}

.platform-grid {
  max-width: 1060px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
  margin: 0 auto;
  padding: 18px 28px 48px;
}

.platform-card {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 16px;
  padding: 26px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.card-mark {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #ffffff;
  background: var(--accent);
  font-size: 13px;
  font-weight: 900;
}

.platform-card h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
}

.platform-card span {
  color: #64748b;
  font-size: 12px;
}

.platform-card p,
.platform-card ul,
.platform-card button {
  grid-column: 1 / -1;
}

.platform-card p {
  margin: 4px 0 0;
  color: #475569;
  line-height: 1.7;
}

.platform-card ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.platform-card li {
  padding: 5px 9px;
  border-radius: 999px;
  color: #334155;
  background: #f1f5f9;
  font-size: 12px;
  font-weight: 700;
}

.platform-card button {
  height: 38px;
  margin-top: 4px;
  border: 0;
  border-radius: 6px;
  color: #ffffff;
  background: var(--accent);
  cursor: pointer;
  font-weight: 800;
}

@media (max-width: 700px) {
  .platform-grid {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 30px;
  }
}
</style>
