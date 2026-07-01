<script setup>
import { ref } from 'vue'
import { useCanvas } from '../../composables/useCanvas.js'

const emit = defineEmits(['close'])
const { components, canvasStyle, exportCanvas } = useCanvas()

const activeTab = ref('html')
const deployDocsExpanded = ref(false)

/**
 * 生成独立的 HTML 发布文件
 */
function generateStandaloneHTML() {
  const canvasData = JSON.parse(exportCanvas())
  const componentsJSON = JSON.stringify(canvasData.components, null, 2)
  const canvasStyleJSON = JSON.stringify(canvasData.canvasStyle, null, 2)

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>可视化大屏</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#000;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif}
#screen{position:relative;overflow:hidden;transform-origin:left top}
.screen-component{position:absolute;overflow:hidden;pointer-events:none}
.echarts-container{width:100%;height:100%}
/* Liquid fill */
.liquid-fill{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center}
.liquid-svg{width:100%;height:100%;position:absolute;top:0;left:0}
.liquid-value{position:relative;font-size:24px;font-weight:700;z-index:1}
.liquid-title{position:relative;font-size:12px;color:#94a3b8;margin-top:4px;z-index:1}
/* Word cloud */
.word-cloud{display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:16px}
.word-cloud-title{font-size:14px;color:#94a3b8;margin-bottom:12px}
.word-cloud-tags{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px}
.word-tag{white-space:nowrap;font-weight:600;display:inline-block}
/* Number counter */ .number-counter{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px}
.counter-title{font-size:13px;color:#94a3b8;margin-bottom:8px}
.counter-value{font-weight:800;font-variant-numeric:tabular-nums;font-family:Consolas,Monaco,monospace}
/* Date time */ .date-time{font-family:Consolas,Monaco,monospace;display:flex;flex-direction:column;align-items:center;justify-content:center}
.dt-date{font-size:.6em;opacity:.7} .dt-time{font-size:1em;font-weight:700} .dt-week{font-size:.5em;opacity:.6;margin-top:4px}
/* Title text */ .title-text{display:flex;align-items:center}
/* Rich text */ .rich-text{overflow:auto}
/* Table */ .data-table{overflow:auto;padding:8px} .data-table table{width:100%;border-collapse:collapse} .data-table th,.data-table td{padding:6px 10px;text-align:left;border:1px solid rgba(255,255,255,.06)}
.table-title{font-size:14px;font-weight:600;color:#e2e8f0;margin-bottom:8px;text-align:center}
/* Border box */ .border-box{position:relative;display:flex;align-items:flex-start;justify-content:center}
.border-box-title{position:absolute;top:-12px;left:16px;font-size:13px;font-weight:600;padding:2px 10px}
/* Decoration */ .decoration-element svg{display:block}
</style>
</head>
<body>
<div id="screen"></div>
<script>
(function(){
  var CANVAS = ${canvasStyleJSON};
  var COMPONENTS = ${componentsJSON};

  var screen = document.getElementById('screen');
  screen.style.width = CANVAS.width + 'px';
  screen.style.height = CANVAS.height + 'px';
  // Background
  if (CANVAS.background && CANVAS.background.startsWith('linear-gradient')) {
    screen.style.background = CANVAS.background;
  } else if (CANVAS.background && CANVAS.background.startsWith('#')) {
    screen.style.background = CANVAS.background;
  } else {
    screen.style.background = '#0f172a';
  }

  // Scale to fit
  function resize() {
    var scaleX = window.innerWidth / CANVAS.width;
    var scaleY = window.innerHeight / CANVAS.height;
    var scale = Math.min(scaleX, scaleY);
    screen.style.transform = 'scale(' + scale + ')';
    // Center
    var left = (window.innerWidth - CANVAS.width * scale) / 2;
    var top = (window.innerHeight - CANVAS.height * scale) / 2;
    screen.style.marginLeft = left + 'px';
    screen.style.marginTop = top + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  // ECharts themes
  var themes = {
    default: ['#5470c6','#91cc75','#fac858','#ee6666','#73c0de','#3ba272','#fc8452','#9a60b4','#ea7ccc'],
    dark: ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab'],
    vintage: ['#d87c7c','#919e8b','#d7ab82','#6e7074','#61a0a8','#efa18d','#787464','#cc7e63','#724e58'],
    macarons: ['#2ec7c9','#b6a2de','#5ab1ef','#ffb980','#d87a80','#8d98b3','#e5cf0d','#97b552','#95706d'],
    shine: ['#c12e34','#e6b600','#0098d9','#2b821d','#005eaa','#339ca8','#cda819','#32a487']
  };

  function getColors(cfg) {
    if (cfg.colors && Array.isArray(cfg.colors) && cfg.colors.length) return cfg.colors;
    return themes[cfg.theme] || themes.default;
  }

  function parseArray(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return v.split(/[,，]/).map(function(s){return s.trim()}).filter(Boolean);
    return [];
  }

  var chartTypes = ['bar','line','pie','scatter','area','radar','funnel','gauge'];

  COMPONENTS.sort(function(a,b){return (a.zIndex||0)-(b.zIndex||0)}).forEach(function(comp){
    var cfg = comp.data.config || {};
    var style = comp.data.style || {};
    var div = document.createElement('div');
    div.className = 'screen-component';
    div.style.cssText = 'left:'+comp.x+'px;top:'+comp.y+'px;width:'+comp.w+'px;height:'+comp.h+'px;zIndex:'+(comp.zIndex||1)+';opacity:'+(style.opacity!=null?style.opacity:1)+';border-radius:'+(style.borderRadius||0)+'px;box-shadow:'+(style.boxShadow||'none')+';background:'+(style.background||'transparent')+';border:'+(style.border||'none');

    var type = comp.type;

    if (chartTypes.indexOf(type) >= 0) {
      // ECharts
      var ecDiv = document.createElement('div');
      ecDiv.style.width = comp.w + 'px';
      ecDiv.style.height = comp.h + 'px';
      div.appendChild(ecDiv);
      screen.appendChild(div);

      var chart = echarts.init(ecDiv);
      var option = buildChartOption(type, cfg);
      if (option) { chart.setOption(option); }
      // ResizeObserver
      if (window.ResizeObserver) {
        new ResizeObserver(function(){chart.resize()}).observe(ecDiv);
      }
    } else if (type === 'titleText') {
      div.style.cssText += 'color:'+(cfg.color||'#fff')+';font-size:'+(cfg.fontSize||32)+'px;font-weight:'+(cfg.fontWeight||'bold')+';text-align:'+(cfg.textAlign||'center')+';letter-spacing:'+(cfg.letterSpacing||0)+'px;text-shadow:'+(cfg.textShadow||'none')+';display:flex;align-items:center;justify-content:'+(cfg.textAlign==='left'?'flex-start':cfg.textAlign==='right'?'flex-end':'center');
      div.textContent = cfg.text || '标题';
      screen.appendChild(div);
    } else if (type === 'numberCounter') {
      div.className += ' number-counter';
      var bg = style.background || 'rgba(30,41,59,0.9)';
      div.style.background = bg;
      div.style.borderRadius = (style.borderRadius||12) + 'px';
      div.style.border = style.border || '1px solid rgba(99,102,241,0.3)';
      div.innerHTML = '<div class="counter-title">'+(cfg.title||'')+'</div><div class="counter-value" style="color:'+(cfg.color||'#6366f1')+';font-size:'+(cfg.fontSize||36)+'px">'+(cfg.prefix||'')+Number(cfg.value||0).toLocaleString()+(cfg.suffix||'')+'</div>';
      screen.appendChild(div);
    } else if (type === 'dateTime') {
      div.className += ' date-time';
      div.style.color = cfg.color || '#fff';
      div.style.fontSize = (cfg.fontSize||28) + 'px';
      var now = new Date();
      div.innerHTML = (cfg.showDate!==false?'<div class="dt-date">'+now.toLocaleDateString('zh-CN')+'</div>':'')+(cfg.showTime!==false?'<div class="dt-time">'+now.toLocaleTimeString('zh-CN',{hour12:false})+'</div>':'')+(cfg.showWeek!==false?'<div class="dt-week">'+['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()]+'</div>':'');
      screen.appendChild(div);
    } else if (type === 'richText') {
      div.className += ' rich-text';
      div.style.color = cfg.color || '#cbd5e1';
      div.style.fontSize = (cfg.fontSize||14) + 'px';
      div.style.lineHeight = cfg.lineHeight || 1.8;
      div.style.padding = cfg.padding || '16px';
      div.textContent = cfg.content || '';
      screen.appendChild(div);
    } else if (type === 'table') {
      div.className += ' data-table';
      var cols = (cfg.columns||'').split(/[,，]/).filter(Boolean);
      var rows = (cfg.rows||'').split('\\n').filter(Boolean);
      var html = '<div class="table-title">'+(cfg.title||'')+'</div><table><thead><tr>';
      cols.forEach(function(c){html+='<th style="background:'+(cfg.headerBg||'rgba(99,102,241,0.3)')+';color:'+(cfg.textColor||'#e2e8f0')+';font-size:'+(cfg.fontSize||13)+'px">'+c.trim()+'</th>'});
      html += '</tr></thead><tbody>';
      rows.forEach(function(r,ri){
        html += '<tr style="background:'+(ri%2===0?(cfg.rowBg||'transparent'):(cfg.stripeBg||'rgba(255,255,255,0.03)'))+'">';
        r.split(/[,，]/).filter(Boolean).forEach(function(cell){html+='<td style="color:'+(cfg.textColor||'#e2e8f0')+';font-size:'+(cfg.fontSize||13)+'px">'+cell.trim()+'</td>'});
        html += '</tr>';
      });
      html += '</tbody></table>';
      div.innerHTML = html;
      screen.appendChild(div);
    } else {
      // Fallback placeholder
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'center';
      div.style.background = 'rgba(30,41,59,0.6)';
      div.style.border = '2px dashed rgba(255,255,255,0.1)';
      div.style.borderRadius = '8px';
      div.innerHTML = '<span style="font-size:28px;opacity:0.4">'+(cfg.icon||'📊')+'</span>';
      screen.appendChild(div);
    }
  });

  function buildChartOption(type, cfg) {
    var colors = getColors(cfg);
    var common = {
      title: { text: cfg.title||'', left:'center', textStyle:{color:'#e2e8f0',fontSize:14} },
      tooltip: cfg.showTooltip!==false ? {} : undefined,
      legend: cfg.showLegend!==false ? {bottom:0,textStyle:{color:'#94a3b8',fontSize:11}} : undefined,
      grid: {left:'3%',right:'4%',bottom:cfg.showLegend!==false?'12%':'3%',top:'15%',containLabel:true},
      color: colors
    };

    if (type === 'bar') {
      var x=parseArray(cfg.xField),y=parseArray(cfg.yField).map(Number);
      if (cfg.horizontal) {
        return Object.assign({},common,{yAxis:{type:'category',data:x,axisLabel:{color:'#94a3b8',fontSize:11}},xAxis:{type:'value',axisLabel:{color:'#94a3b8',fontSize:11}},series:[{name:cfg.seriesName||'',type:'bar',data:y,label:cfg.showLabel?{show:true,position:'right',color:'#e2e8f0'}:undefined}]});
      } else {
        return Object.assign({},common,{xAxis:{type:'category',data:x,axisLabel:{color:'#94a3b8',fontSize:11}},yAxis:{type:'value',axisLabel:{color:'#94a3b8',fontSize:11}},series:[{name:cfg.seriesName||'',type:'bar',data:y,label:cfg.showLabel?{show:true,position:'top',color:'#e2e8f0'}:undefined}]});
      }
    }
    if (type === 'line') {
      var x=parseArray(cfg.xField),y=parseArray(cfg.yField).map(Number);
      return Object.assign({},common,{xAxis:{type:'category',data:x,boundaryGap:false,axisLabel:{color:'#94a3b8',fontSize:11}},yAxis:{type:'value',axisLabel:{color:'#94a3b8',fontSize:11}},series:[{name:cfg.seriesName||'',type:'line',data:y,smooth:cfg.smooth!==false,areaStyle:cfg.showArea?{}:undefined,label:cfg.showLabel?{show:true,color:'#e2e8f0'}:undefined}]});
    }
    if (type === 'pie') {
      var labels=parseArray(cfg.dataLabels),vals=parseArray(cfg.dataValues).map(Number),data=labels.map(function(n,i){return {name:n,value:vals[i]||0}});
      return {title:{text:cfg.title||'',left:'center',textStyle:{color:'#e2e8f0',fontSize:14}},tooltip:cfg.showTooltip!==false?{trigger:'item'}:undefined,legend:cfg.showLegend!==false?{bottom:0,textStyle:{color:'#94a3b8',fontSize:11}}:undefined,color:colors,series:[{name:cfg.seriesName||'',type:'pie',radius:cfg.radius||'60%',center:['50%','45%'],data:data,label:cfg.showLabel!==false?{color:'#94a3b8',fontSize:11}:{show:false}}]};
    }
    if (type === 'scatter') {
      var x=parseArray(cfg.xField).map(Number),y=parseArray(cfg.yField).map(Number),data=x.map(function(v,i){return [v,y[i]||0]});
      return {title:{text:cfg.title||'',left:'center',textStyle:{color:'#e2e8f0',fontSize:14}},tooltip:{},grid:{left:'3%',right:'4%',bottom:'3%',top:'15%',containLabel:true},xAxis:{type:'value',axisLabel:{color:'#94a3b8',fontSize:11}},yAxis:{type:'value',axisLabel:{color:'#94a3b8',fontSize:11}},color:colors,series:[{name:cfg.seriesName||'',type:'scatter',data:data,symbolSize:cfg.symbolSize||10}]};
    }
    if (type === 'area') {
      var x=parseArray(cfg.xField),y=parseArray(cfg.yField).map(Number);
      return Object.assign({},common,{xAxis:{type:'category',data:x,boundaryGap:false,axisLabel:{color:'#94a3b8',fontSize:11}},yAxis:{type:'value',axisLabel:{color:'#94a3b8',fontSize:11}},series:[{name:cfg.seriesName||'',type:'line',data:y,smooth:cfg.smooth!==false,areaStyle:{}}]});
    }
    if (type === 'radar') {
      var ind=parseArray(cfg.indicators),vals=parseArray(cfg.dataValues).map(Number),max=Math.max.apply(null,vals.concat([100]));
      return {title:{text:cfg.title||'',left:'center',textStyle:{color:'#e2e8f0',fontSize:14}},tooltip:{},legend:cfg.showLegend!==false?{bottom:0,textStyle:{color:'#94a3b8',fontSize:11}}:undefined,radar:{indicator:ind.map(function(n){return {name:n,max:max}}),shape:cfg.shape||'polygon'},color:colors,series:[{name:cfg.seriesName||'',type:'radar',data:[{value:vals,name:cfg.seriesName||''}]}]};
    }
    if (type === 'funnel') {
      var st=parseArray(cfg.stages),vs=parseArray(cfg.values).map(Number),data=st.map(function(n,i){return {name:n,value:vs[i]||0}});
      return {title:{text:cfg.title||'',left:'center',textStyle:{color:'#e2e8f0',fontSize:14}},tooltip:{trigger:'item'},series:[{name:cfg.seriesName||'',type:'funnel',left:'10%',top:50,bottom:50,width:'80%',sort:cfg.sort||'descending',gap:2,data:data,label:{show:true,position:'inside',color:'#fff',fontSize:12}}]};
    }
    if (type === 'gauge') {
      return {title:{text:cfg.title||'',left:'center',textStyle:{color:'#e2e8f0',fontSize:14}},series:[{name:cfg.seriesName||'',type:'gauge',min:cfg.min||0,max:cfg.max||100,detail:{valueAnimation:true,formatter:'{value}'+(cfg.unit||'%'),color:'#e2e8f0',fontSize:20},data:[{value:Number(cfg.value)||0}]}]};
    }
    return null;
  }
})();
<\/script>
</body>
</html>`
}

function downloadHTML() {
  const html = generateStandaloneHTML()
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bigscreen-${Date.now()}.html`
  a.click()
  URL.revokeObjectURL(url)
}

function downloadJSON() {
  const json = exportCanvas()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bigscreen-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="publish-overlay" @click.self="emit('close')">
    <div class="publish-modal">
      <!-- Header -->
      <div class="publish-header">
        <h2>📦 发布大屏</h2>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <!-- Body -->
      <div class="publish-body">
        <!-- Tabs -->
        <div class="publish-tabs">
          <button :class="{ active: activeTab === 'html' }" @click="activeTab = 'html'">
            📄 独立HTML
          </button>
          <button :class="{ active: activeTab === 'json' }" @click="activeTab = 'json'">
            📦 项目文件
          </button>
          <button :class="{ active: activeTab === 'deploy' }" @click="activeTab = 'deploy'">
            🌐 部署说明
          </button>
        </div>

        <!-- HTML tab -->
        <div v-if="activeTab === 'html'" class="tab-content">
          <div class="info-card">
            <div class="info-icon">💡</div>
            <div class="info-text">
              <strong>独立 HTML 文件</strong>
              <p>生成一个包含所有图表和样式的 .html 文件，可直接在浏览器中打开，无需任何服务器。ECharts 通过 CDN 加载。</p>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">📐</div>
            <div class="info-text">
              <strong>自适应缩放</strong>
              <p>大屏按设计分辨率 ({{ canvasStyle.width }}×{{ canvasStyle.height }}) 渲染，自动缩放适配实际窗口大小。</p>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">📊</div>
            <div class="info-text">
              <strong>包含 {{ components.length }} 个组件</strong>
              <p>所有图表 (ECharts)、文本、表格等组件均完整渲染。</p>
            </div>
          </div>

          <button class="action-btn primary" @click="downloadHTML">
            📥 下载 HTML 文件
          </button>
          <p class="hint">下载后双击 .html 文件即可在浏览器中查看</p>
        </div>

        <!-- JSON tab -->
        <div v-if="activeTab === 'json'" class="tab-content">
          <div class="info-card">
            <div class="info-icon">💾</div>
            <div class="info-text">
              <strong>项目配置文件</strong>
              <p>导出为标准 JSON 格式，可在编辑器中通过「导入」功能恢复，方便版本管理和团队协作。</p>
            </div>
          </div>
          <button class="action-btn" @click="downloadJSON">
            📥 导出 JSON 配置
          </button>
        </div>

        <!-- Deploy tab -->
        <div v-if="activeTab === 'deploy'" class="tab-content">
          <div class="info-card">
            <div class="info-icon">🚀</div>
            <div class="info-text">
              <strong>纯静态部署</strong>
              <p>本平台为纯前端项目，构建后生成静态文件，可部署到任何静态托管服务。</p>
            </div>
          </div>

          <div class="deploy-steps">
            <div class="step">
              <span class="step-num">1</span>
              <div>
                <strong>构建项目</strong>
                <code>pnpm build</code>
              </div>
            </div>
            <div class="step">
              <span class="step-num">2</span>
              <div>
                <strong>部署 dist/ 目录</strong>
                <p>将 dist/ 文件夹上传到任意静态服务器</p>
              </div>
            </div>
          </div>

          <button class="toggle-deploy" @click="deployDocsExpanded = !deployDocsExpanded">
            {{ deployDocsExpanded ? '收起' : '查看' }}部署方式详情
          </button>

          <div v-if="deployDocsExpanded" class="deploy-docs">
            <h4>Netlify（推荐）</h4>
            <code>拖拽 dist/ 文件夹到 Netlify Drop 即可部署</code>

            <h4>Nginx</h4>
            <code>server {<br/>
&nbsp;&nbsp;listen 80;<br/>
&nbsp;&nbsp;root /var/www/bigscreen;<br/>
&nbsp;&nbsp;location / { try_files $uri $uri/ /index.html; }<br/>
}</code>

            <h4>Vercel</h4>
            <code>vercel --prod</code>

            <h4>GitHub Pages</h4>
            <code>使用 gh-pages 分支或 GitHub Actions 自动部署 dist/</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.publish-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.publish-modal {
  width: 600px;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.publish-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.publish-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.close-btn:hover { background: #f1f5f9; color: #475569; }

.publish-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 24px;
}

.publish-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 10px;
}

.publish-tabs button {
  flex: 1;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.publish-tabs button.active {
  background: #fff;
  color: #6366f1;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.tab-content { display: flex; flex-direction: column; gap: 12px; }

.info-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.info-icon { font-size: 24px; flex-shrink: 0; }

.info-text strong {
  display: block;
  font-size: 13px;
  color: #1e293b;
  margin-bottom: 4px;
}

.info-text p {
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

.action-btn {
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover { background: #e2e8f0; }

.action-btn.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(99,102,241,0.3);
}

.action-btn.primary:hover { box-shadow: 0 6px 20px rgba(99,102,241,0.4); transform: translateY(-1px); }

.hint {
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
  margin: 0;
}

/* Deploy steps */
.deploy-steps { display: flex; flex-direction: column; gap: 10px; }

.step {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step-num {
  width: 24px; height: 24px;
  background: #6366f1;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.step strong { display: block; font-size: 13px; color: #1e293b; margin-bottom: 2px; }
.step code { font-size: 11px; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; color: #6366f1; }
.step p { font-size: 12px; color: #64748b; margin: 4px 0 0; }

.toggle-deploy {
  background: none;
  border: none;
  font-size: 12px;
  color: #6366f1;
  cursor: pointer;
  padding: 4px 0;
  text-align: left;
}

.deploy-docs {
  background: #1e293b;
  border-radius: 10px;
  padding: 16px;
  font-size: 12px;
  color: #cbd5e1;
}

.deploy-docs h4 { color: #e2e8f0; margin: 12px 0 4px; font-size: 13px; }
.deploy-docs h4:first-child { margin-top: 0; }
.deploy-docs code { display: block; background: #0f172a; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #94a3b8; white-space: pre-wrap; }
</style>
