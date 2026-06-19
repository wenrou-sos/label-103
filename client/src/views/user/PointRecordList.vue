<template>
  <div class="point-record-list">
    <div class="table-toolbar">
      <div class="filter-bar">
        <a-select
          v-model:value="filters.type"
          placeholder="类型筛选"
          style="width: 150px"
          allow-clear
          @change="handleFilterChange"
        >
          <a-select-option value="earn">获取</a-select-option>
          <a-select-option value="spend">消费</a-select-option>
          <a-select-option value="refund">退款</a-select-option>
          <a-select-option value="adjust">调整</a-select-option>
        </a-select>
        <a-range-picker
          v-model:value="filters.dateRange"
          style="width: 280px"
          @change="handleFilterChange"
        />
        <a-input-search
          v-model:value="filters.keyword"
          placeholder="搜索用户名/姓名/手机号"
          style="width: 280px"
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
        <template v-if="column.key === 'userInfo'">
          <div class="user-info">
            <div class="username">{{ record.user?.username || '-' }}</div>
            <div class="real-name">{{ record.user?.realName || '-' }}</div>
          </div>
        </template>
        <template v-else-if="column.key === 'points'">
          <span :class="record.points >= 0 ? 'points-positive' : 'points-negative'">
            {{ record.points >= 0 ? '+' : '' }}{{ record.points }}
          </span>
        </template>
        <template v-else-if="column.key === 'type'">
          <a-tag :color="typeColors[record.type]">
            {{ typeMap[record.type] }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'sourceType'">
          {{ record.sourceType || '-' }}
        </template>
        <template v-else-if="column.key === 'description'">
          <span :title="record.description">{{ record.description || '-' }}</span>
        </template>
        <template v-else-if="column.key === 'balance'">
          {{ record.balance ?? 0 }}
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ record.createdAt ? dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-' }}
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getPointRecords } from '@/api/point'
import dayjs from 'dayjs'

const loading = ref(false)

const data = ref({
  list: [],
  total: 0,
  page: 1,
  pageSize: 20,
})

const filters = reactive({
  type: undefined,
  dateRange: [],
  keyword: '',
})

const typeMap = {
  earn: '获取',
  spend: '消费',
  refund: '退款',
  adjust: '调整',
}

const typeColors = {
  earn: 'green',
  spend: 'red',
  refund: 'orange',
  adjust: 'blue',
}

const columns = [
  { title: '用户信息', key: 'userInfo', width: 160 },
  { title: '积分变动', key: 'points', width: 120 },
  { title: '变动类型', key: 'type', width: 100 },
  { title: '来源类型', dataIndex: 'sourceType', key: 'sourceType', width: 120 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '变动后余额', key: 'balance', width: 120 },
  { title: '操作时间', key: 'createdAt', width: 180 },
]

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: data.value.page,
      pageSize: data.value.pageSize,
      type: filters.type,
      keyword: filters.keyword,
    }
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startDate = dayjs(filters.dateRange[0]).format('YYYY-MM-DD')
      params.endDate = dayjs(filters.dateRange[1]).format('YYYY-MM-DD')
    }
    const result = await getPointRecords(params)
    data.value = result
  } catch (e) {
    // ignore
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  data.value.page = 1
  loadData()
}

const handlePageChange = (page, pageSize) => {
  data.value.page = page
  data.value.pageSize = pageSize
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.point-record-list {
  padding: 0;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.real-name {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.points-positive {
  color: #52c41a;
  font-weight: 500;
}

.points-negative {
  color: #f5222d;
  font-weight: 500;
}
</style>
