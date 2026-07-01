/**
 * 预设大屏模板
 * 每个模板包含完整的 components 数组和 canvasStyle
 */

export const SCREEN_TEMPLATES = [
  {
    id: 'smart-city',
    name: '智慧城市运营中心',
    description: '城市数据监控大屏',
    thumbnail: '🏙️',
    category: '政务',
    canvasStyle: { width: 1920, height: 1080, background: 'linear-gradient(to bottom, #0a0e27, #0d1137)' },
    components: [
      { id: 'tpl_title', type: 'titleText', x: 660, y: 30, w: 600, h: 70, zIndex: 100, data: { type: 'titleText', label: '标题文本', icon: '📝', color: '#334155', config: { text: '智慧城市运营中心', fontSize: 40, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', textShadow: '0 0 30px rgba(59,130,246,0.8)', letterSpacing: 8 } } },
      { id: 'tpl_time', type: 'dateTime', x: 1620, y: 30, w: 260, h: 60, zIndex: 100, data: { type: 'dateTime', label: '日期时间', icon: '🕐', color: '#64748b', config: { showTime: true, showDate: true, showWeek: true, fontSize: 18, color: '#93c5fd', textAlign: 'right' } } },
      { id: 'tpl_users', type: 'numberCounter', x: 60, y: 140, w: 280, h: 130, zIndex: 10, data: { type: 'numberCounter', label: '数字翻牌器', icon: '🔢', color: '#f59e0b', config: { title: '城市人口 (万人)', value: 856, suffix: ' 万', fontSize: 48, color: '#3b82f6' }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } } },
      { id: 'tpl_gdp', type: 'numberCounter', x: 370, y: 140, w: 280, h: 130, zIndex: 10, data: { type: 'numberCounter', label: '数字翻牌器', icon: '🔢', color: '#f59e0b', config: { title: 'GDP总量 (亿元)', value: 12850, suffix: ' 亿', fontSize: 48, color: '#10b981' }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } } },
      { id: 'tpl_env', type: 'numberCounter', x: 680, y: 140, w: 280, h: 130, zIndex: 10, data: { type: 'numberCounter', label: '数字翻牌器', icon: '🔢', color: '#f59e0b', config: { title: '空气质量指数', value: 42, suffix: ' AQI', fontSize: 48, color: '#06b6d4' }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(6,182,212,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } } },
      { id: 'tpl_traffic', type: 'numberCounter', x: 990, y: 140, w: 280, h: 130, zIndex: 10, data: { type: 'numberCounter', label: '数字翻牌器', icon: '🔢', color: '#f59e0b', config: { title: '交通流量 (辆/时)', value: 32580, suffix: '', fontSize: 48, color: '#f59e0b' }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } } },
      { id: 'tpl_line', type: 'line', x: 60, y: 310, w: 600, h: 340, zIndex: 10, data: { type: 'line', label: '折线图', icon: '📈', color: '#91cc75', config: { title: '城市用电趋势 (万kWh)', xField: '1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月', yField: '3200,3580,4120,3850,4680,5020,5480,5300,4850,4520,4150,3880', seriesName: '用电量', smooth: true, showArea: true, showLegend: false, theme: 'default', colors: ['#3b82f6'] }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(59,130,246,0.2)' } } },
      { id: 'tpl_bar', type: 'bar', x: 690, y: 310, w: 580, h: 340, zIndex: 10, data: { type: 'bar', label: '柱状图', icon: '📊', color: '#5470c6', config: { title: '各区GDP统计 (亿元)', xField: '高新区,开发区,滨海区,中心区,高新区,开发区', yField: '2850, 1980, 1650, 3200, 2450, 2100', seriesName: 'GDP', showLegend: false, showLabel: true, theme: 'default', colors: ['#10b981'] }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(16,185,129,0.2)' } } },
      { id: 'tpl_pie', type: 'pie', x: 1300, y: 310, w: 560, h: 340, zIndex: 10, data: { type: 'pie', label: '饼图', icon: '🍩', color: '#fac858', config: { title: '产业结构占比', dataLabels: '第一产业,第二产业,第三产业,数字经济', dataValues: '8, 35, 42, 15', seriesName: '产业', radius: '55%', roseType: true, showLegend: true, theme: 'default', colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'] }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(139,92,246,0.2)' } } },
      { id: 'tpl_table', type: 'table', x: 60, y: 690, w: 700, h: 340, zIndex: 10, data: { type: 'table', label: '数据表格', icon: '📋', color: '#3b82f6', config: { title: '重点项目建设进度', columns: '序号,项目名称,投资额(亿),进度,负责人', rows: '1,地铁5号线延伸,128.5,78%,张明\n2,智慧港口二期,96.3,62%,李华\n3,高新区科技园,85.0,91%,王芳\n4,城市大脑平台,52.8,45%,赵磊\n5,海绵城市改造,38.2,55%,陈静\n6,新能源汽车充电网,24.6,33%,刘洋', headerBg: 'rgba(59,130,246,0.3)', textColor: '#e2e8f0', fontSize: 12 }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(59,130,246,0.2)' } } },
      { id: 'tpl_radar', type: 'radar', x: 790, y: 690, w: 480, h: 340, zIndex: 10, data: { type: 'radar', label: '雷达图', icon: '🕸️', color: '#fc8452', config: { title: '城市综合指标评估', indicators: '经济发展,民生保障,科技创新,生态环境,交通出行,公共安全', dataValues: '92, 85, 78, 88, 80, 90', seriesName: '本年度', shape: 'polygon', showLegend: false }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(252,132,82,0.2)' } } },
      { id: 'tpl_funnel', type: 'funnel', x: 1300, y: 690, w: 560, h: 340, zIndex: 10, data: { type: 'funnel', label: '漏斗图', icon: '🔽', color: '#3ba272', config: { title: '政务服务办理效率', stages: '在线申请,自动审批,人工复核,部门协同,办结完成', values: '12000, 9500, 7200, 4800, 4500', sort: 'descending', showLegend: false }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(59,162,114,0.2)' } } },
    ],
  },
  {
    id: 'ecommerce',
    name: '电商运营大屏',
    description: '实时销售数据监控',
    thumbnail: '🛒',
    category: '电商',
    canvasStyle: { width: 1920, height: 1080, background: 'linear-gradient(to bottom, #1a0a2e, #16213e)' },
    components: [
      { id: 'ecom_title', type: 'titleText', x: 560, y: 25, w: 800, h: 70, zIndex: 100, data: { type: 'titleText', label: '标题文本', icon: '📝', color: '#334155', config: { text: '电商平台实时运营监控', fontSize: 38, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', textShadow: '0 0 30px rgba(168,85,247,0.8)', letterSpacing: 6 } } },
      { id: 'ecom_gmv', type: 'numberCounter', x: 60, y: 140, w: 300, h: 130, zIndex: 10, data: { type: 'numberCounter', label: '数字翻牌器', icon: '🔢', color: '#f59e0b', config: { title: '今日GMV (元)', value: 12856780, prefix: '¥', suffix: '', fontSize: 42, color: '#a855f7' }, style: { borderRadius: 12, background: 'rgba(30,10,60,0.8)', border: '1px solid rgba(168,85,247,0.3)' } } },
      { id: 'ecom_orders', type: 'numberCounter', x: 390, y: 140, w: 280, h: 130, zIndex: 10, data: { type: 'numberCounter', label: '数字翻牌器', icon: '🔢', color: '#f59e0b', config: { title: '今日订单量', value: 45682, suffix: ' 单', fontSize: 42, color: '#06b6d4' }, style: { borderRadius: 12, background: 'rgba(30,10,60,0.8)', border: '1px solid rgba(6,182,212,0.3)' } } },
      { id: 'ecom_users', type: 'numberCounter', x: 700, y: 140, w: 280, h: 130, zIndex: 10, data: { type: 'numberCounter', label: '数字翻牌器', icon: '🔢', color: '#f59e0b', config: { title: '活跃用户', value: 328500, suffix: ' 人', fontSize: 42, color: '#10b981' }, style: { borderRadius: 12, background: 'rgba(30,10,60,0.8)', border: '1px solid rgba(16,185,129,0.3)' } } },
      { id: 'ecom_rate', type: 'numberCounter', x: 1010, y: 140, w: 280, h: 130, zIndex: 10, data: { type: 'numberCounter', label: '数字翻牌器', icon: '🔢', color: '#f59e0b', config: { title: '转化率', value: 3.82, prefix: '', suffix: '%', fontSize: 42, color: '#f59e0b' }, style: { borderRadius: 12, background: 'rgba(30,10,60,0.8)', border: '1px solid rgba(245,158,11,0.3)' } } },
      { id: 'ecom_line', type: 'line', x: 60, y: 310, w: 900, h: 340, zIndex: 10, data: { type: 'line', label: '折线图', icon: '📈', color: '#91cc75', config: { title: '24小时销售趋势', xField: '0时,2时,4时,6时,8时,10时,12时,14时,16时,18时,20时,22时', yField: '85, 52, 38, 65, 280, 520, 680, 590, 720, 850, 920, 680', seriesName: '销售额(万)', smooth: true, showArea: true, showLegend: false, theme: 'default', colors: ['#a855f7'] }, style: { borderRadius: 12, background: 'rgba(30,10,60,0.6)', border: '1px solid rgba(168,85,247,0.2)' } } },
      { id: 'ecom_pie', type: 'pie', x: 990, y: 310, w: 420, h: 340, zIndex: 10, data: { type: 'pie', label: '饼图', icon: '🍩', color: '#fac858', config: { title: '品类销售占比', dataLabels: '电子产品,服装鞋包,家居用品,美妆个护,食品饮料', dataValues: '35, 25, 18, 12, 10', seriesName: '品类', radius: '55%', showLegend: true, theme: 'default', colors: ['#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'] }, style: { borderRadius: 12, background: 'rgba(30,10,60,0.6)', border: '1px solid rgba(168,85,247,0.2)' } } },
      { id: 'ecom_bar', type: 'bar', x: 60, y: 690, w: 550, h: 340, zIndex: 10, data: { type: 'bar', label: '柱状图', icon: '📊', color: '#5470c6', config: { title: 'Top 商品销量排行', xField: '手机X9,笔记本Pro,耳机Air,平板Mini,手表S5,音箱Max', yField: '12580, 9850, 7650, 5420, 3890, 2650', seriesName: '销量', showLegend: false, showLabel: true, theme: 'default', colors: ['#06b6d4'] }, style: { borderRadius: 12, background: 'rgba(30,10,60,0.6)', border: '1px solid rgba(6,182,212,0.2)' } } },
      { id: 'ecom_funnel', type: 'funnel', x: 640, y: 690, w: 450, h: 340, zIndex: 10, data: { type: 'funnel', label: '漏斗图', icon: '🔽', color: '#3ba272', config: { title: '用户转化漏斗', stages: '访问店铺,浏览商品,加入购物车,提交订单,完成支付', values: '158000, 85000, 48000, 32000, 28500', sort: 'descending', showLegend: false }, style: { borderRadius: 12, background: 'rgba(30,10,60,0.6)', border: '1px solid rgba(59,162,114,0.2)' } } },
      { id: 'ecom_table', type: 'table', x: 1120, y: 690, w: 740, h: 340, zIndex: 10, data: { type: 'table', label: '数据表格', icon: '📋', color: '#3b82f6', config: { title: '实时订单流水', columns: '时间,订单号,商品,金额,状态', rows: '14:32:15,DD20240701001,手机X9,¥4,999,已支付\n14:31:48,DD20240701002,笔记本Pro,¥8,299,已支付\n14:31:22,DD20240701003,耳机Air,¥899,配送中\n14:30:55,DD20240701004,手表S5,¥2,499,已支付\n14:30:18,DD20240701005,平板Mini,¥3,299,待支付\n14:29:42,DD20240701006,音箱Max,¥1,599,已支付', headerBg: 'rgba(168,85,247,0.3)', textColor: '#e2e8f0', fontSize: 12 }, style: { borderRadius: 12, background: 'rgba(30,10,60,0.6)', border: '1px solid rgba(168,85,247,0.2)' } } },
    ],
  },
  {
    id: 'industrial',
    name: '工业物联网监控',
    description: '生产线实时监控大屏',
    thumbnail: '🏭',
    category: '工业',
    canvasStyle: { width: 1920, height: 1080, background: 'linear-gradient(to bottom, #0f172a, #1a2a1a)' },
    components: [
      { id: 'ind_title', type: 'titleText', x: 610, y: 25, w: 700, h: 70, zIndex: 100, data: { type: 'titleText', label: '标题文本', icon: '📝', color: '#334155', config: { text: '智能制造产线监控平台', fontSize: 38, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', textShadow: '0 0 30px rgba(16,185,129,0.8)', letterSpacing: 6 } } },
      { id: 'ind_oee', type: 'gauge', x: 60, y: 130, w: 280, h: 240, zIndex: 10, data: { type: 'gauge', label: '仪表盘', icon: '⏱️', color: '#dc2626', config: { title: '设备OEE', value: 87, min: 0, max: 100, unit: '%', seriesName: 'OEE' }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(16,185,129,0.2)' } } },
      { id: 'ind_output', type: 'numberCounter', x: 370, y: 140, w: 280, h: 130, zIndex: 10, data: { type: 'numberCounter', label: '数字翻牌器', icon: '🔢', color: '#f59e0b', config: { title: '今日产量 (件)', value: 28560, suffix: ' 件', fontSize: 42, color: '#10b981' }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(16,185,129,0.3)' } } },
      { id: 'ind_rate', type: 'numberCounter', x: 680, y: 140, w: 280, h: 130, zIndex: 10, data: { type: 'numberCounter', label: '数字翻牌器', icon: '🔢', color: '#f59e0b', config: { title: '良品率', value: 98.5, suffix: '%', fontSize: 42, color: '#3b82f6' }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(59,130,246,0.3)' } } },
      { id: 'ind_temp', type: 'liquidFill', x: 990, y: 130, w: 220, h: 220, zIndex: 10, data: { type: 'liquidFill', label: '水球图', icon: '💧', color: '#06b6d4', config: { title: '设备温度', value: 42, unit: '°C', waveColor: '#f59e0b' }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(245,158,11,0.2)' } } },
      { id: 'ind_line', type: 'line', x: 60, y: 400, w: 900, h: 310, zIndex: 10, data: { type: 'line', label: '折线图', icon: '📈', color: '#91cc75', config: { title: '产线实时产量趋势', xField: '6:00,7:00,8:00,9:00,10:00,11:00,12:00,13:00,14:00', yField: '1200,1350,1420,1380,1500,1480,1520,1550,1600', seriesName: '产量(件/时)', smooth: true, showArea: true, showLegend: false, theme: 'default', colors: ['#10b981'] }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(16,185,129,0.2)' } } },
      { id: 'ind_bar', type: 'bar', x: 990, y: 400, w: 470, h: 310, zIndex: 10, data: { type: 'bar', label: '柱状图', icon: '📊', color: '#5470c6', config: { title: '各产线产量对比', xField: '产线A,产线B,产线C,产线D,产线E', yField: '5200, 4850, 4600, 3980, 3500', seriesName: '产量', showLegend: false, showLabel: true }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(59,130,246,0.2)' } } },
      { id: 'ind_table', type: 'table', x: 60, y: 740, w: 900, h: 300, zIndex: 10, data: { type: 'table', label: '数据表格', icon: '📋', color: '#3b82f6', config: { title: '设备运行状态', columns: '设备编号,设备名称,运行状态,运行时长(h),温度(°C),下次维护', rows: 'EQ-001,数控机床A,运行中,128,42,2024-08-15\nEQ-002,注塑机B,运行中,96,38,2024-09-01\nEQ-003,装配机器人C,待机,64,35,2024-08-20\nEQ-004,检测设备D,运行中,152,45,2024-08-10\nEQ-005,包装机E,维护中,0,28,2024-08-05', headerBg: 'rgba(16,185,129,0.3)', textColor: '#e2e8f0', fontSize: 12 }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(16,185,129,0.2)' } } },
      { id: 'ind_radar', type: 'radar', x: 990, y: 740, w: 470, h: 300, zIndex: 10, data: { type: 'radar', label: '雷达图', icon: '🕸️', color: '#fc8452', config: { title: '质量检测指标', indicators: '尺寸精度,表面光洁度,硬度,韧性,耐腐蚀,装配精度', dataValues: '95, 88, 92, 85, 90, 93', seriesName: '批次检测', shape: 'polygon', showLegend: false }, style: { borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(252,132,82,0.2)' } } },
    ],
  },
]

export function getTemplateById(id) {
  return SCREEN_TEMPLATES.find((t) => t.id === id) || null
}
