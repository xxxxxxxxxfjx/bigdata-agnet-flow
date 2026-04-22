# BigData Agent Flow

大数据 Agent 工作流可视化编排平台，用于搭建大数据开发的 Agent 链路。

基于 **Vue 3 + Vite + Vue Flow** 构建，提供拖拽式节点编排、连线和配置能力。

## 预览

| 功能 | 说明 |
|------|------|
| 左侧面板 | 节点类型列表，支持分类折叠，拖拽添加到画布 |
| 中间画布 | Vue Flow 画布，支持缩放、平移、节点连线 |
| 右侧面板 | 点击节点后展开，动态渲染该节点类型的配置表单 |

## 节点类型

| 类别 | 节点 | 说明 |
|------|------|------|
| 数据节点 | 数据源、数据输出 | 连接数据库/文件/API，输出处理结果 |
| 处理节点 | SQL 查询、Python 脚本、数据转换、数据过滤、数据合并 | 数据加工处理 |
| AI 节点 | LLM 模型、Agent 智能体 | 大模型调用与自主决策 |
| 控制节点 | 条件分支 | 流程控制与分支判断 |

## 技术栈

- **Vue 3** — 组合式 API（Composition API）
- **Vite 5** — 开发与构建
- **Vue Flow** — 流程图画布引擎（core / background / controls / minimap）
- **VueUse** — 组合式工具库

## 项目结构

```
src/
├── main.js                        # 入口
├── App.vue                        # 三栏布局
├── styles/main.css                # 全局样式 + Vue Flow 覆盖
├── config/nodeTypes.js            # 10 种节点类型定义与配置字段
├── composables/useWorkflow.js     # 工作流状态管理
└── components/
    ├── NodePanel.vue              # 左侧节点面板
    ├── FlowCanvas.vue             # 中间画布
    ├── ConfigPanel.vue            # 右侧配置面板
    └── nodes/CustomNode.vue       # 自定义节点组件
```

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm（推荐）或 npm

### 安装依赖

```bash
pnpm install
```

### 本地开发

```bash
pnpm dev
```

默认运行在 `http://localhost:5180`。

### 生产构建

```bash
pnpm build
```

构建产物输出到 `dist/` 目录。

### 本地预览构建产物

```bash
pnpm preview
```

## 部署

### 方式一：Netlify 部署（推荐）

项目已配置 `netlify.toml`，支持一键部署。

**通过 Git 自动部署：**

1. 将代码推送到 GitHub
2. 在 [Netlify](https://app.netlify.com) 中导入该仓库
3. Netlify 会自动识别配置并完成构建部署

**通过 CLI 手动部署：**

```bash
# 安装 Netlify CLI
pnpm add -g netlify-cli

# 登录
netlify login

# 构建并部署
pnpm build
netlify deploy --prod --dir=dist
```

### 方式二：静态服务器部署

构建后 `dist/` 目录为纯静态文件，可部署到任意静态服务器：

**Nginx 配置示例：**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Docker 部署：**

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
```

```bash
docker build -t bigdata-agent-flow .
docker run -d -p 80:80 bigdata-agent-flow
```

### 方式三：其他平台

`dist/` 可直接部署到 Vercel、GitHub Pages、Cloudflare Pages 等任意静态托管平台。

## 功能说明

- **拖拽添加** — 从左侧面板拖拽节点到画布
- **节点连线** — 拖拽节点端口建立数据流连接
- **节点配置** — 点击节点打开右侧配置面板
- **导入/导出** — JSON 格式保存和加载工作流
- **画布操作** — 缩放、平移、MiniMap 导航
- **删除** — 点击配置面板删除按钮移除节点，双击连线删除连接

## License

MIT
