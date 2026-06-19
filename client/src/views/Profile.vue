<template>
  <div class="profile-page">
    <a-row :gutter="24">
      <a-col :span="8">
        <a-card class="profile-card">
          <div class="avatar-section">
            <a-avatar :size="120" :src="userInfo.avatar">
              {{ userInfo.realName?.charAt(0) || userInfo.username?.charAt(0) || 'U' }}
            </a-avatar>
            <h2 class="username">{{ userInfo.realName || userInfo.username }}</h2>
            <a-tag :color="roleColors[userInfo.role]" class="role-tag">
              {{ roleMap[userInfo.role] }}
            </a-tag>
          </div>
          <a-divider />
          <div class="profile-stats">
            <a-row>
              <a-col :span="12" class="stat-item">
                <div class="stat-value">{{ myCardsCount }}</div>
                <div class="stat-label">我的年卡</div>
              </a-col>
              <a-col :span="12" class="stat-item">
                <div class="stat-value">{{ myTicketsCount }}</div>
                <div class="stat-label">我的门票</div>
              </a-col>
            </a-row>
          </div>
        </a-card>
      </a-col>

      <a-col :span="16">
        <a-card title="个人信息" :extra="extraButton">
          <template v-if="!editing">
            <a-descriptions :column="2" bordered size="default">
              <a-descriptions-item label="用户名">{{ userInfo.username }}</a-descriptions-item>
              <a-descriptions-item label="角色">
                <a-tag :color="roleColors[userInfo.role]">
                  {{ roleMap[userInfo.role] }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="真实姓名">{{ userInfo.realName || '-' }}</a-descriptions-item>
              <a-descriptions-item label="手机号">{{ userInfo.phone || '-' }}</a-descriptions-item>
              <a-descriptions-item label="邮箱">{{ userInfo.email || '-' }}</a-descriptions-item>
              <a-descriptions-item label="身份证号">{{ userInfo.idCard || '-' }}</a-descriptions-item>
            </a-descriptions>
          </template>
          <template v-else>
            <a-form :model="editForm" layout="vertical">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="用户名">
                    <a-input v-model:value="editForm.username" disabled />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="真实姓名">
                    <a-input v-model:value="editForm.realName" placeholder="请输入真实姓名" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="手机号">
                    <a-input v-model:value="editForm.phone" placeholder="请输入手机号" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="邮箱">
                    <a-input v-model:value="editForm.email" placeholder="请输入邮箱" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-form-item label="身份证号">
                <a-input v-model:value="editForm.idCard" placeholder="请输入身份证号" />
              </a-form-item>
            </a-form>
          </template>
        </a-card>

        <a-card title="我的年卡概况" style="margin-top: 16px">
          <a-row :gutter="16">
            <a-col :span="8">
              <div class="overview-card">
                <div class="overview-icon">
                  <CreditCardOutlined style="color: #52c41a; font-size: 32px" />
                </div>
                <div class="overview-info">
                  <div class="overview-value">{{ cardStats.active }}</div>
                  <div class="overview-label">有效年卡</div>
                </div>
              </div>
            </a-col>
            <a-col :span="8">
              <div class="overview-card">
                <div class="overview-icon">
                  <WarningOutlined style="color: #faad14; font-size: 32px" />
                </div>
                <div class="overview-info">
                  <div class="overview-value">{{ cardStats.expiring }}</div>
                  <div class="overview-label">即将到期</div>
                </div>
              </div>
            </a-col>
            <a-col :span="8">
              <div class="overview-card">
                <div class="overview-icon">
                  <DollarOutlined style="color: #1890ff; font-size: 32px" />
                </div>
                <div class="overview-info">
                  <div class="overview-value">¥{{ cardStats.totalBalance }}</div>
                  <div class="overview-label">总余额</div>
                </div>
              </div>
            </a-col>
          </a-row>
        </a-card>

        <a-card title="我的门票概况" style="margin-top: 16px">
          <a-row :gutter="16">
            <a-col :span="8">
              <div class="overview-card">
                <div class="overview-icon">
                  <TicketOutlined style="color: #722ed1; font-size: 32px" />
                </div>
                <div class="overview-info">
                  <div class="overview-value">{{ ticketStats.unused }}</div>
                  <div class="overview-label">未使用</div>
                </div>
              </div>
            </a-col>
            <a-col :span="8">
              <div class="overview-card">
                <div class="overview-icon">
                  <CheckCircleOutlined style="color: #52c41a; font-size: 32px" />
                </div>
                <div class="overview-info">
                  <div class="overview-value">{{ ticketStats.used }}</div>
                  <div class="overview-label">已使用</div>
                </div>
              </div>
            </a-col>
            <a-col :span="8">
              <div class="overview-card">
                <div class="overview-icon">
                  <ShoppingOutlined style="color: #faad14; font-size: 32px" />
                </div>
                <div class="overview-info">
                  <div class="overview-value">¥{{ ticketStats.totalAmount }}</div>
                  <div class="overview-label">累计消费</div>
                </div>
              </div>
            </a-col>
          </a-row>
        </a-card>
      </a-col>
    </a-row>

    <a-modal
      v-model:open="passwordModalVisible"
      title="修改密码"
      :width="450"
      @ok="handleChangePassword"
      ok-text="确认修改"
      cancel-text="取消"
      :confirm-loading="passwordLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="原密码" required>
          <a-input-password v-model:value="passwordForm.oldPassword" placeholder="请输入原密码" />
        </a-form-item>
        <a-form-item label="新密码" required>
          <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item label="确认新密码" required>
          <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getCurrentUser, updateProfile, changePassword } from '@/api/auth'
import { getMyCards } from '@/api/annualCard'
import { getTicketOrders } from '@/api/ticket'
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CreditCardOutlined,
  WarningOutlined,
  DollarOutlined,
  TicketOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
} from '@ant-design/icons-vue'

const userInfo = ref({})
const editing = ref(false)
const submitLoading = ref(false)
const passwordLoading = ref(false)
const passwordModalVisible = ref(false)

const myCardsCount = ref(0)
const myTicketsCount = ref(0)

const cardStats = ref({
  active: 0,
  expiring: 0,
  totalBalance: 0,
})

const ticketStats = ref({
  unused: 0,
  used: 0,
  totalAmount: 0,
})

const editForm = reactive({
  username: '',
  realName: '',
  phone: '',
  email: '',
  idCard: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const roleMap = {
  admin: '管理员',
  operator: '操作员',
  cashier: '收银员',
  member: '会员',
}

const roleColors = {
  admin: 'purple',
  operator: 'blue',
  cashier: 'cyan',
  member: 'green',
}

const extraButton = computed(() => (
  editing.value
    ? [
        <a-button key="save" type="primary" loading={submitLoading.value} onClick={handleSave}>
          <SaveOutlined />
          保存
        </a-button>,
        <a-button key="cancel" onClick={handleCancelEdit}>
          <CloseOutlined />
          取消
        </a-button>,
      ]
    : [
        <a-button key="edit" type="primary" onClick={handleEdit}>
          <EditOutlined />
          编辑
        </a-button>,
        <a-button key="password" onClick={openPasswordModal}>
          修改密码
        </a-button>,
      ]
))

const loadUserInfo = async () => {
  try {
    const result = await getCurrentUser()
    userInfo.value = result
    editForm.username = result.username
    editForm.realName = result.realName || ''
    editForm.phone = result.phone || ''
    editForm.email = result.email || ''
    editForm.idCard = result.idCard || ''
  } catch (e) {
    // ignore
  }
}

const loadMyCards = async () => {
  try {
    const result = await getMyCards()
    const list = result.list || result || []
    myCardsCount.value = list.length
    cardStats.value.active = list.filter((c) => c.status === 'active').length
    cardStats.value.expiring = list.filter((c) => {
      if (!c.expireDate) return false
      const days = dayjs(c.expireDate).diff(dayjs(), 'day')
      return days > 0 && days <= 30
    }).length
    cardStats.value.totalBalance = list.reduce((sum, c) => sum + (c.balance || 0), 0).toFixed(2)
  } catch (e) {
    // ignore
  }
}

const loadMyTickets = async () => {
  try {
    const result = await getTicketOrders({ pageSize: 100 })
    const list = result.list || result || []
    myTicketsCount.value = result.total || list.length
    ticketStats.value.unused = list.filter((t) => t.status === 'paid').length
    ticketStats.value.used = list.filter((t) => t.status === 'used').length
    ticketStats.value.totalAmount = list.reduce((sum, t) => sum + (t.actualAmount || 0), 0).toFixed(2)
  } catch (e) {
    // ignore
  }
}

const handleEdit = () => {
  editing.value = true
}

const handleCancelEdit = () => {
  editForm.username = userInfo.value.username
  editForm.realName = userInfo.value.realName || ''
  editForm.phone = userInfo.value.phone || ''
  editForm.email = userInfo.value.email || ''
  editForm.idCard = userInfo.value.idCard || ''
  editing.value = false
}

const handleSave = async () => {
  submitLoading.value = true
  try {
    const result = await updateProfile({
      realName: editForm.realName,
      phone: editForm.phone,
      email: editForm.email,
      idCard: editForm.idCard,
    })
    userInfo.value = { ...userInfo.value, ...result }
    message.success('保存成功')
    editing.value = false
  } catch (e) {
    // ignore
  } finally {
    submitLoading.value = false
  }
}

const openPasswordModal = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordModalVisible.value = true
}

const handleChangePassword = async () => {
  if (!passwordForm.oldPassword) {
    message.warning('请输入原密码')
    return
  }
  if (!passwordForm.newPassword) {
    message.warning('请输入新密码')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    message.warning('两次输入的新密码不一致')
    return
  }
  passwordLoading.value = true
  try {
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    message.success('密码修改成功')
    passwordModalVisible.value = false
  } catch (e) {
    // ignore
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  loadUserInfo()
  loadMyCards()
  loadMyTickets()
})
</script>

<style scoped>
.profile-page {
  padding: 0;
}

.profile-card {
  text-align: center;
}

.avatar-section {
  padding: 20px 0;

  .username {
    margin: 12px 0 8px;
    font-size: 20px;
    font-weight: 600;
  }

  .role-tag {
    margin: 0;
  }
}

.profile-stats {
  padding: 10px 0;

  .stat-item {
    text-align: center;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 13px;
    color: #6b7280;
  }
}

.overview-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;

  .overview-icon {
    margin-right: 16px;
  }

  .overview-value {
    font-size: 22px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .overview-label {
    font-size: 13px;
    color: #6b7280;
  }
}
</style>
