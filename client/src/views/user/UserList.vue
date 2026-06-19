<template>
  <div class="user-list">
    <div class="table-toolbar">
      <div class="filter-bar">
        <a-select
          v-model:value="filters.role"
          placeholder="角色筛选"
          style="width: 150px"
          allow-clear
          @change="loadData"
        >
          <a-select-option value="admin">管理员</a-select-option>
          <a-select-option value="operator">操作员</a-select-option>
          <a-select-option value="cashier">收银员</a-select-option>
          <a-select-option value="member">会员</a-select-option>
        </a-select>
        <a-select
          v-model:value="filters.status"
          placeholder="状态筛选"
          style="width: 150px"
          allow-clear
          @change="loadData"
        >
          <a-select-option value="active">正常</a-select-option>
          <a-select-option value="inactive">禁用</a-select-option>
        </a-select>
        <a-input-search
          v-model:value="filters.keyword"
          placeholder="搜索用户名/姓名/手机号"
          style="width: 280px"
          @search="loadData"
        />
      </div>
      <div>
        <a-button type="primary" @click="openAddModal">
          <PlusOutlined />
          新增用户
        </a-button>
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="data.list"
      :loading="loading"
      :pagination="{
        current: data.page,
        pageSize: data.pageSize,
        total: data.total,
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 条`,
        onChange: handlePageChange,
      }"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'role'">
          <a-tag :color="roleColors[record.role]">
            {{ roleMap[record.role] }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'red'">
            {{ record.status === 'active' ? '正常' : '禁用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ record.createdAt ? dayjs(record.createdAt).format('YYYY-MM-DD HH:mm') : '-' }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="openEditModal(record)">编辑</a-button>
          <a-button type="link" size="small" @click="openAdjustPointsModal(record)">调整积分</a-button>
          <a-button type="link" size="small" @click="openResetPasswordModal(record)">重置密码</a-button>
          <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      :width="600"
      @ok="handleSubmit"
      ok-text="确认"
      cancel-text="取消"
      :confirm-loading="submitLoading"
    >
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="用户名" required>
              <a-input v-model:value="form.username" placeholder="请输入用户名" :disabled="isEdit" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item v-if="!isEdit" label="密码" required>
              <a-input-password v-model:value="form.password" placeholder="请输入密码" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="真实姓名">
              <a-input v-model:value="form.realName" placeholder="请输入真实姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="角色" required>
              <a-select v-model:value="form.role" placeholder="请选择角色">
                <a-select-option value="admin">管理员</a-select-option>
                <a-select-option value="operator">操作员</a-select-option>
                <a-select-option value="cashier">收银员</a-select-option>
                <a-select-option value="member">会员</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="手机号">
              <a-input v-model:value="form.phone" placeholder="请输入手机号" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="邮箱">
              <a-input v-model:value="form.email" placeholder="请输入邮箱" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="身份证号">
          <a-input v-model:value="form.idCard" placeholder="请输入身份证号" />
        </a-form-item>
        <a-form-item label="状态">
          <a-radio-group v-model:value="form.status">
            <a-radio value="active">正常</a-radio>
            <a-radio value="inactive">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="resetPasswordModalVisible"
      title="重置密码"
      :width="400"
      @ok="handleResetPassword"
      ok-text="确认重置"
      cancel-text="取消"
      :confirm-loading="resetPasswordLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="用户名">
          <span>{{ currentUser?.username }}</span>
        </a-form-item>
        <a-form-item label="新密码" required>
          <a-input-password v-model:value="resetPasswordForm.newPassword" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item label="确认密码" required>
          <a-input-password v-model:value="resetPasswordForm.confirmPassword" placeholder="请再次输入新密码" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="adjustPointsModalVisible"
      title="调整积分"
      :width="400"
      @ok="handleAdjustPoints"
      ok-text="确认调整"
      cancel-text="取消"
      :confirm-loading="adjustPointsLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="用户名">
          <span>{{ currentUser?.username }}</span>
        </a-form-item>
        <a-form-item label="当前积分">
          <span class="points-balance">{{ currentUser?.points || 0 }} 积分</span>
        </a-form-item>
        <a-form-item label="调整类型" required>
          <a-radio-group v-model:value="adjustPointsForm.type">
            <a-radio value="increase">增加</a-radio>
            <a-radio value="decrease">减少</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="调整积分" required>
          <a-input-number
            v-model:value="adjustPointsForm.points"
            :min="1"
            :precision="0"
            style="width: 100%"
            placeholder="请输入积分数"
          />
        </a-form-item>
        <a-form-item label="调整原因">
          <a-textarea
            v-model:value="adjustPointsForm.remarks"
            :rows="2"
            placeholder="请输入调整原因（可选）"
          />
        </a-form-item>
        <a-form-item label="调整后积分">
          <span class="points-balance">{{ adjustedPoints }} 积分</span>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
} from '@/api/user'
import { adjustPoints } from '@/api/point'
import dayjs from 'dayjs'
import { PlusOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const submitLoading = ref(false)
const resetPasswordLoading = ref(false)
const adjustPointsLoading = ref(false)
const isEdit = ref(false)
const modalVisible = ref(false)
const resetPasswordModalVisible = ref(false)
const adjustPointsModalVisible = ref(false)
const currentId = ref(null)
const currentUser = ref(null)

const data = ref({
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
})

const filters = reactive({
  role: undefined,
  status: undefined,
  keyword: '',
})

const form = reactive({
  username: '',
  password: '',
  realName: '',
  phone: '',
  email: '',
  idCard: '',
  role: 'member',
  status: 'active',
})

const resetPasswordForm = reactive({
  newPassword: '',
  confirmPassword: '',
})

const adjustPointsForm = reactive({
  type: 'increase',
  points: null,
  remarks: '',
})

const adjustedPoints = computed(() => {
  const current = currentUser.value?.points || 0
  const points = adjustPointsForm.points || 0
  if (adjustPointsForm.type === 'increase') {
    return current + points
  } else {
    return Math.max(0, current - points)
  }
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

const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
  { title: '真实姓名', dataIndex: 'realName', key: 'realName', width: 100 },
  { title: '角色', key: 'role', width: 100 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 160, ellipsis: true },
  { title: '积分', dataIndex: 'points', key: 'points', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '注册时间', key: 'createdAt', width: 160 },
  { title: '操作', key: 'action', width: 260, fixed: 'right' },
]

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: data.value.page,
      pageSize: data.value.pageSize,
      role: filters.role,
      status: filters.status,
      keyword: filters.keyword,
    }
    const result = await getUsers(params)
    data.value = result
  } catch (e) {
    // ignore
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page, pageSize) => {
  data.value.page = page
  data.value.pageSize = pageSize
  loadData()
}

const resetForm = () => {
  form.username = ''
  form.password = ''
  form.realName = ''
  form.phone = ''
  form.email = ''
  form.idCard = ''
  form.role = 'member'
  form.status = 'active'
}

const openAddModal = () => {
  isEdit.value = false
  currentId.value = null
  resetForm()
  modalVisible.value = true
}

const openEditModal = (record) => {
  isEdit.value = true
  currentId.value = record.id
  form.username = record.username
  form.password = ''
  form.realName = record.realName || ''
  form.phone = record.phone || ''
  form.email = record.email || ''
  form.idCard = record.idCard || ''
  form.role = record.role
  form.status = record.status
  modalVisible.value = true
}

const openResetPasswordModal = (record) => {
  currentUser.value = record
  resetPasswordForm.newPassword = ''
  resetPasswordForm.confirmPassword = ''
  resetPasswordModalVisible.value = true
}

const openAdjustPointsModal = (record) => {
  currentUser.value = record
  adjustPointsForm.type = 'increase'
  adjustPointsForm.points = null
  adjustPointsForm.remarks = ''
  adjustPointsModalVisible.value = true
}

const handleAdjustPoints = async () => {
  if (!adjustPointsForm.points || adjustPointsForm.points <= 0) {
    message.warning('请输入调整积分数量')
    return
  }
  adjustPointsLoading.value = true
  try {
    const points = adjustPointsForm.type === 'increase'
      ? adjustPointsForm.points
      : -adjustPointsForm.points
    await adjustPoints({
      userId: currentUser.value.id,
      points,
      type: 'adjust',
      remarks: adjustPointsForm.remarks,
    })
    message.success('积分调整成功')
    adjustPointsModalVisible.value = false
    loadData()
  } catch (e) {
    // ignore
  } finally {
    adjustPointsLoading.value = false
  }
}

const validateForm = () => {
  if (!form.username.trim()) {
    message.warning('请输入用户名')
    return false
  }
  if (!isEdit.value && !form.password) {
    message.warning('请输入密码')
    return false
  }
  if (!form.role) {
    message.warning('请选择角色')
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return
  submitLoading.value = true
  try {
    const submitData = {
      username: form.username,
      realName: form.realName,
      phone: form.phone,
      email: form.email,
      idCard: form.idCard,
      role: form.role,
      status: form.status,
    }
    if (!isEdit.value) {
      submitData.password = form.password
    }
    if (isEdit.value) {
      await updateUser(currentId.value, submitData)
      message.success('编辑成功')
    } else {
      await createUser(submitData)
      message.success('新增成功')
    }
    modalVisible.value = false
    loadData()
  } catch (e) {
    // ignore
  } finally {
    submitLoading.value = false
  }
}

const handleResetPassword = async () => {
  if (!resetPasswordForm.newPassword) {
    message.warning('请输入新密码')
    return
  }
  if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
    message.warning('两次输入的密码不一致')
    return
  }
  resetPasswordLoading.value = true
  try {
    await resetPassword(currentUser.value.id, {
      newPassword: resetPasswordForm.newPassword,
    })
    message.success('密码重置成功')
    resetPasswordModalVisible.value = false
  } catch (e) {
    // ignore
  } finally {
    resetPasswordLoading.value = false
  }
}

const handleDelete = (record) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除用户 "${record.username}" 吗？`,
    okText: '确定删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: async () => {
      try {
        await deleteUser(record.id)
        message.success('删除成功')
        loadData()
      } catch (e) {
        // ignore
      }
    },
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.user-list {
  padding: 0;
}

.points-balance {
  font-size: 16px;
  font-weight: 600;
  color: #faad14;
}
</style>
