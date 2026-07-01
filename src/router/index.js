import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../pages/Dashboard.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/workflow',
    name: 'Workflow',
    component: () => import('../pages/WorkflowEditor.vue'),
    meta: { title: '工作流编排' },
  },
  {
    path: '/lowcode',
    name: 'LowCode',
    component: () => import('../pages/LowCodeEditor.vue'),
    meta: { title: '可视化大屏' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
