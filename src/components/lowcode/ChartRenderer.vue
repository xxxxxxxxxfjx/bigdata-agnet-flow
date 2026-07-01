<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  type: { type: String, required: true },
  config: { type: Object, default: () => ({}) },
  width: { type: Number, default: 400 },
  height: { type: Number, default: 300 },
  externalData: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const chartContainer = ref(null)
const now = ref(new Date())
let chartInstance = null
let resizeObserver = null
let clockTimer = null

const chartTypes = ['bar', 'line', 'pie', 'scatter', 'area', 'radar', 'funnel', 'gauge']

const themes = {
  default: ['#2563eb', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#22c55e'],
  dark: ['#60a5fa', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#22d3ee'],
  vintage: ['#d87c7c', '#919e8b', '#d7ab82', '#6e7074', '#61a0a8'],
  macarons: ['#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80'],
  shine: ['#c12e34', '#e6b600', '#0098d9', '#2b821d', '#005eaa'],
}

const effectiveConfig = computed(() => {
  const base = props.config || {}
  if (!props.externalData || typeof props.externalData !== 'object') return base
  return { ...base, ...props.externalData }
})

const words = computed(() => parseArrayField(effectiveConfig.value.words).slice(0, 24))
const tableColumns = computed(() => parseArrayField(effectiveConfig.value.columns))
const tableRows = computed(() => String(effectiveConfig.value.rows || '').split(/\n/).filter(Boolean))

if (props.type === 'dateTime') {
  clockTimer = setInterval(() => {
    now.value = new Date()
  }, 1000)
}

onBeforeUnmount(() => {
  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = null
  }
})

function parseArrayField(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    return value.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function hashStr(str, seed = 0) {
  let h = seed
  for (let i = 0; i < String(str).length; i++) {
    h = ((h << 5) - h + String(str).charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function getColors() {
  const cfg = effectiveConfig.value || {}
  if (Array.isArray(cfg.colors) && cfg.colors.length) return cfg.colors
  return themes[cfg.theme] || themes.default
}

function baseChartOption(cfg) {
  return {
    title: {
      text: cfg.title || '',
      left: 'center',
      textStyle: { color: '#e2e8f0', fontSize: 14, fontWeight: 700 },
    },
    tooltip: cfg.showTooltip !== false ? { trigger: 'axis' } : undefined,
    legend: cfg.showLegend ? { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 11 } } : undefined,
    grid: { left: 12, right: 16, bottom: cfg.showLegend ? 42 : 18, top: 48, containLabel: true },
    color: getColors(),
  }
}

function buildBarOption() {
  const cfg = effectiveConfig.value || {}
  const xData = parseArrayField(cfg.xField)
  const yData = parseArrayField(cfg.yField).map(Number)
  const option = baseChartOption(cfg)

  if (cfg.horizontal) {
    return {
      ...option,
      tooltip: cfg.showTooltip !== false ? { trigger: 'axis', axisPointer: { type: 'shadow' } } : undefined,
      yAxis: { type: 'category', data: xData, axisLabel: { color: '#94a3b8', fontSize: 11 } },
      xAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } } },
      series: [{
        name: cfg.seriesName || '',
        type: 'bar',
        data: yData,
        barWidth: cfg.barWidth === 'auto' ? undefined : (Number(cfg.barWidth) || undefined),
        label: cfg.showLabel ? { show: true, position: 'right', color: '#e2e8f0' } : undefined,
      }],
    }
  }

  return {
    ...option,
    tooltip: cfg.showTooltip !== false ? { trigger: 'axis', axisPointer: { type: 'shadow' } } : undefined,
    xAxis: { type: 'category', data: xData, axisLabel: { color: '#94a3b8', fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } } },
    series: [{
      name: cfg.seriesName || '',
      type: 'bar',
      data: yData,
      barWidth: cfg.barWidth === 'auto' ? undefined : (Number(cfg.barWidth) || undefined),
      label: cfg.showLabel ? { show: true, position: 'top', color: '#e2e8f0' } : undefined,
    }],
  }
}

function buildLineOption(area = false) {
  const cfg = effectiveConfig.value || {}
  return {
    ...baseChartOption(cfg),
    xAxis: { type: 'category', data: parseArrayField(cfg.xField), boundaryGap: false, axisLabel: { color: '#94a3b8', fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } } },
    series: [{
      name: cfg.seriesName || '',
      type: 'line',
      data: parseArrayField(cfg.yField).map(Number),
      smooth: cfg.smooth !== false,
      areaStyle: area || cfg.showArea ? { opacity: 0.18 } : undefined,
      label: cfg.showLabel ? { show: true, color: '#e2e8f0' } : undefined,
    }],
  }
}

function buildPieOption() {
  const cfg = effectiveConfig.value || {}
  const labels = parseArrayField(cfg.dataLabels)
  const values = parseArrayField(cfg.dataValues).map(Number)
  return {
    title: { text: cfg.title || '', left: 'center', textStyle: { color: '#e2e8f0', fontSize: 14 } },
    tooltip: cfg.showTooltip !== false ? { trigger: 'item' } : undefined,
    legend: cfg.showLegend ? { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 11 } } : undefined,
    color: getColors(),
    series: [{
      name: cfg.seriesName || '',
      type: 'pie',
      radius: cfg.roseType ? ['24%', cfg.radius || '62%'] : cfg.radius || '62%',
      roseType: cfg.roseType ? 'radius' : undefined,
      center: ['50%', '48%'],
      data: labels.map((name, i) => ({ name, value: values[i] || 0 })),
      label: cfg.showLabel !== false ? { color: '#cbd5e1', fontSize: 11 } : { show: false },
    }],
  }
}

function buildScatterOption() {
  const cfg = effectiveConfig.value || {}
  const xData = parseArrayField(cfg.xField).map(Number)
  const yData = parseArrayField(cfg.yField).map(Number)
  return {
    ...baseChartOption(cfg),
    xAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } } },
    series: [{
      name: cfg.seriesName || '',
      type: 'scatter',
      data: xData.map((x, i) => [x, yData[i] || 0]),
      symbolSize: Number(cfg.symbolSize) || 10,
    }],
  }
}

function buildRadarOption() {
  const cfg = effectiveConfig.value || {}
  const values = parseArrayField(cfg.dataValues).map(Number)
  return {
    title: { text: cfg.title || '', left: 'center', textStyle: { color: '#e2e8f0', fontSize: 14 } },
    tooltip: cfg.showTooltip !== false ? {} : undefined,
    color: getColors(),
    radar: {
      indicator: parseArrayField(cfg.indicators).map((name) => ({ name, max: Math.max(...values, 100) })),
      shape: cfg.shape || 'polygon',
      axisName: { color: '#cbd5e1', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.18)' } },
      splitArea: { areaStyle: { color: ['rgba(15,23,42,0.1)', 'rgba(15,23,42,0.22)'] } },
    },
    series: [{ name: cfg.seriesName || '', type: 'radar', data: [{ value: values, name: cfg.seriesName || '' }] }],
  }
}

function buildFunnelOption() {
  const cfg = effectiveConfig.value || {}
  const stages = parseArrayField(cfg.stages)
  const values = parseArrayField(cfg.values).map(Number)
  return {
    title: { text: cfg.title || '', left: 'center', textStyle: { color: '#e2e8f0', fontSize: 14 } },
    tooltip: cfg.showTooltip !== false ? { trigger: 'item' } : undefined,
    color: getColors(),
    series: [{
      name: cfg.seriesName || '',
      type: 'funnel',
      left: '10%',
      top: 48,
      bottom: 24,
      width: '80%',
      sort: cfg.sort || 'descending',
      gap: 2,
      data: stages.map((name, i) => ({ name, value: values[i] || 0 })),
      label: { show: true, position: 'inside', color: '#ffffff', fontSize: 12 },
    }],
  }
}

function buildGaugeOption() {
  const cfg = effectiveConfig.value || {}
  return {
    title: { text: cfg.title || '', left: 'center', textStyle: { color: '#e2e8f0', fontSize: 14 } },
    series: [{
      name: cfg.seriesName || '',
      type: 'gauge',
      min: cfg.min || 0,
      max: cfg.max || 100,
      progress: { show: true, width: 12 },
      axisLine: { lineStyle: { width: 12 } },
      detail: {
        valueAnimation: true,
        formatter: `{value}${cfg.unit || '%'}`,
        color: '#e2e8f0',
        fontSize: 20,
      },
      data: [{ value: Number(cfg.value) || 0 }],
    }],
  }
}

function buildOption() {
  const builders = {
    bar: buildBarOption,
    line: () => buildLineOption(false),
    area: () => buildLineOption(true),
    pie: buildPieOption,
    scatter: buildScatterOption,
    radar: buildRadarOption,
    funnel: buildFunnelOption,
    gauge: buildGaugeOption,
  }
  return builders[props.type]?.() || null
}

function renderChart() {
  if (!chartContainer.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value, null, { width: props.width, height: props.height })
  }
  const option = buildOption()
  if (option) {
    chartInstance.setOption(option, { notMerge: true })
    chartInstance.resize({ width: props.width, height: props.height })
  }
}

watch(() => [effectiveConfig.value, props.width, props.height, props.type], () => nextTick(renderChart), { deep: true })

onMounted(() => {
  nextTick(() => {
    renderChart()
    if (chartContainer.value) {
      resizeObserver = new ResizeObserver(() => chartInstance?.resize())
      resizeObserver.observe(chartContainer.value)
    }
  })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<template>
  <div class="chart-renderer">
    <div v-if="loading" class="chart-loading">
      <div class="loading-spinner"></div>
      <span>加载数据中...</span>
    </div>

    <div
      v-if="chartTypes.includes(type)"
      ref="chartContainer"
      class="echarts-container"
      :style="{ width: width + 'px', height: height + 'px' }"
    ></div>

    <div v-else-if="type === 'liquidFill'" class="liquid-fill" :style="{ width: width + 'px', height: height + 'px' }">
      <svg viewBox="0 0 200 200" class="liquid-svg">
        <defs>
          <clipPath id="circleClip"><circle cx="100" cy="100" r="88" /></clipPath>
        </defs>
        <circle cx="100" cy="100" r="88" fill="none" :stroke="effectiveConfig.waveColor || '#06b6d4'" stroke-width="4" />
        <g clip-path="url(#circleClip)">
          <rect
            x="0"
            :y="200 - (200 * (Number(effectiveConfig.value) || 0) / 100)"
            width="200"
            :height="200 * (Number(effectiveConfig.value) || 0) / 100"
            :fill="effectiveConfig.waveColor || '#06b6d4'"
            opacity="0.62"
          />
        </g>
      </svg>
      <div class="liquid-value" :style="{ color: effectiveConfig.waveColor || '#06b6d4' }">
        {{ effectiveConfig.value || 0 }}{{ effectiveConfig.unit || '%' }}
      </div>
      <div v-if="effectiveConfig.title" class="liquid-title">{{ effectiveConfig.title }}</div>
    </div>

    <div v-else-if="type === 'wordCloud'" class="word-cloud" :style="{ width: width + 'px', height: height + 'px' }">
      <div v-if="effectiveConfig.title" class="word-cloud-title">{{ effectiveConfig.title }}</div>
      <div class="word-cloud-tags">
        <span
          v-for="(word, i) in words"
          :key="`${word}-${i}`"
          class="word-tag"
          :style="{
            fontSize: (12 + (hashStr(word, i * 7) % 24)) + 'px',
            opacity: 0.5 + (hashStr(word, i * 13) % 50) / 100,
            color: getColors()[hashStr(word, 42) % getColors().length],
            transform: `rotate(${(hashStr(word, i * 3) % 28) - 14}deg)`,
          }"
        >
          {{ word.split(':')[0] || word }}
        </span>
      </div>
    </div>

    <div v-else-if="type === 'numberCounter'" class="number-counter" :style="{ width: width + 'px', height: height + 'px' }">
      <div v-if="effectiveConfig.title" class="counter-title">{{ effectiveConfig.title }}</div>
      <div class="counter-value" :style="{ color: effectiveConfig.color || '#38bdf8', fontSize: (effectiveConfig.fontSize || 36) + 'px' }">
        {{ effectiveConfig.prefix || '' }}{{ Number(effectiveConfig.value || 0).toLocaleString() }}{{ effectiveConfig.suffix || '' }}
      </div>
      <div v-if="effectiveConfig.trend" class="counter-trend">{{ effectiveConfig.trend }}</div>
    </div>

    <div
      v-else-if="type === 'titleText'"
      class="title-text"
      :style="{
        width: width + 'px',
        height: height + 'px',
        color: effectiveConfig.color || '#ffffff',
        fontSize: (effectiveConfig.fontSize || 32) + 'px',
        fontWeight: effectiveConfig.fontWeight || '700',
        textAlign: effectiveConfig.textAlign || 'center',
        letterSpacing: (effectiveConfig.letterSpacing || 0) + 'px',
        textShadow: effectiveConfig.textShadow || 'none',
        justifyContent: effectiveConfig.textAlign === 'left' ? 'flex-start' : effectiveConfig.textAlign === 'right' ? 'flex-end' : 'center',
      }"
    >
      {{ effectiveConfig.text || '标题文本' }}
    </div>

    <div
      v-else-if="type === 'richText'"
      class="rich-text"
      :style="{
        width: width + 'px',
        height: height + 'px',
        color: effectiveConfig.color || '#cbd5e1',
        fontSize: (effectiveConfig.fontSize || 14) + 'px',
        lineHeight: effectiveConfig.lineHeight || 1.8,
        padding: effectiveConfig.padding || '16px',
      }"
    >
      {{ effectiveConfig.content || '' }}
    </div>

    <div v-else-if="type === 'image'" class="image-component" :style="{ width: width + 'px', height: height + 'px' }">
      <img :src="effectiveConfig.src || effectiveConfig.fallback || 'https://placehold.co/400x300/0f172a/94a3b8?text=Image'" :alt="effectiveConfig.alt || ''" :style="{ objectFit: effectiveConfig.objectFit || 'cover' }" />
    </div>

    <div v-else-if="type === 'video'" class="video-component" :style="{ width: width + 'px', height: height + 'px' }">
      <video
        v-if="effectiveConfig.src"
        :src="effectiveConfig.src"
        :autoplay="effectiveConfig.autoplay !== false"
        :loop="effectiveConfig.loop !== false"
        :muted="effectiveConfig.muted !== false"
        :controls="effectiveConfig.controls"
      ></video>
      <div v-else class="video-placeholder">视频播放器</div>
    </div>

    <div
      v-else-if="type === 'dateTime'"
      class="date-time"
      :style="{ width: width + 'px', height: height + 'px', color: effectiveConfig.color || '#ffffff', fontSize: (effectiveConfig.fontSize || 28) + 'px' }"
    >
      <div v-if="effectiveConfig.showDate !== false" class="dt-date">{{ now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) }}</div>
      <div v-if="effectiveConfig.showTime !== false" class="dt-time">{{ now.toLocaleTimeString('zh-CN', { hour12: false }) }}</div>
      <div v-if="effectiveConfig.showWeek !== false" class="dt-week">{{ ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()] }}</div>
    </div>

    <div v-else-if="type === 'table'" class="data-table" :style="{ width: width + 'px', height: height + 'px', fontSize: (effectiveConfig.fontSize || 13) + 'px' }">
      <div v-if="effectiveConfig.title" class="table-title">{{ effectiveConfig.title }}</div>
      <table>
        <thead>
          <tr>
            <th v-for="(col, i) in tableColumns" :key="i" :style="{ background: effectiveConfig.headerBg || 'rgba(37,99,235,0.32)', color: effectiveConfig.textColor || '#e2e8f0' }">
              {{ col }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in tableRows" :key="ri" :style="{ background: ri % 2 === 0 ? (effectiveConfig.rowBg || 'transparent') : (effectiveConfig.stripeBg || 'rgba(255,255,255,0.035)') }">
            <td v-for="(cell, ci) in parseArrayField(row)" :key="ci" :style="{ color: effectiveConfig.textColor || '#e2e8f0' }">
              {{ cell }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-else-if="type === 'borderBox'"
      class="border-box"
      :style="{
        width: width + 'px',
        height: height + 'px',
        border: `${effectiveConfig.borderWidth || 2}px solid ${effectiveConfig.borderColor || '#2563eb'}`,
        boxShadow: effectiveConfig.glowIntensity === 'high' ? `0 0 22px ${effectiveConfig.borderColor}, inset 0 0 22px ${effectiveConfig.borderColor}44`
          : effectiveConfig.glowIntensity === 'medium' ? `0 0 12px ${effectiveConfig.borderColor}66`
          : effectiveConfig.glowIntensity === 'low' ? `0 0 6px ${effectiveConfig.borderColor}33`
          : 'none',
      }"
    >
      <div v-if="effectiveConfig.showTitle !== false && effectiveConfig.title" class="border-box-title" :style="{ color: effectiveConfig.borderColor || '#2563eb' }">
        {{ effectiveConfig.title }}
      </div>
    </div>

    <div v-else-if="type === 'decoration'" class="decoration-element" :style="{ width: width + 'px', height: height + 'px' }">
      <svg width="100%" height="100%">
        <template v-if="effectiveConfig.decoType === 'corner'">
          <path :d="`M${effectiveConfig.size},0 L0,0 L0,${effectiveConfig.size}`" fill="none" :stroke="effectiveConfig.color" :stroke-width="effectiveConfig.lineWidth" />
          <path :d="`M${width - effectiveConfig.size},0 L${width},0 L${width},${effectiveConfig.size}`" fill="none" :stroke="effectiveConfig.color" :stroke-width="effectiveConfig.lineWidth" />
          <path :d="`M${effectiveConfig.size},${height} L0,${height} L0,${height - effectiveConfig.size}`" fill="none" :stroke="effectiveConfig.color" :stroke-width="effectiveConfig.lineWidth" />
          <path :d="`M${width - effectiveConfig.size},${height} L${width},${height} L${width},${height - effectiveConfig.size}`" fill="none" :stroke="effectiveConfig.color" :stroke-width="effectiveConfig.lineWidth" />
        </template>
        <template v-else>
          <line x1="0" :y1="height / 2" :x2="width" :y2="height / 2" :stroke="effectiveConfig.color" :stroke-width="effectiveConfig.lineWidth" opacity="0.45" />
          <circle :cx="width / 2" :cy="height / 2" :r="effectiveConfig.size || 20" fill="none" :stroke="effectiveConfig.color" :stroke-width="effectiveConfig.lineWidth" opacity="0.25" />
        </template>
      </svg>
    </div>

    <div
      v-else-if="type === 'background'"
      class="bg-element"
      :style="{
        width: width + 'px',
        height: height + 'px',
        background: effectiveConfig.bgType === 'gradient'
          ? `linear-gradient(${effectiveConfig.gradientDirection || 'to bottom'}, ${effectiveConfig.color1 || '#0f172a'}, ${effectiveConfig.color2 || '#1e293b'})`
          : effectiveConfig.color1 || '#0f172a',
      }"
    >
      <svg v-if="effectiveConfig.showGrid !== false" class="bg-grid" width="100%" height="100%">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" :stroke="effectiveConfig.gridColor || 'rgba(56,189,248,0.07)'" stroke-width="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>

    <div v-else class="chart-placeholder" :style="{ width: width + 'px', height: height + 'px' }">
      <span>{{ type }}</span>
    </div>
  </div>
</template>

<style scoped>
.chart-renderer {
  width: 100%;
  height: 100%;
  position: relative;
  user-select: none;
  pointer-events: none;
}

.chart-loading {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 12px;
  background: rgba(15, 23, 42, 0.72);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.liquid-fill,
.word-cloud,
.number-counter,
.date-time,
.chart-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.liquid-fill,
.number-counter,
.date-time,
.word-cloud {
  flex-direction: column;
}

.liquid-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.liquid-value {
  position: relative;
  z-index: 1;
  font-size: 24px;
  font-weight: 800;
}

.liquid-title,
.counter-title,
.table-title,
.word-cloud-title {
  color: #94a3b8;
  font-size: 13px;
}

.counter-value {
  margin-top: 8px;
  font-family: Consolas, Monaco, monospace;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.counter-trend {
  margin-top: 6px;
  color: #22c55e;
  font-size: 12px;
  font-weight: 800;
}

.title-text {
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 0 12px;
}

.rich-text {
  overflow: auto;
  white-space: pre-wrap;
}

.image-component img,
.video-component video {
  width: 100%;
  height: 100%;
  display: block;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #64748b;
  background: #000000;
}

.dt-date {
  font-size: 0.58em;
  opacity: 0.72;
}

.dt-time {
  font-weight: 800;
}

.dt-week {
  margin-top: 4px;
  font-size: 0.5em;
  opacity: 0.64;
}

.word-cloud {
  overflow: hidden;
  padding: 16px;
}

.word-cloud-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.word-tag {
  display: inline-block;
  white-space: nowrap;
  font-weight: 800;
}

.data-table {
  overflow: auto;
  padding: 8px;
}

.table-title {
  margin-bottom: 8px;
  text-align: center;
  font-weight: 800;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 7px 10px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  text-align: left;
  white-space: nowrap;
}

.border-box {
  position: relative;
  border-radius: 6px;
}

.border-box-title {
  position: absolute;
  top: -12px;
  left: 16px;
  padding: 2px 10px;
  background: rgba(15, 23, 42, 0.9);
  font-size: 13px;
  font-weight: 800;
}

.chart-placeholder {
  color: #64748b;
  border: 1px dashed rgba(148, 163, 184, 0.32);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.42);
}
</style>
