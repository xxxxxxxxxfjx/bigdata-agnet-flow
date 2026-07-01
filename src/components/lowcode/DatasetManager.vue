<script setup>
import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'bigdata_agent_flow_datasets'

const emit = defineEmits(['close'])

const defaultDatasets = [
  {
    id: 'ds_sales_live',
    name: '销售实时明细',
    source: 'MySQL / lakehouse_sales',
    owner: 'BI Team',
    refresh: '5 min',
    status: 'healthy',
    sql: 'select date, region, category, revenue, orders, conversion_rate\nfrom dwd_sales_realtime\nwhere date >= ${start_date}\norder by revenue desc\nlimit 200',
    fields: [
      { name: 'date', type: 'date', desc: '交易日期' },
      { name: 'region', type: 'string', desc: '区域' },
      { name: 'category', type: 'string', desc: '品类' },
      { name: 'revenue', type: 'number', desc: '销售额' },
      { name: 'orders', type: 'number', desc: '订单数' },
      { name: 'conversion_rate', type: 'number', desc: '转化率' },
    ],
    preview: [
      ['2026-07-01', '华东', '智能硬件', '1,285,600', '8,942', '4.8%'],
      ['2026-07-01', '华南', '企业软件', '968,300', '6,210', '5.1%'],
      ['2026-07-01', '华北', '数据服务', '756,900', '4,882', '3.9%'],
      ['2026-07-01', '西南', '云资源', '643,500', '3,704', '4.2%'],
    ],
  },
  {
    id: 'ds_ops_quality',
    name: '生产质量指标',
    source: 'Doris / ads_factory',
    owner: 'Ops Center',
    refresh: '1 min',
    status: 'healthy',
    sql: 'select line_name, oee, yield_rate, output, alarm_count\nfrom ads_iot_line_monitor\nwhere shift_date = current_date',
    fields: [
      { name: 'line_name', type: 'string', desc: '产线名称' },
      { name: 'oee', type: 'number', desc: '设备综合效率' },
      { name: 'yield_rate', type: 'number', desc: '良品率' },
      { name: 'output', type: 'number', desc: '产量' },
      { name: 'alarm_count', type: 'number', desc: '告警数' },
    ],
    preview: [
      ['A-01', '87.6%', '98.2%', '28,560', '3'],
      ['B-03', '82.1%', '97.8%', '24,120', '7'],
      ['C-02', '91.4%', '99.1%', '31,880', '1'],
      ['D-05', '79.8%', '96.9%', '19,640', '9'],
    ],
  },
]

function loadDatasets() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return stored.length ? stored : defaultDatasets
  } catch {
    return defaultDatasets
  }
}

const datasets = ref(loadDatasets())
const activeId = ref(datasets.value[0]?.id || null)
const search = ref('')
const isRunning = ref(false)
const runMessage = ref('最近一次执行耗时 183ms，返回 4 行')

const activeDataset = computed(() => datasets.value.find((item) => item.id === activeId.value) || datasets.value[0])

const filteredDatasets = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return datasets.value
  return datasets.value.filter((item) => {
    return [item.name, item.source, item.owner, item.sql].join(' ').toLowerCase().includes(q)
  })
})

const tableColumns = computed(() => activeDataset.value?.fields?.map((field) => field.name) || [])

watch(datasets, (value) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}, { deep: true })

function createDataset() {
  const id = `ds_${Date.now()}`
  const next = {
    id,
    name: '新的数据集',
    source: 'HTTP API / demo',
    owner: '当前用户',
    refresh: 'manual',
    status: 'draft',
    sql: 'select dimension, metric\nfrom your_table\nlimit 100',
    fields: [
      { name: 'dimension', type: 'string', desc: '维度' },
      { name: 'metric', type: 'number', desc: '指标' },
    ],
    preview: [
      ['示例A', '1280'],
      ['示例B', '960'],
    ],
  }
  datasets.value = [next, ...datasets.value]
  activeId.value = id
}

function duplicateDataset() {
  if (!activeDataset.value) return
  const copy = JSON.parse(JSON.stringify(activeDataset.value))
  copy.id = `ds_${Date.now()}`
  copy.name = `${copy.name} 副本`
  copy.status = 'draft'
  datasets.value = [copy, ...datasets.value]
  activeId.value = copy.id
}

function removeDataset(id) {
  if (datasets.value.length <= 1) return
  datasets.value = datasets.value.filter((item) => item.id !== id)
  if (activeId.value === id) {
    activeId.value = datasets.value[0]?.id || null
  }
}

function updateActive(key, value) {
  const ds = activeDataset.value
  if (!ds) return
  ds[key] = value
}

function runQuery() {
  isRunning.value = true
  runMessage.value = '正在执行查询...'
  window.setTimeout(() => {
    isRunning.value = false
    const rows = activeDataset.value?.preview?.length || 0
    runMessage.value = `最近一次执行耗时 ${120 + Math.round(Math.random() * 180)}ms，返回 ${rows} 行`
    if (activeDataset.value) activeDataset.value.status = 'healthy'
  }, 520)
}
</script>

<template>
  <div class="dataset-overlay" @click.self="emit('close')">
    <section class="dataset-shell">
      <header class="dataset-header">
        <div>
          <p class="eyebrow">Data workspace</p>
          <h2>数据集与查询</h2>
        </div>
        <div class="header-actions">
          <button class="ghost-btn" @click="createDataset">新建数据集</button>
          <button class="close-btn" @click="emit('close')">关闭</button>
        </div>
      </header>

      <div class="dataset-body">
        <aside class="dataset-list">
          <div class="search-box">
            <input v-model="search" placeholder="搜索数据集、数据源或 SQL" />
          </div>
          <button
            v-for="item in filteredDatasets"
            :key="item.id"
            class="dataset-item"
            :class="{ active: item.id === activeId }"
            @click="activeId = item.id"
          >
            <span class="status-dot" :class="item.status"></span>
            <span class="item-main">
              <strong>{{ item.name }}</strong>
              <small>{{ item.source }}</small>
            </span>
            <span class="refresh">{{ item.refresh }}</span>
          </button>
        </aside>

        <main v-if="activeDataset" class="dataset-main">
          <div class="meta-grid">
            <label>
              <span>名称</span>
              <input :value="activeDataset.name" @input="updateActive('name', $event.target.value)" />
            </label>
            <label>
              <span>数据源</span>
              <input :value="activeDataset.source" @input="updateActive('source', $event.target.value)" />
            </label>
            <label>
              <span>负责人</span>
              <input :value="activeDataset.owner" @input="updateActive('owner', $event.target.value)" />
            </label>
            <label>
              <span>刷新策略</span>
              <input :value="activeDataset.refresh" @input="updateActive('refresh', $event.target.value)" />
            </label>
          </div>

          <div class="query-panel">
            <div class="panel-title">
              <span>SQL 查询</span>
              <div class="query-actions">
                <button class="ghost-btn" @click="duplicateDataset">复制</button>
                <button class="danger-btn" @click="removeDataset(activeDataset.id)">删除</button>
                <button class="primary-btn" :disabled="isRunning" @click="runQuery">
                  {{ isRunning ? '执行中' : '运行查询' }}
                </button>
              </div>
            </div>
            <textarea
              class="sql-editor"
              spellcheck="false"
              :value="activeDataset.sql"
              @input="updateActive('sql', $event.target.value)"
            />
            <div class="run-message">{{ runMessage }}</div>
          </div>

          <div class="bottom-grid">
            <section class="field-panel">
              <div class="panel-title">
                <span>字段字典</span>
                <small>{{ activeDataset.fields.length }} fields</small>
              </div>
              <div class="field-list">
                <div v-for="field in activeDataset.fields" :key="field.name" class="field-row">
                  <strong>{{ field.name }}</strong>
                  <span>{{ field.type }}</span>
                  <small>{{ field.desc }}</small>
                </div>
              </div>
            </section>

            <section class="preview-panel">
              <div class="panel-title">
                <span>结果预览</span>
                <small>可映射到图表配置</small>
              </div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th v-for="col in tableColumns" :key="col">{{ col }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, ri) in activeDataset.preview" :key="ri">
                      <td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dataset-overlay {
  position: fixed;
  inset: 0;
  z-index: 18000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(6px);
}

.dataset-shell {
  width: min(1180px, calc(100vw - 48px));
  height: min(760px, calc(100vh - 48px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.34);
}

.dataset-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid #e5edf7;
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

.dataset-header h2 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.header-actions,
.query-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

button {
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.ghost-btn {
  color: #334155;
  background: #f8fafc;
  border: 1px solid #dbe3ef;
}

.primary-btn {
  color: #ffffff;
  background: #2563eb;
  border: 1px solid #2563eb;
}

.primary-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.danger-btn {
  color: #b91c1c;
  background: #fff5f5;
  border: 1px solid #fecaca;
}

.close-btn {
  color: #475569;
  background: #ffffff;
  border: 1px solid #cbd5e1;
}

.dataset-body {
  min-height: 0;
  display: grid;
  grid-template-columns: 280px 1fr;
  flex: 1;
}

.dataset-list {
  min-height: 0;
  padding: 14px;
  overflow-y: auto;
  background: #f8fafc;
  border-right: 1px solid #e5edf7;
}

.search-box {
  margin-bottom: 10px;
}

.search-box input,
.meta-grid input {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  color: #0f172a;
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  outline: none;
}

.search-box input:focus,
.meta-grid input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.dataset-item {
  width: 100%;
  height: auto;
  display: grid;
  grid-template-columns: 8px 1fr auto;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding: 12px;
  text-align: left;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.dataset-item.active {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-dot.healthy {
  background: #16a34a;
}

.status-dot.draft {
  background: #f59e0b;
}

.item-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.item-main strong {
  overflow: hidden;
  color: #0f172a;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-main small,
.refresh {
  color: #64748b;
  font-size: 11px;
}

.dataset-main {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  overflow-y: auto;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.meta-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-grid span {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.query-panel,
.field-panel,
.preview-panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.panel-title {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #eef2f7;
}

.panel-title span {
  color: #0f172a;
  font-size: 13px;
  font-weight: 800;
}

.panel-title small {
  color: #64748b;
  font-size: 11px;
}

.sql-editor {
  width: 100%;
  height: 160px;
  display: block;
  padding: 14px;
  color: #dbeafe;
  background: #0f172a;
  border: 0;
  outline: 0;
  resize: vertical;
  font: 12px/1.65 Consolas, Monaco, monospace;
}

.run-message {
  padding: 9px 12px;
  color: #64748b;
  font-size: 12px;
  background: #f8fafc;
  border-top: 1px solid #eef2f7;
}

.bottom-grid {
  min-height: 290px;
  display: grid;
  grid-template-columns: 330px 1fr;
  gap: 14px;
}

.field-list {
  padding: 8px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 72px;
  gap: 4px 8px;
  padding: 9px 8px;
  border-bottom: 1px solid #f1f5f9;
}

.field-row strong {
  color: #0f172a;
  font-size: 12px;
}

.field-row span {
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
  text-align: right;
}

.field-row small {
  grid-column: 1 / -1;
  color: #64748b;
  font-size: 11px;
}

.table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
}

th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid #eef2f7;
  color: #334155;
  font-size: 12px;
  text-align: left;
  white-space: nowrap;
}

th {
  color: #0f172a;
  background: #f8fafc;
  font-weight: 800;
}

@media (max-width: 900px) {
  .dataset-shell {
    width: calc(100vw - 20px);
    height: calc(100vh - 20px);
  }

  .dataset-body,
  .bottom-grid,
  .meta-grid {
    grid-template-columns: 1fr;
  }

  .dataset-list {
    max-height: 210px;
    border-right: 0;
    border-bottom: 1px solid #e5edf7;
  }
}
</style>
