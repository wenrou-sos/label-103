import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据概览', icon: 'DashboardOutlined' },
      },
      {
        path: 'tickets',
        name: 'Tickets',
        component: () => import('@/views/ticket/TicketList.vue'),
        meta: { title: '门票管理', icon: 'TicketOutlined', roles: ['admin', 'operator'] },
      },
      {
        path: 'ticket-types',
        name: 'TicketTypes',
        component: () => import('@/views/ticket/TicketTypeList.vue'),
        meta: { title: '票种管理', icon: 'SettingOutlined', roles: ['admin'] },
      },
      {
        path: 'annual-cards',
        name: 'AnnualCards',
        component: () => import('@/views/annualCard/AnnualCardList.vue'),
        meta: { title: '年卡管理', icon: 'CreditCardOutlined', roles: ['admin', 'operator'] },
      },
      {
        path: 'card-types',
        name: 'CardTypes',
        component: () => import('@/views/annualCard/CardTypeList.vue'),
        meta: { title: '年卡类型', icon: 'AppstoreOutlined', roles: ['admin'] },
      },
      {
        path: 'renewal-packages',
        name: 'RenewalPackages',
        component: () => import('@/views/annualCard/RenewalPackageList.vue'),
        meta: { title: '续费套餐', icon: 'GiftOutlined', roles: ['admin'] },
      },
      {
        path: 'consumptions',
        name: 'Consumptions',
        component: () => import('@/views/consumption/ConsumptionList.vue'),
        meta: { title: '消费管理', icon: 'ShoppingCartOutlined', roles: ['admin', 'operator', 'cashier'] },
      },
      {
        path: 'visitors',
        name: 'Visitors',
        component: () => import('@/views/visitor/VisitorList.vue'),
        meta: { title: '客流管理', icon: 'TeamOutlined', roles: ['admin', 'operator'] },
      },
      {
        path: 'visitor-monitor',
        name: 'VisitorMonitor',
        component: () => import('@/views/visitor/VisitorMonitor.vue'),
        meta: { title: '实时监控', icon: 'MonitorOutlined', roles: ['admin', 'operator'] },
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/statistics/Statistics.vue'),
        meta: { title: '统计分析', icon: 'BarChartOutlined', roles: ['admin', 'operator'] },
      },
      {
        path: 'seasons',
        name: 'Seasons',
        component: () => import('@/views/season/SeasonList.vue'),
        meta: { title: '季节管理', icon: 'CalendarOutlined', roles: ['admin'] },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/user/UserList.vue'),
        meta: { title: '用户管理', icon: 'UserOutlined', roles: ['admin'] },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心', icon: 'UserOutlined' },
      },
      {
        path: 'my-tickets',
        name: 'MyTickets',
        component: () => import('@/views/ticket/MyTickets.vue'),
        meta: { title: '我的门票', icon: 'TicketOutlined', roles: ['member'] },
      },
      {
        path: 'my-cards',
        name: 'MyCards',
        component: () => import('@/views/annualCard/MyCards.vue'),
        meta: { title: '我的年卡', icon: 'CreditCardOutlined', roles: ['member'] },
      },
      {
        path: 'my-consumptions',
        name: 'MyConsumptions',
        component: () => import('@/views/consumption/MyConsumptions.vue'),
        meta: { title: '我的消费', icon: 'ShoppingCartOutlined', roles: ['member'] },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  document.title = to.meta.title
    ? `${to.meta.title} - 游乐园票务与会员管理平台`
    : '游乐园票务与会员管理平台'

  if (to.meta.requiresAuth === false) {
    next()
    return
  }

  if (!userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.roles && !userStore.hasRole(to.meta.roles)) {
    next('/dashboard')
    return
  }

  next()
})

export default router
