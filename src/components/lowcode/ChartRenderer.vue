<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  type: { type: String, required: true },
  config: { type: Object, default: () => ({}) },
  width: { type: Number, default: 400 },
  height: { type: Number, default: 300 },
  externalData: { type: Object, default: null }, // 外部传入的渲染数据（来自 useDataBinding）
  loading: { type: Boolean, default: false },
})

const chartContainer = ref(null)
const now = ref(new Date())
let chartInstance = null
let resizeObserver = null
let clockTimer = null

// Real-time clock for dateTime component
if (props.type === 'dateTime') {
  clockTimer = setInterval(() => { now.value = new Date() }, 1000)
}

onBeforeUnmount(() => {
  if (clockTimer) { clearInterval(clockTimer); clockTimer = null }
})

// Stable hash function for word cloud (replaces Math.random)
function hashStr(str, seed = 0) {
  let h = seed
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

// ECharts theme color palettes
const themes = {
  default: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
  dark: ['#dd6b66', '#759aa0', '#e69d87', '#8dc1a9', '#ea7e53', '#eedd78', '#73a373', '#73b9bc', '#7289ab'],
  vintage: ['#d87c7c', '#919e8b', '#d7ab82', '#6e7074', '#61a0a8', '#efa18d', '#787464', '#cc7e63', '#724e58'],
  macarons: ['#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80', '#8d98b3', '#e5cf0d', '#97b552', '#95706d'],
  shine: ['#c12e34', '#e6b600', '#0098d9', '#2b821d', '#005eaa', '#339ca8', '#cda819', '#32a487'],
}

// Merge config with external data (external data takes priority)
const effectiveConfig = computed(() => {
  const base = props.config || {}
  if (!props.externalData || typeof props.externalData !== 'object') return base
  return { ...base, ...props.externalData }
})

function getColors() {
  const theme = effectiveConfig.value?.theme || 'default'
  if (effectiveConfig.value?.colors && Array.isArray(effectiveConfig.value.colors) && effectiveConfig.value.colors.length) {
    return effectiveConfig.value.colors
  }
  return themes[theme] || themes.default
}

function parseArrayField(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    return value.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function buildBarOption() {
  const cfg = effectiveConfig.value || {}
  const xData = parseArrayField(cfg.xField)
  const yData = parseArrayField(cfg.yField).map(Number)
  const colors = getColors()

  const option = {
    title: { text: cfg.title || '', left: 'center', textStyle: { color: '#e2e8f0', fontSize: 14 } },
    tooltip: cfg.showTooltip !== false ? {} : undefined,
    legend: cfg.showLegend !== false ? { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 11 } } : undefined,
    grid: { left: '3%', right: '4%', bottom: cfg.showLegend !== false ? '12%' : '3%', top: '15%', containLabel: true },
    color: colors,
  }

  if (cfg.horizontal) {
    option.yAxis = {
      type: 'category',
      data: xData,
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    }
    option.xAxis = {
      type: 'value',
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    }
    option.series = [{
      name: cfg.seriesName || '',
      type: 'bar',
      data: yData,
      barWidth: cfg.barWidth === 'auto' ? undefined : (Number(cfg.barWidth) || undefined),
      label: cfg.showLabel ? { show: true, position: 'right', color: '#e2e8f0' } : undefined,
    }]
  } else {
    option.xAxis = {
      type: 'category',
      data: xData,
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    }
    option.yAxis = {
      type: 'value',
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    }
    option.series = [{
      name: cfg.seriesName || '',
      type: 'bar',
      data: yData,
      barWidth: cfg.barWidth === 'auto' ? undefined : (Number(cfg.barWidth) || undefined),
      label: cfg.showLabel ? { show: true, position: 'top', color: '#e2e8f0' } : undefined,
    }]
  }

  return option
}

function buildLineOption() {
  const cfg = effectiveConfig.value || {}
  const xData = parseArrayField(cfg.xField)
  const yData = parseArrayField(cfg.yField).map(Number)
  const colors = getColors()

  return {
    title: { text: cfg.title || '', left: 'center', textStyle: { color: '#e2e8f0', fontSize: 14 } },
    tooltip: cfg.showTooltip !== false ? { trigger: 'axis' } : undefined,
    legend: cfg.showLegend !== false ? { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 11 } } : undefined,
    grid: { left: '3%', right: '4%', bottom: cfg.showLegend !== false ? '12%' : '3%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: xData, boundaryGap: false, axisLabel: { color: '#94a3b8', fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 11 } },
    color: colors,
    series: [{
      name: cfg.seriesName || '',
      type: 'line',
      data: yData,
      smooth: cfg.smooth !== false,
      areaStyle: cfg.showArea ? {} : undefined,
      label: cfg.showLabel ? { show: true, color: '#e2e8f0' } : undefined,
    }],
  }
}

function buildPieOption() {
  const cfg = effectiveConfig.value || {}
  const labels = parseArrayField(cfg.dataLabels)
  const values = parseArrayField(cfg.dataValues).map(Number)
  const colors = getColors()
  const data = labels.map((name, i) => ({ name, value: values[i] || 0 }))

  return {
    title: { text: cfg.title || '', left: 'center', textStyle: { color: '#e2e8f0', fontSize: 14 } },
    tooltip: cfg.showTooltip !== false ? { trigger: 'item' } : undefined,
    legend: cfg.showLegend !== false ? { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 11 } } : undefined,
    color: colors,
    series: [{
      name: cfg.seriesName || '',
      type: 'pie',
      radius: cfg.roseType ? ['20%', cfg.radius || '60%'] : cfg.radius || '60%',
      roseType: cfg.roseType ? 'radius' : undefined,
      center: ['50%', '45%'],
      data,
      label: cfg.showLabel !== false ? { color: '#94a3b8', fontSize: 11 } : { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } },
    }],
  }
}

function buildScatterOption() {
  const cfg = effectiveConfig.value || {}
  const xData = parseArrayField(cfg.xField).map(Number)
  const yData = parseArrayField(cfg.yField).map(Number)
  const data = xData.map((x, i) => [x, yData[i] || 0])
  const colors = getColors()

  return {
    title: { text: cfg.title || '', left: 'center', textStyle: { color: '#e2e8f0', fontSize: 14 } },
    tooltip: cfg.showTooltip !== false ? {} : undefined,
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 11 } },
    color: colors,
    series: [{
      name: cfg.seriesName || '',
      type: 'scatter',
      data,
      symbolSize: cfg.symbolSize || 10,
    }],
  }
}

function buildAreaOption() {
  const cfg = effectiveConfig.value || {}
  const xData = parseArrayField(cfg.xField)
  const yData = parseArrayField(cfg.yField).map(Number)
  const colors = getColors()

  return {
    title: { text: cfg.title || '', left: 'center', textStyle: { color: '#e2e8f0', fontSize: 14 } },
    tooltip: cfg.showTooltip !== false ? { trigger: 'axis' } : undefined,
    legend: cfg.showLegend !== false ? { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 11 } } : undefined,
    grid: { left: '3%', right: '4%', bottom: '12%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: xData, boundaryGap: false, axisLabel: { color: '#94a3b8', fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 11 } },
    color: colors,
    series: [{
      name: cfg.seriesName || '',
      type: 'line',
      data: yData,
      smooth: cfg.smooth !== false,
      areaStyle: {},
    }],
  }
}

function buildRadarOption() {
  const cfg = effectiveConfig.value || {}
  const indicators = parseArrayField(cfg.indicators)
  const values = parseArrayField(cfg.dataValues).map(Number)
  const colors = getColors()

  return {
    title: { text: cfg.title || '', left: 'center', textStyle: { color: '#e2e8f0', fontSize: 14 } },
    tooltip: {},
    legend: cfg.showLegend !== false ? { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 11 } } : undefined,
    radar: {
      indicator: indicators.map((name) => ({ name, max: Math.max(...values, 100) })),
      shape: cfg.shape || 'polygon',
    },
    color: colors,
    series: [{
      name: cfg.seriesName || '',
      type: 'radar',
      data: [{ value: values, name: cfg.seriesName || '' }],
    }],
  }
}

function buildFunnelOption() {
  const cfg = effectiveConfig.value || {}
  const stages = parseArrayField(cfg.stages)
  const values = parseArrayField(cfg.values).map(Number)
  const data = stages.map((name, i) => ({ name, value: values[i] || 0 }))

  return {
    title: { text: cfg.title || '', left: 'center', textStyle: { color: '#e2e8f0', fontSize: 14 } },
    tooltip: cfg.showTooltip !== false ? { trigger: 'item' } : undefined,
    legend: cfg.showLegend !== false ? { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 11 } } : undefined,
    series: [{
      name: cfg.seriesName || '',
      type: 'funnel',
      left: '10%',
      top: 50,
      bottom: 50,
      width: '80%',
      sort: cfg.sort || 'descending',
      gap: 2,
      data,
      label: { show: true, position: 'inside', color: '#fff', fontSize: 12 },
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
    line: buildLineOption,
    pie: buildPieOption,
    scatter: buildScatterOption,
    area: buildAreaOption,
    radar: buildRadarOption,
    funnel: buildFunnelOption,
    gauge: buildGaugeOption,
  }

  const builder = builders[props.type]
  if (builder) return builder()
  return null
}

function renderChart() {
  if (!chartContainer.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value, null, {
      width: props.width,
      height: props.height,
    })
  }

  const option = buildOption()
  if (option) {
    chartInstance.setOption(option, { notMerge: true })
    chartInstance.resize({ width: props.width, height: props.height })
  }
}

watch(
  () => [effectiveConfig.value, props.width, props.height, props.externalData],
  () => {
    nextTick(renderChart)
  },
  { deep: true }
)

onMounted(() => {
  nextTick(() => {
    renderChart()

    if (chartContainer.value) {
      resizeObserver = new ResizeObserver(() => {
        if (chartInstance) {
          chartInstance.resize()
        }
      })
      resizeObserver.observe(chartContainer.value)
    }
  })
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<template>
  <div class="chart-renderer">
    <!-- Loading overlay -->
    <div v-if="loading" class="chart-loading">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- Chart container -->
    <div
      v-if="['bar','line','pie','scatter','area','radar','funnel','gauge'].includes(type)"
      ref="chartContainer"
      class="echarts-container"
      :style="{ width: width + 'px', height: height + 'px' }"
    ></div>

    <!-- Water ball (liquidFill) placeholder -->
    <div
      v-else-if="type === 'liquidFill'"
      class="liquid-fill"
      :style="{ width: width + 'px', height: height + 'px' }"
    >
      <svg viewBox="0 0 200 200" class="liquid-svg">
        <defs>
          <clipPath id="circleClip">
            <circle cx="100" cy="100" r="90" />
          </clipPath>
        </defs>
        <circle cx="100" cy="100" r="90" fill="none" :stroke="config.waveColor || '#06b6d4'" stroke-width="4" />
        <g clip-path="url(#circleClip)">
          <rect x="0" :y="200 - (200 * (config.value || 0) / 100)" width="200" :height="200 * (config.value || 0) / 100"
            :fill="config.waveColor || '#06b6d4'" opacity="0.6">
            <animate attributeName="y" :values="`${200 - (200 * (config.value || 0) / 100) - 4};${200 - (200 * (config.value || 0) / 100) + 4};${200 - (200 * (config.value || 0) / 100) - 4}`"
              dur="3s" repeatCount="indefinite" />
          </rect>
        </g>
      </svg>
      <div class="liquid-value" :style="{ color: config.waveColor || '#06b6d4' }">
        {{ config.value || 0 }}{{ config.unit || '%' }}
      </div>
      <div class="liquid-title" v-if="config.title">{{ config.title }}</div>
    </div>

    <!-- Word cloud placeholder -->
    <div
      v-else-if="type === 'wordCloud'"
      class="word-cloud"
      :style="{ width: width + 'px', height: height + 'px' }"
    >
      <div class="word-cloud-title" v-if="config.title">{{ config.title }}</div>
      <div class="word-cloud-tags">
        <span
          v-for="(word, i) in (config.words || '').split(/[,，]/).slice(0, 20)"
          :key="i"
          class="word-tag"
          :style="{
            fontSize: (12 + (hashStr(word, i * 7) % 24)) + 'px',
            opacity: 0.45 + (hashStr(word, i * 13) % 55) / 100,
            color: ['#5470c6','#91cc75','#fac858','#ee6666','#73c0de','#fc8452','#8b5cf6','#06b6d4'][hashStr(word, 42) % 8],
            transform: `rotate(${((hashStr(word, i * 3) % 40) - 20)}deg)`,
          }"
        >
          {{ word.split(':')[0] || word }}
        </span>
      </div>
    </div>

    <!-- Number counter -->
    <div
      v-else-if="type === 'numberCounter'"
      class="number-counter"
      :style="{
        width: width + 'px',
        height: height + 'px',
        background: (config.background || 'rgba(30,41,59,0.9)'),
        borderRadius: '12px',
        border: config.border || '1px solid rgba(99,102,241,0.3)',
      }"
    >
      <div class="counter-title" v-if="config.title">{{ config.title }}</div>
      <div class="counter-value" :style="{ color: config.color || '#6366f1', fontSize: (config.fontSize || 36) + 'px' }">
        {{ config.prefix || '' }}{{ (config.value || 0).toLocaleString() }}{{ config.suffix || '' }}
      </div>
    </div>

    <!-- Title text -->
    <div
      v-else-if="type === 'titleText'"
      class="title-text"
      :style="{
        width: width + 'px',
        height: height + 'px',
        color: config.color || '#ffffff',
        fontSize: (config.fontSize || 32) + 'px',
        fontWeight: config.fontWeight || 'bold',
        textAlign: config.textAlign || 'center',
        letterSpacing: (config.letterSpacing || 0) + 'px',
        textShadow: config.textShadow || 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: config.textAlign === 'left' ? 'flex-start' : config.textAlign === 'right' ? 'flex-end' : 'center',
      }"
    >
      {{ config.text || '标题文本' }}
    </div>

    <!-- Rich text -->
    <div
      v-else-if="type === 'richText'"
      class="rich-text"
      :style="{
        width: width + 'px',
        height: height + 'px',
        color: config.color || '#cbd5e1',
        fontSize: (config.fontSize || 14) + 'px',
        lineHeight: config.lineHeight || 1.8,
        padding: config.padding || '16px',
        overflow: 'auto',
      }"
    >
      {{ config.content || '' }}
    </div>

    <!-- Image -->
    <div
      v-else-if="type === 'image'"
      class="image-component"
      :style="{ width: width + 'px', height: height + 'px' }"
    >
      <img
        :src="config.src || config.fallback || 'https://placehold.co/400x300/1e293b/64748b?text=Image'"
        :alt="config.alt || ''"
        :style="{ objectFit: config.objectFit || 'cover', width: '100%', height: '100%' }"
      />
    </div>

    <!-- Video -->
    <div
      v-else-if="type === 'video'"
      class="video-component"
      :style="{ width: width + 'px', height: height + 'px', background: '#000' }"
    >
      <video
        v-if="config.src"
        :src="config.src"
        :autoplay="config.autoplay !== false"
        :loop="config.loop !== false"
        :muted="config.muted !== false"
        :controls="config.controls"
        style="width:100%;height:100%;object-fit:cover;"
      ></video>
      <div v-else class="video-placeholder">🎬 视频播放器</div>
    </div>

    <!-- Date time -->
    <div
      v-else-if="type === 'dateTime'"
      class="date-time"
      :style="{
        width: width + 'px',
        height: height + 'px',
        color: config.color || '#ffffff',
        fontSize: (config.fontSize || 28) + 'px',
        textAlign: config.textAlign || 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }"
    >
      <div v-if="config.showDate !== false" class="dt-date">{{ now.toLocaleDateString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit' }) }}</div>
      <div v-if="config.showTime !== false" class="dt-time">{{ now.toLocaleTimeString('zh-CN', { hour12: false }) }}</div>
      <div v-if="config.showWeek !== false" class="dt-week">{{ ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()] }}</div>
    </div>

    <!-- Table -->
    <div
      v-else-if="type === 'table'"
      class="data-table"
      :style="{
        width: width + 'px',
        height: height + 'px',
        fontSize: (config.fontSize || 13) + 'px',
      }"
    >
      <div class="table-title" v-if="config.title">{{ config.title }}</div>
      <table>
        <thead>
          <tr>
            <th v-for="(col, i) in (config.columns || '').split(/[,，]/).filter(Boolean)" :key="i"
              :style="{ background: config.headerBg || 'rgba(99,102,241,0.3)', color: config.textColor || '#e2e8f0' }">
              {{ col.trim() }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in (config.rows || '').split('\n').filter(Boolean)" :key="ri"
            :style="{ background: ri % 2 === 0 ? (config.rowBg || 'transparent') : (config.stripeBg || 'rgba(255,255,255,0.03)') }">
            <td v-for="(cell, ci) in row.split(/[,，]/).filter(Boolean)" :key="ci"
              :style="{ color: config.textColor || '#e2e8f0' }">
              {{ cell.trim() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Border box -->
    <div
      v-else-if="type === 'borderBox'"
      class="border-box"
      :style="{
        width: width + 'px',
        height: height + 'px',
        border: `${config.borderWidth || 2}px solid ${config.borderColor || '#6366f1'}`,
        borderRadius: '8px',
        boxShadow: config.glowIntensity === 'high' ? `0 0 20px ${config.borderColor}, inset 0 0 20px ${config.borderColor}44`
          : config.glowIntensity === 'medium' ? `0 0 10px ${config.borderColor}66`
          : config.glowIntensity === 'low' ? `0 0 5px ${config.borderColor}33`
          : 'none',
      }"
    >
      <div class="border-box-title" v-if="config.showTitle !== false && config.title"
        :style="{ color: config.borderColor || '#6366f1' }">
        {{ config.title }}
      </div>
    </div>

    <!-- Decoration -->
    <div
      v-else-if="type === 'decoration'"
      class="decoration-element"
      :style="{ width: width + 'px', height: height + 'px' }"
    >
      <svg width="100%" height="100%">
        <template v-if="config.decoType === 'corner'">
          <path :d="`M${config.size},0 L0,0 L0,${config.size}`" fill="none" :stroke="config.color" :stroke-width="config.lineWidth" />
          <path :d="`M${width - config.size},0 L${width},0 L${width},${config.size}`" fill="none" :stroke="config.color" :stroke-width="config.lineWidth" />
          <path :d="`M${config.size},${height} L0,${height} L0,${height - config.size}`" fill="none" :stroke="config.color" :stroke-width="config.lineWidth" />
          <path :d="`M${width - config.size},${height} L${width},${height} L${width},${height - config.size}`" fill="none" :stroke="config.color" :stroke-width="config.lineWidth" />
        </template>
        <template v-else-if="config.decoType === 'lines'">
          <line x1="0" :y1="height/2" :x2="width" :y2="height/2" :stroke="config.color" :stroke-width="config.lineWidth" opacity="0.3" />
          <line x1="0" :y1="height/4" :x2="width/4" :y2="height/4" :stroke="config.color" :stroke-width="config.lineWidth" opacity="0.5" />
        </template>
        <template v-else>
          <circle :cx="width/2" :cy="height/2" :r="config.size || 20" fill="none" :stroke="config.color" :stroke-width="config.lineWidth" opacity="0.3" />
        </template>
      </svg>
    </div>

    <!-- Background -->
    <div
      v-else-if="type === 'background'"
      class="bg-element"
      :style="{
        width: width + 'px',
        height: height + 'px',
        background: config.bgType === 'gradient'
          ? `linear-gradient(${config.gradientDirection || 'to bottom'}, ${config.color1 || '#0f172a'}, ${config.color2 || '#1e293b'})`
          : config.color1 || '#0f172a',
      }"
    >
      <svg v-if="config.showGrid !== false" class="bg-grid" width="100%" height="100%">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" :stroke="config.gridColor || 'rgba(99,102,241,0.06)'" stroke-width="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>

    <!-- Fallback for unknown types -->
    <div v-else class="chart-placeholder" :style="{ width: width + 'px', height: height + 'px' }">
      <span class="placeholder-icon">{{ config.icon || '📊' }}</span>
      <span class="placeholder-label">{{ config.label || type }}</span>
    </div>
  </div>
</template>

<style scoped>
.chart-renderer {
  pointer-events: none;
  user-select: none;
  width: 100%;
  height: 100%;
  position: relative;
}

/* Loading state */
.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.7);
  z-index: 5;
  gap: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(99, 102, 241, 0.3);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.echarts-container {
  pointer-events: none;
}

/* Liquid fill */
.liquid-fill {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.liquid-svg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.liquid-value {
  position: relative;
  font-size: 24px;
  font-weight: 700;
  z-index: 1;
}

.liquid-title {
  position: relative;
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
  z-index: 1;
}

/* Word cloud */
.word-cloud {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 16px;
}

.word-cloud-title {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.word-cloud-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.word-tag {
  white-space: nowrap;
  font-weight: 600;
  display: inline-block;
}

/* Number counter */
.number-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.counter-title {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.counter-value {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  font-family: 'Consolas', 'Monaco', monospace;
}

/* Date time */
.date-time {
  font-family: 'Consolas', 'Monaco', monospace;
}

.dt-date {
  font-size: 0.6em;
  opacity: 0.7;
}

.dt-time {
  font-size: 1em;
  font-weight: 700;
}

.dt-week {
  font-size: 0.5em;
  opacity: 0.6;
  margin-top: 4px;
}

/* Table */
.data-table {
  overflow: auto;
  padding: 8px;
}

.table-title {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 8px;
  text-align: center;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 6px 10px;
  text-align: left;
  border: 1px solid rgba(255,255,255,0.06);
  font-size: inherit;
}

/* Border box */
.border-box {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.border-box-title {
  position: absolute;
  top: -12px;
  left: 16px;
  font-size: 13px;
  font-weight: 600;
  padding: 2px 10px;
  background: inherit;
}

/* Placeholder */
.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(30, 41, 59, 0.6);
  border: 2px dashed rgba(255,255,255,0.1);
  border-radius: 8px;
  gap: 8px;
}

.placeholder-icon {
  font-size: 32px;
}

.placeholder-label {
  font-size: 12px;
  color: #64748b;
}

/* Video placeholder */
.video-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #64748b;
  font-size: 14px;
  background: #000;
}
</style>
