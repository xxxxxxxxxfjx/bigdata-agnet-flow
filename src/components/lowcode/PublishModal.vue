<script setup>
import { ref } from 'vue'
import { useCanvas } from '../../composables/useCanvas.js'

const emit = defineEmits(['close'])
const { components, canvasStyle, exportCanvas } = useCanvas()

const activeTab = ref('html')

function download(filename, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function generateStandaloneHTML() {
  const data = JSON.parse(exportCanvas())
  const payload = JSON.stringify(data)
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>可视化大屏</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@6.0.0/dist/echarts.min.js"><\/script>
  <style>
    *{box-sizing:border-box} html,body,#app{width:100%;height:100%;margin:0;overflow:hidden;background:#000;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif}
    #screen{position:relative;overflow:hidden;transform-origin:left top}
    .component{position:absolute;overflow:hidden}
    .center{display:flex;align-items:center;justify-content:center;flex-direction:column}
    .counter-title{color:#94a3b8;font-size:13px}.counter-value{font-family:Consolas,monospace;font-weight:900}.table-title{color:#e2e8f0;text-align:center;font-weight:800;margin-bottom:8px}
    table{width:100%;border-collapse:collapse}th,td{padding:7px 10px;border:1px solid rgba(255,255,255,.07);color:#e2e8f0;white-space:nowrap;text-align:left}
  </style>
</head>
<body>
  <div id="app"><div id="screen"></div></div>
  <script>
    const DATA = ${payload};
    const screen = document.getElementById('screen');
    const canvas = DATA.canvasStyle || { width: 1920, height: 1080, background: '#0f172a' };
    screen.style.width = canvas.width + 'px';
    screen.style.height = canvas.height + 'px';
    screen.style.background = canvas.background || '#0f172a';
    function resize(){const s=Math.min(innerWidth/canvas.width,innerHeight/canvas.height);screen.style.transform='scale('+s+')';screen.style.marginLeft=(innerWidth-canvas.width*s)/2+'px';screen.style.marginTop=(innerHeight-canvas.height*s)/2+'px'}
    addEventListener('resize', resize); resize();
    const split = v => !v ? [] : Array.isArray(v) ? v : String(v).split(/[,，]/).map(s=>s.trim()).filter(Boolean);
    const colors = ['#2563eb','#14b8a6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#22c55e'];
    function chartOption(type,cfg){
      const title={text:cfg.title||'',left:'center',textStyle:{color:'#e2e8f0',fontSize:14}};
      const grid={left:12,right:16,bottom:cfg.showLegend?42:18,top:48,containLabel:true};
      if(type==='bar'){return {title,tooltip:{trigger:'axis'},grid,color:cfg.colors||colors,xAxis:{type:'category',data:split(cfg.xField),axisLabel:{color:'#94a3b8'}},yAxis:{type:'value',axisLabel:{color:'#94a3b8'},splitLine:{lineStyle:{color:'rgba(148,163,184,.12)'}}},series:[{type:'bar',name:cfg.seriesName||'',data:split(cfg.yField).map(Number),label:cfg.showLabel?{show:true,position:'top',color:'#e2e8f0'}:undefined}]}}
      if(type==='line'||type==='area'){return {title,tooltip:{trigger:'axis'},grid,color:cfg.colors||colors,xAxis:{type:'category',data:split(cfg.xField),boundaryGap:false,axisLabel:{color:'#94a3b8'}},yAxis:{type:'value',axisLabel:{color:'#94a3b8'},splitLine:{lineStyle:{color:'rgba(148,163,184,.12)'}}},series:[{type:'line',name:cfg.seriesName||'',data:split(cfg.yField).map(Number),smooth:cfg.smooth!==false,areaStyle:(type==='area'||cfg.showArea)?{opacity:.18}:undefined}]}}
      if(type==='pie'){const labels=split(cfg.dataLabels),vals=split(cfg.dataValues).map(Number);return {title,tooltip:{trigger:'item'},legend:cfg.showLegend?{bottom:0,textStyle:{color:'#94a3b8'}}:undefined,color:cfg.colors||colors,series:[{type:'pie',radius:cfg.radius||'62%',center:['50%','48%'],data:labels.map((name,i)=>({name,value:vals[i]||0}))}]}}
      if(type==='gauge'){return {title,series:[{type:'gauge',min:cfg.min||0,max:cfg.max||100,progress:{show:true,width:12},detail:{formatter:'{value}'+(cfg.unit||'%'),color:'#e2e8f0'},data:[{value:Number(cfg.value)||0}]}]}}
      if(type==='funnel'){const s=split(cfg.stages),v=split(cfg.values).map(Number);return {title,tooltip:{trigger:'item'},series:[{type:'funnel',left:'10%',top:48,bottom:24,width:'80%',data:s.map((name,i)=>({name,value:v[i]||0})),label:{show:true,position:'inside',color:'#fff'}}]}}
      return null;
    }
    (DATA.components||[]).sort((a,b)=>(a.zIndex||0)-(b.zIndex||0)).forEach(comp=>{
      const cfg=comp.data?.config||{}, style=comp.data?.style||{}, div=document.createElement('div');
      div.className='component'; Object.assign(div.style,{left:comp.x+'px',top:comp.y+'px',width:comp.w+'px',height:comp.h+'px',zIndex:comp.zIndex||1,opacity:style.opacity??1,borderRadius:(style.borderRadius||0)+'px',boxShadow:style.boxShadow||'none',background:style.background||'transparent',border:style.border||'none'});
      screen.appendChild(div);
      if(['bar','line','area','pie','gauge','funnel'].includes(comp.type)){const chart=echarts.init(div);const opt=chartOption(comp.type,cfg);if(opt)chart.setOption(opt);return}
      if(comp.type==='numberCounter'){div.className+=' center';div.innerHTML='<div class="counter-title">'+(cfg.title||'')+'</div><div class="counter-value" style="color:'+(cfg.color||'#38bdf8')+';font-size:'+(cfg.fontSize||36)+'px">'+(cfg.prefix||'')+Number(cfg.value||0).toLocaleString()+(cfg.suffix||'')+'</div>';return}
      if(comp.type==='titleText'){div.className+=' center';div.style.color=cfg.color||'#fff';div.style.fontSize=(cfg.fontSize||32)+'px';div.style.fontWeight=cfg.fontWeight||'800';div.textContent=cfg.text||'';return}
      if(comp.type==='richText'){div.style.color=cfg.color||'#cbd5e1';div.style.fontSize=(cfg.fontSize||14)+'px';div.style.lineHeight=cfg.lineHeight||1.8;div.style.padding=cfg.padding||'16px';div.textContent=cfg.content||'';return}
      if(comp.type==='table'){const cols=split(cfg.columns),rows=String(cfg.rows||'').split('\\n').filter(Boolean);div.innerHTML='<div class="table-title">'+(cfg.title||'')+'</div><table><thead><tr>'+cols.map(c=>'<th>'+c+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+split(r).map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table>';return}
    });
  <\/script>
</body>
</html>`
}

function downloadHTML() {
  download(`dashboard-${Date.now()}.html`, generateStandaloneHTML(), 'text/html;charset=utf-8')
}

function downloadJSON() {
  download(`dashboard-${Date.now()}.json`, exportCanvas(), 'application/json;charset=utf-8')
}
</script>

<template>
  <div class="publish-overlay" @click.self="emit('close')">
    <section class="publish-modal">
      <header class="publish-header">
        <div>
          <h2>发布大屏</h2>
          <p>{{ canvasStyle.width }} x {{ canvasStyle.height }} · {{ components.length }} 个组件</p>
        </div>
        <button class="close-btn" @click="emit('close')">关闭</button>
      </header>

      <nav class="publish-tabs">
        <button :class="{ active: activeTab === 'html' }" @click="activeTab = 'html'">独立 HTML</button>
        <button :class="{ active: activeTab === 'json' }" @click="activeTab = 'json'">项目 JSON</button>
        <button :class="{ active: activeTab === 'deploy' }" @click="activeTab = 'deploy'">部署说明</button>
      </nav>

      <div class="publish-body">
        <div v-if="activeTab === 'html'" class="tab-content">
          <div class="info-card">
            <strong>适合演示和交付</strong>
            <p>生成一个可独立打开的 HTML 文件，内置画布布局和基础组件渲染，ECharts 通过 CDN 加载。</p>
          </div>
          <button class="primary-btn" @click="downloadHTML">下载 HTML 文件</button>
        </div>

        <div v-if="activeTab === 'json'" class="tab-content">
          <div class="info-card">
            <strong>适合版本管理</strong>
            <p>导出完整画布 JSON，可通过编辑器的“导入”功能恢复，也方便提交到 Git。</p>
          </div>
          <button class="secondary-btn" @click="downloadJSON">下载 JSON 配置</button>
        </div>

        <div v-if="activeTab === 'deploy'" class="tab-content">
          <div class="step"><span>1</span><p>本项目是 Vite 静态前端项目，安装依赖后运行 <code>npm run build</code>。</p></div>
          <div class="step"><span>2</span><p>将 <code>dist/</code> 目录部署到 Nginx、Netlify、Vercel 或任意静态托管服务。</p></div>
          <div class="step"><span>3</span><p>如果使用 Hash 路由，静态托管无需额外 rewrite 配置。</p></div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.publish-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(5px);
}

.publish-modal {
  width: 620px;
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.34);
}

.publish-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid #e5edf7;
}

.publish-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
}

.publish-header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}

.close-btn,
.publish-tabs button,
.primary-btn,
.secondary-btn {
  height: 34px;
  padding: 0 13px;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  font-weight: 800;
}

.publish-tabs {
  display: flex;
  gap: 6px;
  padding: 12px 18px;
  background: #f8fafc;
  border-bottom: 1px solid #e5edf7;
}

.publish-tabs button.active {
  color: #2563eb;
  border-color: #2563eb;
  background: #eff6ff;
}

.publish-body {
  padding: 20px 22px 24px;
  overflow-y: auto;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-card {
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.info-card strong {
  color: #0f172a;
}

.info-card p,
.step p {
  margin: 6px 0 0;
  color: #475569;
  line-height: 1.7;
}

.primary-btn {
  color: #ffffff;
  background: #2563eb;
  border-color: #2563eb;
}

.secondary-btn {
  color: #0f766e;
  background: #f0fdfa;
  border-color: #99f6e4;
}

.step {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step span {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  color: #ffffff;
  background: #2563eb;
  font-size: 12px;
  font-weight: 900;
}

code {
  padding: 2px 6px;
  border-radius: 4px;
  color: #2563eb;
  background: #eff6ff;
}
</style>
