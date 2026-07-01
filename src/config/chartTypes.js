/**
 * 可视化大屏 - 组件类型定义
 * 参考 DataEase / GoView 的组件注册模式
 *
 * 每个组件类型定义包含：
 * - 基础信息：type, label, icon, color, description
 * - defaultConfig：组件配置默认值（含业务字段 + dataSource 数据源配置）
 * - configFields：配置面板字段声明（动态表单驱动）
 * - mockData：丰富的中文演示数据，拖入即渲染
 */

export const CHART_CATEGORIES = [
  {
    label: '图表',
    key: 'chart',
    nodes: ['bar', 'line', 'pie', 'scatter', 'area', 'radar', 'funnel', 'gauge', 'wordCloud', 'liquidFill'],
  },
  {
    label: '文本与媒体',
    key: 'media',
    nodes: ['titleText', 'richText', 'image', 'video', 'numberCounter', 'dateTime', 'table'],
  },
  {
    label: '装饰边框',
    key: 'decoration',
    nodes: ['borderBox', 'decoration', 'background'],
  },
]

/**
 * 默认数据源配置（所有组件共享）
 */
const DEFAULT_DATA_SOURCE = {
  type: 'mock',         // 'mock' | 'static' | 'api'
  apiUrl: '',           // API 地址
  apiMethod: 'GET',     // 请求方法
  apiHeaders: '',       // 请求头 JSON
  apiDataPath: '',      // 响应中数据的 JSON 路径，如 'data.list'
  refreshInterval: 0,   // 自动刷新间隔（秒），0 = 不自动刷新
  lastRefreshTime: null,// 上次刷新时间戳
}

export const CHART_TYPE_CONFIG = {
  // ==================== 图表类 ====================
  bar: {
    type: 'bar',
    label: '柱状图',
    icon: '📊',
    color: '#5470c6',
    category: 'chart',
    description: '对比分类数据的数值大小',
    defaultSize: { w: 500, h: 320 },
    defaultStyle: { opacity: 1, borderRadius: 0, background: 'transparent', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      title: '城市销售额对比',
      xField: '北京,上海,广州,深圳,杭州,成都',
      yField: '182, 234, 156, 198, 145, 178',
      seriesName: '销售额(万元)',
      showLegend: true,
      showTooltip: true,
      theme: 'default',
      barWidth: 'auto',
      horizontal: false,
      showLabel: true,
      colors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#fc8452'],
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'title', label: '图表标题', type: 'text', placeholder: '输入标题' },
      { key: 'xField', label: 'X轴数据', type: 'textarea', placeholder: '用逗号分隔，如：北京,上海,广州' },
      { key: 'yField', label: 'Y轴数据', type: 'textarea', placeholder: '用逗号分隔，如：120,200,150' },
      { key: 'seriesName', label: '系列名称', type: 'text', placeholder: '如：销售额' },
      { key: 'horizontal', label: '横向柱状图', type: 'switch' },
      { key: 'showLegend', label: '显示图例', type: 'switch' },
      { key: 'showTooltip', label: '显示提示框', type: 'switch' },
      { key: 'showLabel', label: '显示数值标签', type: 'switch' },
      { key: 'barWidth', label: '柱宽', type: 'text', placeholder: 'auto 或 数字(px)' },
      { key: 'theme', label: '配色主题', type: 'select', options: ['default', 'dark', 'vintage', 'macarons', 'shine'] },
    ],
    mockData: () => ({
      title: '城市销售额对比',
      xField: '北京,上海,广州,深圳,杭州,成都',
      yField: '182, 234, 156, 198, 145, 178',
      seriesName: '销售额(万元)',
    }),
  },

  line: {
    type: 'line',
    label: '折线图',
    icon: '📈',
    color: '#91cc75',
    category: 'chart',
    description: '展示数据随时间的变化趋势',
    defaultSize: { w: 500, h: 320 },
    defaultStyle: { opacity: 1, borderRadius: 0, background: 'transparent', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      title: '月度销售趋势',
      xField: '1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月',
      yField: '120, 132, 145, 168, 182, 210, 225, 248, 260, 278, 295, 320',
      seriesName: '营收(万元)',
      smooth: true,
      showArea: true,
      showLegend: true,
      showTooltip: true,
      showLabel: false,
      theme: 'default',
      colors: ['#5470c6', '#91cc75', '#fac858'],
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'title', label: '图表标题', type: 'text', placeholder: '输入标题' },
      { key: 'xField', label: 'X轴数据', type: 'textarea', placeholder: '用逗号分隔，如：周一,周二,周三' },
      { key: 'yField', label: 'Y轴数据', type: 'textarea', placeholder: '用逗号分隔，如：120,200,150' },
      { key: 'seriesName', label: '系列名称', type: 'text' },
      { key: 'smooth', label: '平滑曲线', type: 'switch' },
      { key: 'showArea', label: '显示面积', type: 'switch' },
      { key: 'showLegend', label: '显示图例', type: 'switch' },
      { key: 'showTooltip', label: '显示提示框', type: 'switch' },
      { key: 'showLabel', label: '显示数值标签', type: 'switch' },
      { key: 'theme', label: '配色主题', type: 'select', options: ['default', 'dark', 'vintage', 'macarons', 'shine'] },
    ],
    mockData: () => ({
      title: '月度销售趋势',
      xField: '1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月',
      yField: '120, 132, 145, 168, 182, 210, 225, 248, 260, 278, 295, 320',
      seriesName: '营收(万元)',
    }),
  },

  pie: {
    type: 'pie',
    label: '饼图',
    icon: '🍩',
    color: '#fac858',
    category: 'chart',
    description: '展示各部分占整体的比例',
    defaultSize: { w: 400, h: 320 },
    defaultStyle: { opacity: 1, borderRadius: 0, background: 'transparent', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      title: '产品市场份额',
      dataLabels: '智能硬件,云服务,企业软件,技术服务,数据产品',
      dataValues: '335, 310, 234, 135, 148',
      seriesName: '市场份额',
      radius: '60%',
      roseType: false,
      showLegend: true,
      showTooltip: true,
      showLabel: true,
      theme: 'default',
      colors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#fc8452'],
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'title', label: '图表标题', type: 'text', placeholder: '输入标题' },
      { key: 'dataLabels', label: '数据标签', type: 'textarea', placeholder: '用逗号分隔，如：产品A,产品B,产品C' },
      { key: 'dataValues', label: '数据值', type: 'textarea', placeholder: '用逗号分隔，如：335,310,234' },
      { key: 'radius', label: '饼图半径', type: 'text', placeholder: '如：60%' },
      { key: 'roseType', label: '玫瑰图', type: 'switch' },
      { key: 'showLegend', label: '显示图例', type: 'switch' },
      { key: 'showTooltip', label: '显示提示框', type: 'switch' },
      { key: 'showLabel', label: '显示标签', type: 'switch' },
      { key: 'theme', label: '配色主题', type: 'select', options: ['default', 'dark', 'vintage', 'macarons', 'shine'] },
    ],
    mockData: () => ({
      title: '产品市场份额',
      dataLabels: '智能硬件,云服务,企业软件,技术服务,数据产品',
      dataValues: '335, 310, 234, 135, 148',
      seriesName: '市场份额',
    }),
  },

  scatter: {
    type: 'scatter',
    label: '散点图',
    icon: '✨',
    color: '#ee6666',
    category: 'chart',
    description: '分析两个维度数据的相关性',
    defaultSize: { w: 500, h: 320 },
    defaultStyle: { opacity: 1, borderRadius: 0, background: 'transparent', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      title: '广告投入 vs 销售额',
      xField: '12, 23, 35, 42, 55, 63, 78, 85, 92, 105, 118, 130',
      yField: '18, 35, 52, 68, 82, 95, 110, 128, 140, 158, 172, 195',
      seriesName: '广告-销售',
      symbolSize: 10,
      showLegend: true,
      showTooltip: true,
      theme: 'default',
      colors: ['#5470c6'],
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'title', label: '图表标题', type: 'text' },
      { key: 'xField', label: 'X轴数据', type: 'textarea', placeholder: '用逗号分隔' },
      { key: 'yField', label: 'Y轴数据', type: 'textarea', placeholder: '用逗号分隔' },
      { key: 'seriesName', label: '系列名称', type: 'text' },
      { key: 'symbolSize', label: '点大小', type: 'number' },
      { key: 'showLegend', label: '显示图例', type: 'switch' },
      { key: 'showTooltip', label: '显示提示框', type: 'switch' },
    ],
    mockData: () => ({
      title: '广告投入 vs 销售额',
      xField: '12, 23, 35, 42, 55, 63, 78, 85, 92, 105, 118, 130',
      yField: '18, 35, 52, 68, 82, 95, 110, 128, 140, 158, 172, 195',
      seriesName: '广告投入(万)',
    }),
  },

  area: {
    type: 'area',
    label: '面积图',
    icon: '🏔️',
    color: '#73c0de',
    category: 'chart',
    description: '强调数量随时间变化的程度',
    defaultSize: { w: 500, h: 320 },
    defaultStyle: { opacity: 1, borderRadius: 0, background: 'transparent', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      title: '季度营收增长',
      xField: 'Q1,Q2,Q3,Q4,Q1,Q2,Q3,Q4',
      yField: '280, 350, 420, 510, 560, 620, 710, 850',
      seriesName: '季度营收(万元)',
      smooth: true,
      showLegend: true,
      showTooltip: true,
      theme: 'default',
      colors: ['#5470c6', '#91cc75'],
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'title', label: '图表标题', type: 'text' },
      { key: 'xField', label: 'X轴数据', type: 'textarea', placeholder: '用逗号分隔' },
      { key: 'yField', label: 'Y轴数据', type: 'textarea', placeholder: '用逗号分隔' },
      { key: 'seriesName', label: '系列名称', type: 'text' },
      { key: 'smooth', label: '平滑曲线', type: 'switch' },
      { key: 'showLegend', label: '显示图例', type: 'switch' },
      { key: 'showTooltip', label: '显示提示框', type: 'switch' },
    ],
    mockData: () => ({
      title: '季度营收增长',
      xField: 'Q1,Q2,Q3,Q4,Q1,Q2,Q3,Q4',
      yField: '280, 350, 420, 510, 560, 620, 710, 850',
      seriesName: '季度营收(万元)',
    }),
  },

  radar: {
    type: 'radar',
    label: '雷达图',
    icon: '🕸️',
    color: '#fc8452',
    category: 'chart',
    description: '多维度的综合对比分析',
    defaultSize: { w: 400, h: 320 },
    defaultStyle: { opacity: 1, borderRadius: 0, background: 'transparent', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      title: '团队能力评估',
      indicators: '技术能力,业务理解,沟通协作,创新思维,执行力,领导力',
      dataValues: '92, 85, 78, 88, 90, 75',
      seriesName: '团队A',
      shape: 'polygon',
      showLegend: true,
      showTooltip: true,
      theme: 'default',
      colors: ['#5470c6', '#91cc75'],
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'title', label: '图表标题', type: 'text' },
      { key: 'indicators', label: '维度指标', type: 'textarea', placeholder: '用逗号分隔，如：销售,管理,技术,客服,研发' },
      { key: 'dataValues', label: '各维度数值', type: 'textarea', placeholder: '用逗号分隔，如：80,90,70,85,95' },
      { key: 'seriesName', label: '系列名称', type: 'text' },
      { key: 'shape', label: '形状', type: 'select', options: ['polygon', 'circle'] },
      { key: 'showLegend', label: '显示图例', type: 'switch' },
    ],
    mockData: () => ({
      title: '团队能力评估',
      indicators: '技术能力,业务理解,沟通协作,创新思维,执行力,领导力',
      dataValues: '92, 85, 78, 88, 90, 75',
      seriesName: '团队A',
    }),
  },

  funnel: {
    type: 'funnel',
    label: '漏斗图',
    icon: '🔽',
    color: '#3ba272',
    category: 'chart',
    description: '展示数据在各阶段的转化率',
    defaultSize: { w: 380, h: 320 },
    defaultStyle: { opacity: 1, borderRadius: 0, background: 'transparent', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      title: '营销转化漏斗',
      stages: '广告曝光,点击进入,浏览商品,加入购物车,提交订单,支付成功',
      values: '10000, 4520, 2180, 850, 520, 380',
      sort: 'descending',
      showLegend: true,
      showTooltip: true,
      theme: 'default',
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'title', label: '图表标题', type: 'text' },
      { key: 'stages', label: '阶段名称', type: 'textarea', placeholder: '用逗号分隔，如：浏览,加购,下单,支付,完成' },
      { key: 'values', label: '各阶段数值', type: 'textarea', placeholder: '用逗号分隔，如：1000,800,600,400,300' },
      { key: 'sort', label: '排序方式', type: 'select', options: ['descending', 'ascending'] },
      { key: 'showLegend', label: '显示图例', type: 'switch' },
    ],
    mockData: () => ({
      title: '营销转化漏斗',
      stages: '广告曝光,点击进入,浏览商品,加入购物车,提交订单,支付成功',
      values: '10000, 4520, 2180, 850, 520, 380',
    }),
  },

  gauge: {
    type: 'gauge',
    label: '仪表盘',
    icon: '⏱️',
    color: '#dc2626',
    category: 'chart',
    description: '展示单一指标的进度或状态',
    defaultSize: { w: 320, h: 280 },
    defaultStyle: { opacity: 1, borderRadius: 0, background: 'transparent', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      title: '年度KPI完成率',
      value: 85,
      min: 0,
      max: 100,
      unit: '%',
      seriesName: 'KPI完成率',
      theme: 'default',
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'value', label: '当前值', type: 'number' },
      { key: 'min', label: '最小值', type: 'number' },
      { key: 'max', label: '最大值', type: 'number' },
      { key: 'unit', label: '单位', type: 'text' },
      { key: 'seriesName', label: '指标名称', type: 'text' },
    ],
    mockData: () => ({
      title: '年度KPI完成率',
      value: 85,
    }),
  },

  wordCloud: {
    type: 'wordCloud',
    label: '词云图',
    icon: '☁️',
    color: '#8b5cf6',
    category: 'chart',
    description: '可视化文本数据的词频分布',
    defaultSize: { w: 500, h: 350 },
    defaultStyle: { opacity: 1, borderRadius: 0, background: 'transparent', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      title: '大数据行业热词',
      words: '人工智能:100,大数据:95,机器学习:88,云计算:82,数据挖掘:78,深度学习:75,物联网:70,区块链:65,数据中台:60,数据治理:55,实时计算:50,隐私计算:48,数据湖:45,边缘计算:42,数字孪生:40',
      shape: 'circle',
      theme: 'default',
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'words', label: '词汇与权重', type: 'textarea', placeholder: '格式：词汇:权重，用逗号分隔。如：大数据:100,AI:90,可视化:80' },
      { key: 'shape', label: '形状', type: 'select', options: ['circle', 'cardioid', 'diamond', 'triangle', 'star'] },
    ],
    mockData: () => ({
      title: '大数据行业热词',
      words: '人工智能:100,大数据:95,机器学习:88,云计算:82,数据挖掘:78,深度学习:75,物联网:70,区块链:65,数据中台:60,数据治理:55,实时计算:50,隐私计算:48,数据湖:45,边缘计算:42,数字孪生:40',
    }),
  },

  liquidFill: {
    type: 'liquidFill',
    label: '水球图',
    icon: '💧',
    color: '#06b6d4',
    category: 'chart',
    description: '用水球动画展示百分比进度',
    defaultSize: { w: 280, h: 280 },
    defaultStyle: { opacity: 1, borderRadius: 0, background: 'transparent', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      title: '项目进度',
      value: 68,
      unit: '%',
      waveColor: '#06b6d4',
      seriesName: '完成进度',
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'value', label: '百分比值', type: 'slider', min: 0, max: 100, step: 1 },
      { key: 'unit', label: '单位', type: 'text' },
      { key: 'waveColor', label: '波浪颜色', type: 'text', placeholder: '如 #06b6d4' },
      { key: 'seriesName', label: '指标名称', type: 'text' },
    ],
    mockData: () => ({
      title: '项目进度',
      value: 68,
    }),
  },

  // ==================== 文本与媒体类 ====================
  titleText: {
    type: 'titleText',
    label: '标题文本',
    icon: '📝',
    color: '#334155',
    category: 'media',
    description: '大屏主标题或副标题',
    defaultSize: { w: 500, h: 80 },
    defaultStyle: { opacity: 1, borderRadius: 0, background: 'transparent', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      text: '大数据智能可视化平台',
      fontSize: 36,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      textShadow: '0 2px 16px rgba(99,102,241,0.5)',
      letterSpacing: 4,
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'text', label: '文本内容', type: 'text', placeholder: '请输入标题文本' },
      { key: 'fontSize', label: '字体大小', type: 'number' },
      { key: 'fontWeight', label: '字体粗细', type: 'select', options: ['normal', 'bold', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
      { key: 'color', label: '字体颜色', type: 'text', placeholder: '如 #ffffff' },
      { key: 'textAlign', label: '对齐方式', type: 'select', options: ['left', 'center', 'right'] },
      { key: 'letterSpacing', label: '字间距(px)', type: 'number' },
      { key: 'textShadow', label: '文字阴影', type: 'text', placeholder: 'CSS text-shadow 值' },
    ],
    mockData: () => ({
      text: '大数据智能可视化平台',
      fontSize: 36,
    }),
  },

  richText: {
    type: 'richText',
    label: '富文本',
    icon: '📄',
    color: '#475569',
    category: 'media',
    description: '支持多格式的文本内容区',
    defaultSize: { w: 400, h: 200 },
    defaultStyle: { opacity: 1, borderRadius: 0, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'none' },
    defaultConfig: {
      content: '平台简介\n\n本平台提供一站式大数据可视化解决方案，支持拖拽式大屏搭建、实时数据接入、多源数据融合。目前已接入 12 个业务系统，累计处理数据量超过 50TB。',
      fontSize: 14,
      color: '#cbd5e1',
      lineHeight: 1.8,
      padding: '16px',
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'content', label: '文本内容', type: 'textarea', placeholder: '输入富文本内容' },
      { key: 'fontSize', label: '字体大小', type: 'number' },
      { key: 'color', label: '文字颜色', type: 'text', placeholder: '如 #cbd5e1' },
      { key: 'lineHeight', label: '行高', type: 'number' },
      { key: 'padding', label: '内边距', type: 'text', placeholder: '如 16px' },
    ],
    mockData: () => ({
      content: '平台简介\n\n本平台提供一站式大数据可视化解决方案。',
    }),
  },

  image: {
    type: 'image',
    label: '图片',
    icon: '🖼️',
    color: '#8b5cf6',
    category: 'media',
    description: '展示静态图片资源',
    defaultSize: { w: 300, h: 200 },
    defaultStyle: { opacity: 1, borderRadius: 8, background: 'transparent', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      src: '',
      alt: '图片',
      objectFit: 'cover',
      fallback: 'https://placehold.co/400x300/1e293b/64748b?text=可视化大屏',
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'src', label: '图片地址', type: 'text', placeholder: '输入图片URL' },
      { key: 'alt', label: '替代文本', type: 'text' },
      { key: 'objectFit', label: '填充方式', type: 'select', options: ['cover', 'contain', 'fill', 'none'] },
    ],
    mockData: () => ({}),
  },

  video: {
    type: 'video',
    label: '视频',
    icon: '🎬',
    color: '#ef4444',
    category: 'media',
    description: '嵌入视频播放',
    defaultSize: { w: 500, h: 320 },
    defaultStyle: { opacity: 1, borderRadius: 8, background: '#000000', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      src: '',
      autoplay: true,
      loop: true,
      muted: true,
      controls: false,
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'src', label: '视频地址', type: 'text', placeholder: '输入视频URL' },
      { key: 'autoplay', label: '自动播放', type: 'switch' },
      { key: 'loop', label: '循环播放', type: 'switch' },
      { key: 'muted', label: '静音', type: 'switch' },
      { key: 'controls', label: '显示控制条', type: 'switch' },
    ],
    mockData: () => ({}),
  },

  numberCounter: {
    type: 'numberCounter',
    label: '数字翻牌器',
    icon: '🔢',
    color: '#f59e0b',
    category: 'media',
    description: '数字动画展示关键指标',
    defaultSize: { w: 260, h: 140 },
    defaultStyle: { opacity: 1, borderRadius: 12, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' },
    defaultConfig: {
      title: '累计用户数',
      value: 1284567,
      prefix: '',
      suffix: ' 人',
      fontSize: 42,
      color: '#6366f1',
      duration: 2000,
      separator: ',',
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'value', label: '数值', type: 'number' },
      { key: 'prefix', label: '前缀', type: 'text' },
      { key: 'suffix', label: '后缀', type: 'text' },
      { key: 'fontSize', label: '数字大小', type: 'number' },
      { key: 'color', label: '数字颜色', type: 'text' },
      { key: 'duration', label: '动画时长(ms)', type: 'number' },
      { key: 'separator', label: '分隔符', type: 'text' },
    ],
    mockData: () => ({
      title: '累计用户数',
      value: 1284567,
    }),
  },

  dateTime: {
    type: 'dateTime',
    label: '日期时间',
    icon: '🕐',
    color: '#64748b',
    category: 'media',
    description: '实时显示当前日期时间',
    defaultSize: { w: 300, h: 100 },
    defaultStyle: { opacity: 1, borderRadius: 8, background: 'rgba(30,41,59,0.8)', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      showTime: true,
      showDate: true,
      showWeek: true,
      timeFormat: 'HH:mm:ss',
      dateFormat: 'YYYY年MM月DD日',
      fontSize: 28,
      color: '#ffffff',
      textAlign: 'center',
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'showTime', label: '显示时间', type: 'switch' },
      { key: 'showDate', label: '显示日期', type: 'switch' },
      { key: 'showWeek', label: '显示星期', type: 'switch' },
      { key: 'timeFormat', label: '时间格式', type: 'select', options: ['HH:mm:ss', 'HH:mm', 'hh:mm:ss A'] },
      { key: 'dateFormat', label: '日期格式', type: 'text' },
      { key: 'fontSize', label: '字体大小', type: 'number' },
      { key: 'color', label: '字体颜色', type: 'text' },
      { key: 'textAlign', label: '对齐方式', type: 'select', options: ['left', 'center', 'right'] },
    ],
    mockData: () => ({}),
  },

  table: {
    type: 'table',
    label: '数据表格',
    icon: '📋',
    color: '#3b82f6',
    category: 'media',
    description: '展示结构化数据表格',
    defaultSize: { w: 500, h: 340 },
    defaultStyle: { opacity: 1, borderRadius: 8, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'none' },
    defaultConfig: {
      title: '销售排行 Top 10',
      columns: '排名,产品名称,销售额(万),增长率,负责人',
      rows: '1,智能终端X9,1280,+28.5%,张明\n2,云平台Pro,1150,+22.1%,李华\n3,数据引擎V3,980,+18.3%,王芳\n4,安全网关S5,865,+15.8%,赵磊\n5,AI分析套件,780,+32.6%,陈静\n6,区块链BaaS,650,+45.2%,刘洋\n7,物联网平台,580,+12.3%,周敏\n8,低代码IDE,495,+55.8%,吴强\n9,数据湖DL3,420,+9.5%,郑丽\n10,消息队列MQ,380,+8.2%,钱勇',
      headerBg: 'rgba(99,102,241,0.3)',
      rowBg: 'transparent',
      stripeBg: 'rgba(255,255,255,0.03)',
      textColor: '#e2e8f0',
      fontSize: 13,
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'title', label: '表格标题', type: 'text' },
      { key: 'columns', label: '列名', type: 'textarea', placeholder: '用逗号分隔' },
      { key: 'rows', label: '数据行', type: 'textarea', placeholder: '每行用逗号分隔，行之间换行' },
      { key: 'headerBg', label: '表头背景', type: 'text' },
      { key: 'textColor', label: '文字颜色', type: 'text' },
      { key: 'fontSize', label: '字体大小', type: 'number' },
    ],
    mockData: () => ({
      title: '销售排行 Top 10',
      columns: '排名,产品名称,销售额(万),增长率,负责人',
      rows: '1,智能终端X9,1280,+28.5%,张明\n2,云平台Pro,1150,+22.1%,李华\n3,数据引擎V3,980,+18.3%,王芳\n4,安全网关S5,865,+15.8%,赵磊\n5,AI分析套件,780,+32.6%,陈静',
    }),
  },

  // ==================== 装饰边框类 ====================
  borderBox: {
    type: 'borderBox',
    label: '边框容器',
    icon: '🖼️',
    color: '#6366f1',
    category: 'decoration',
    description: '带发光边框的装饰容器',
    defaultSize: { w: 400, h: 300 },
    defaultStyle: { opacity: 1, borderRadius: 8, background: 'rgba(30,41,59,0.4)', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      borderColor: '#6366f1',
      borderWidth: 2,
      glowIntensity: 'medium',
      title: '数据总览',
      showTitle: true,
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'showTitle', label: '显示标题', type: 'switch' },
      { key: 'borderColor', label: '边框颜色', type: 'text', placeholder: '如 #6366f1' },
      { key: 'borderWidth', label: '边框宽度', type: 'number' },
      { key: 'glowIntensity', label: '发光强度', type: 'select', options: ['none', 'low', 'medium', 'high'] },
    ],
    mockData: () => ({
      title: '数据总览',
    }),
  },

  decoration: {
    type: 'decoration',
    label: '装饰元素',
    icon: '✨',
    color: '#f59e0b',
    category: 'decoration',
    description: '装饰性线条、光点等',
    defaultSize: { w: 200, h: 200 },
    defaultStyle: { opacity: 1, borderRadius: 0, background: 'transparent', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      decoType: 'corner',
      color: '#6366f1',
      size: 20,
      lineWidth: 2,
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'decoType', label: '装饰类型', type: 'select', options: ['corner', 'lines', 'dots', 'circles', 'diamond'] },
      { key: 'color', label: '颜色', type: 'text', placeholder: '如 #6366f1' },
      { key: 'size', label: '尺寸', type: 'number' },
      { key: 'lineWidth', label: '线宽', type: 'number' },
    ],
    mockData: () => ({}),
  },

  background: {
    type: 'background',
    label: '背景',
    icon: '🎨',
    color: '#0f172a',
    category: 'decoration',
    description: '全屏背景色或渐变',
    defaultSize: { w: 1920, h: 1080 },
    defaultStyle: { opacity: 1, borderRadius: 0, background: 'transparent', border: 'none', boxShadow: 'none' },
    defaultConfig: {
      bgType: 'gradient',
      color1: '#0f172a',
      color2: '#1e293b',
      gradientDirection: 'to bottom',
      showGrid: true,
      gridColor: 'rgba(99,102,241,0.06)',
      dataSource: { ...DEFAULT_DATA_SOURCE },
    },
    configFields: [
      { key: 'bgType', label: '背景类型', type: 'select', options: ['gradient', 'solid', 'image'] },
      { key: 'color1', label: '颜色1', type: 'text', placeholder: '#0f172a' },
      { key: 'color2', label: '颜色2', type: 'text', placeholder: '#1e293b' },
      { key: 'gradientDirection', label: '渐变方向', type: 'select', options: ['to bottom', 'to right', 'to bottom right', 'to top'] },
      { key: 'showGrid', label: '显示网格', type: 'switch' },
      { key: 'gridColor', label: '网格颜色', type: 'text' },
    ],
    mockData: () => ({}),
  },
}

/**
 * 根据类型获取组件配置
 */
export function getChartTypeConfig(type) {
  return CHART_TYPE_CONFIG[type] || null
}

/**
 * 获取组件的默认创建数据
 */
export function getDefaultChartData(type) {
  const config = CHART_TYPE_CONFIG[type]
  if (!config) return {}

  const mockData = config.mockData ? config.mockData() : {}

  return {
    type: config.type,
    label: config.label,
    icon: config.icon,
    color: config.color,
    description: config.description,
    size: { ...config.defaultSize },
    style: { ...config.defaultStyle },
    config: { ...config.defaultConfig, ...mockData },
  }
}
