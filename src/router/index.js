import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../pages/Dashboard.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/workflows',
    name: 'WorkflowList',
    component: () => import('../pages/WorkflowList.vue'),
    meta: { title: '工作流列表' },
  },
  {
    path: '/workflow/:id',
    name: 'Workflow',
    component: () => import('../pages/WorkflowEditor.vue'),
    meta: { title: '工作流编辑器' },
    props: true,
  },
  {
    path: '/workflow',
    redirect: '/workflows',
  },
  {
    path: '/lowcode',
    name: 'LowCodeList',
    component: () => import('../pages/LowCodeList.vue'),
    meta: { title: '可视化大屏列表' },
  },
  {
    path: '/lowcode/:id',
    name: 'LowCode',
    component: () => import('../pages/LowCodeEditor.vue'),
    meta: { title: '大屏编辑器' },
    props: true,
  },
  {
    path: '/lowcode-editor',
    redirect: '/lowcode',
  },
  {
    path: '/ai',
    name: 'AIAssistant',
    component: () => import('../pages/AIAssistant.vue'),
    meta: { title: 'AI 智能助手' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
