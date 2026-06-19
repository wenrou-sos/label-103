<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider
      v-model:collapsed="collapsed"
      collapsible
      :trigger="null"
      class="layout-sider"
      theme="dark"
    >
      <div class="logo">
        <CarryOutOutlined v-if="collapsed" />
        <span v-else>🎢 游乐园管理</span>
      </div>
      <a-menu
        theme="dark"
        mode="inline"
        :selected-keys="selectedKeys"
        :open-keys="openKeys"
        @click="handleMenuClick"
        @openChange="onOpenChange"
      >
        <a-menu-item key="/dashboard">
          <template #icon>
            <DashboardOutlined />
          </template>
          <span>数据概览</span>
        </a-menu-item>

        <a-sub-menu v-if="isAdminOrOperator" key="ticket-menu">
          <template #icon>
            <TagsOutlined />
          </template>
          <template #title>票务管理</template>
          <a-menu-item key="/tickets">门票订单</a-menu-item>
          <a-menu-item v-if="isAdmin" key="/ticket-types">票种管理</a-menu-item>
        </a-sub-menu>

        <a-sub-menu v-if="isAdminOrOperator" key="card-menu">
          <template #icon>
            <CreditCardOutlined />
          </template>
          <template #title>年卡管理</template>
          <a-menu-item key="/annual-cards">年卡列表</a-menu-item>
          <a-menu-item v-if="isAdmin" key="/card-types">年卡类型</a-menu-item>
          <a-menu-item v-if="isAdmin" key="/renewal-packages">续费套餐</a-menu-item>
        </a-sub-menu>

        <a-menu-item v-if="isAdminOrOperatorOrCashier" key="/consumptions">
          <template #icon>
            <ShoppingCartOutlined />
          </template>
          <span>消费管理</span>
        </a-menu-item>

        <a-sub-menu v-if="isAdminOrOperator" key="visitor-menu">
          <template #icon>
            <TeamOutlined />
          </template>
          <template #title>客流管理</template>
          <a-menu-item key="/visitors">客流记录</a-menu-item>
          <a-menu-item key="/visitor-monitor">实时监控</a-menu-item>
        </a-sub-menu>

        <a-menu-item v-if="isAdminOrOperator" key="/statistics">
          <template #icon>
            <BarChartOutlined />
          </template>
          <span>统计分析</span>
        </a-menu-item>

        <a-menu-item v-if="isAdmin" key="/seasons">
          <template #icon>
            <CalendarOutlined />
          </template>
          <span>季节管理</span>
        </a-menu-item>

        <a-menu-item v-if="isAdmin" key="/users">
          <template #icon>
            <UserOutlined />
          </template>
          <span>用户管理</span>
        </a-menu-item>

        <a-menu-item v-if="isAdmin" key="/audit-logs">
          <template #icon>
            <FileTextOutlined />
          </template>
          <span>操作审计</span>
        </a-menu-item>

        <a-menu-divider v-if="isMember" />

        <a-menu-item v-if="isMember" key="/my-tickets">
          <template #icon>
            <TagsOutlined />
          </template>
          <span>我的门票</span>
        </a-menu-item>

        <a-menu-item v-if="isMember" key="/my-cards">
          <template #icon>
            <CreditCardOutlined />
          </template>
          <span>我的年卡</span>
        </a-menu-item>

        <a-menu-item v-if="isMember" key="/my-consumptions">
          <template #icon>
            <ShoppingCartOutlined />
          </template>
          <span>我的消费</span>
        </a-menu-item>

        <a-menu-divider />

        <a-menu-item key="/profile">
          <template #icon>
            <UserOutlined />
          </template>
          <span>个人中心</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="layout-header">
        <div class="header-left">
          <MenuUnfoldOutlined
            v-if="!collapsed"
            class="trigger"
            @click="collapsed = !collapsed"
          />
          <MenuFoldOutlined
            v-else
            class="trigger"
            @click="collapsed = !collapsed"
          />
          <span class="header-title">{{ currentPageTitle }}</span>
        </div>
        <div class="header-user">
          <a-badge :count="noticeCount" :offset="[-5, 5]">
            <BellOutlined style="font-size: 18px; cursor: pointer" />
          </a-badge>
          <a-dropdown>
            <div class="user-info">
              <a-avatar :size="32" style="background-color: #1890ff">
                <UserOutlined />
              </a-avatar>
              <span class="username">{{ userName }}</span>
              <DownOutlined />
            </div>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="goProfile">
                  <UserOutlined />
                  个人中心
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item @click="handleLogout">
                  <LogoutOutlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <a-layout-content class="page-container">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message, Modal } from 'ant-design-vue'
import {
  DashboardOutlined,
  TagsOutlined,
  CreditCardOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  BarChartOutlined,
  CalendarOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
  DownOutlined,
  LogoutOutlined,
  CarryOutOutlined,
  FileTextOutlined,
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const collapsed = ref(false)
const openKeys = ref([])
const noticeCount = ref(3)

const userName = computed(() => userStore.userName)
const isAdmin = computed(() => userStore.hasRole('admin'))
const isAdminOrOperator = computed(() => userStore.hasRole(['admin', 'operator']))
const isAdminOrOperatorOrCashier = computed(() => userStore.hasRole(['admin', 'operator', 'cashier']))
const isMember = computed(() => userStore.hasRole('member'))

const selectedKeys = computed(() => [route.path])

const currentPageTitle = computed(() => route.meta?.title || '')

const handleMenuClick = ({ key }) => {
  router.push(key)
}

const onOpenChange = (keys) => {
  openKeys.value = keys
}

const goProfile = () => {
  router.push('/profile')
}

const handleLogout = () => {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      await userStore.logout()
      message.success('退出成功')
      router.push('/login')
    },
  })
}

watch(
  () => route.path,
  () => {
    const parentKey = findParentKey(route.path)
    if (parentKey) {
      openKeys.value = [parentKey]
    }
  }
)

const findParentKey = (path) => {
  const parentMap = {
    '/tickets': 'ticket-menu',
    '/ticket-types': 'ticket-menu',
    '/annual-cards': 'card-menu',
    '/card-types': 'card-menu',
    '/renewal-packages': 'card-menu',
    '/visitors': 'visitor-menu',
    '/visitor-monitor': 'visitor-menu',
  }
  return parentMap[path]
}

onMounted(() => {
  const parentKey = findParentKey(route.path)
  if (parentKey) {
    openKeys.value = [parentKey]
  }
})
</script>

<style scoped>
.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
  margin-right: 16px;
}

.trigger:hover {
  color: #1890ff;
}

.header-left {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #1f2937;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
