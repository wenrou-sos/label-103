<template>
  <div class="audit-log-list">
    <div class="table-toolbar">
      <div class="filter-bar">
        <a-range-picker
          v-model:value="filters.dateRange"
          style="width: 260px"
          :placeholder="['开始日期', '结束日期']"
          @change="handleFilterChange"
        />
        <a-select
          v-model:value="filters.module"
          placeholder="模块筛选"
          style="width: 160px"
          allow-clear
          @change="handleFilterChange"
        >
          <a-select-option
            v-for="item in moduleOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </a-select-option>
        </a-select>
        <a-select
          v-model:value="filters.action"
          placeholder="操作类型"
          style="width: 160px"
          allow-clear
          @change="handleFilterChange"
        >
          <a-select-option
            v-for="item in actionOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </a-select-option>
        </a-select>
        <a-select
          v-model:value="filters.userId"
          placeholder="操作者"
          style="width: 160px"
          allow-clear
          show-search
          :filter-option="filterUserOption"
          @change="handleFilterChange"
        >
          <a-select-option
            v-for="user in userOptions"
            :key="user.id"
            :value="user.id"
          >
            {{ user.realName || user.username }}
          </a-select-option>
        </a-select>
        <a-input-search
          v-model:value="filters.keyword"
          placeholder="搜索描述/目标ID"
          style="width: 260px"
          allow-clear
          @search="handleFilterChange"
        />
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
        <template v-if="column.key === 'operator'">
          <div>
            <div class="operator-name">{{ record.realName || record.username || '-' }}</div>
            <div class="operator-sub">
              <a-tag :color="roleColors[record.role]" size="small">
                {{ roleMap[record.role] || record.role }}
              </a-tag>
            </div>
          </div>
        </template>
        <template v-else-if="column.key === 'module'">
          <span>{{ moduleMap[record.module] || record.module }}</span>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-tag :color="actionColors[record.action]">
            {{ actionMap[record.action] || record.action }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'description'">
          <a-tooltip :title="record.description">
            <span class="description-text">{{ record.description || '-' }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.key === 'ip'">
          <span class="ip-text">{{ record.ip || '-' }}</span>
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ record.createdAt ? dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-' }}
        </template>
        <template v-else-if="column.key === 'action_col'">
          <a-button type="link" size="small" @click="showDetail(record)">详情</a-button>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="detailVisible"
      title="操作日志详情"
      :width="720"
      :footer="null"
    >
      <a-descriptions v-if="currentLog" bordered :column="2" size="small">
        <a-descriptions-item label="操作时间" :span="2">
          {{ currentLog.createdAt ? dayjs(currentLog.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="操作人">
          {{ currentLog.realName || currentLog.username || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="角色">
          {{ roleMap[currentLog.role] || currentLog.role }}
        </a-descriptions-item>
        <a-descriptions-item label="操作模块">
          {{ moduleMap[currentLog.module] || currentLog.module }}
        </a-descriptions-item>
        <a-descriptions-item label="操作类型">
          {{ actionMap[currentLog.action] || currentLog.action }}
        </a-descriptions-item>
        <a-descriptions-item label="IP地址">
          {{ currentLog.ip || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="目标ID">
          {{ currentLog.targetId || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="操作描述" :span="2">
          {{ currentLog.description || '-' }}
        </a-descriptions-item>
        <a-descriptions-item v-if="currentLog.oldData" label="修改前数据" :span="2">
          <pre class="json-preview">{{ JSON.stringify(currentLog.oldData, null, 2) }}</pre>
        </a-descriptions-item>
        <a-descriptions-item v-if="currentLog.newData" label="修改后数据" :span="2">
          <pre class="json-preview">{{ JSON.stringify(currentLog.newData, null, 2) }}</pre>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  getAuditLogs,
  getAuditModules,
  getAuditActions,
} from '@/api/audit'
import { getUsers } from '@/api/user'
import dayjs from 'dayjs'

const loading = ref(false)
const detailVisible = ref(false)
const currentLog = ref(null)
const moduleOptions = ref([])
const actionOptions = ref([])
const userOptions = ref([])

const data = ref({
  list: [],
  total: 0,
  page: 1,
  pageSize: 20,
})

const filters = reactive({
  dateRange: undefined,
  module: undefined,
  action: undefined,
  userId: undefined,
  keyword: '',
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

const moduleMap = {}
const actionMap = {}

const actionColors = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  refund: 'orange',
  verify: 'cyan',
  reset_password: 'purple',
  login: 'geekblue',
  logout: 'default',
  change_status: 'gold',
}

const columns = [
  { title: '操作时间', key: 'createdAt', width: 170 },
  { title: '操作人', key: 'operator', width: 150 },
  { title: '模块', key: 'module', width: 110 },
  { title: '操作类型', key: 'action', width: 100 },
  { title: '操作描述', key: 'description', ellipsis: true },
  { title: 'IP地址', key: 'ip', width: 130 },
  { title: '操作', key: 'action_col', width: 80, fixed: 'right' },
]

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: data.value.page,
      pageSize: data.value.pageSize,
      module: filters.module,
      action: filters.action,
      userId: filters.userId,
      keyword: filters.keyword,
    }
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startDate = filters.dateRange[0].format('YYYY-MM-DD')
      params.endDate = filters.dateRange[1].format('YYYY-MM-DD')
    }
    const result = await getAuditLogs(params)
    data.value = result
  } catch (e) {
    // ignore
  } finally {
    loading.value = false
  }
}

const loadOptions = async () => {
  try {
    const [modules, actions, users] = await Promise.all([
      getAuditModules(),
      getAuditActions(),
      getUsers({ pageSize: 100 }),
    ])
    moduleOptions.value = modules
    actionOptions.value = actions
    userOptions.value = users.list || []

    modules.forEach((m) => {
      moduleMap[m.value] = m.label
    })
    actions.forEach((a) => {
      actionMap[a.value] = a.label
    })
  } catch (e) {
    // ignore
  }
}

const handlePageChange = (page, pageSize) => {
  data.value.page = page
  data.value.pageSize = pageSize
  loadData()
}

const handleFilterChange = () => {
  data.value.page = 1
  loadData()
}

const showDetail = (record) => {
  currentLog.value = record
  detailVisible.value = true
}

const filterUserOption = (input, option) => {
  const text = option?.children?.[0] || ''
  return text.toLowerCase().includes(input.toLowerCase())
}

onMounted(() => {
  loadOptions()
  loadData()
})
</script>

<style scoped>
.audit-log-list {
  padding: 0;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.operator-name {
  font-weight: 500;
  color: #1f2937;
}

.operator-sub {
  margin-top: 4px;
}

.description-text {
  color: #374151;
}

.ip-text {
  font-family: 'Consolas', 'Monaco', monospace;
  color: #6b7280;
  font-size: 13px;
}

.json-preview {
  max-height: 300px;
  overflow: auto;
  background: #f9fafb;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
