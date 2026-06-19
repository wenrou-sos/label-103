<template>
  <div class="visitor-list">
    <div class="table-toolbar">
      <div class="filter-bar">
        <a-select
          v-model:value="filters.type"
          placeholder="游客类型"
          style="width: 140px"
          allow-clear
          @change="loadData"
        >
          <a-select-option value="ticket">门票</a-select-option>
          <a-select-option value="annual_card">年卡</a-select-option>
          <a-select-option value="staff">员工</a-select-option>
          <a-select-option value="guest">嘉宾</a-select-option>
        </a-select>
        <a-select
          v-model:value="filters.isInPark"
          placeholder="在园状态"
          style="width: 140px"
          allow-clear
          @change="loadData"
        >
          <a-select-option :value="true">在园</a-select-option>
          <a-select-option :value="false">已离园</a-select-option>
        </a-select>
        <a-range-picker v-model:value="dateRange" @change="loadData" />
        <a-input-search
          v-model:value="filters.keyword"
          placeholder="搜索姓名/身份证/手环ID"
          style="width: 280px"
          @search="loadData"
        />
      </div>
      <div>
        <a-button type="primary" @click="handleRefresh">
          <ReloadOutlined />
          刷新
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
        <template v-if="column.key === 'visitorName'">
          {{ record.visitorName || '-' }}
        </template>
        <template v-else-if="column.key === 'visitorType'">
          <a-tag :color="typeColors[record.visitorType]">
            {{ typeMap[record.visitorType] }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'entryTime'">
          {{ formatDateTime(record.entryTime) }}
        </template>
        <template v-else-if="column.key === 'exitTime'">
          {{ formatDateTime(record.exitTime) }}
        </template>
        <template v-else-if="column.key === 'inPark'">
          <a-tag :color="record.isInPark ? 'green' : 'default'">
            {{ record.isInPark ? '在园' : '已离园' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'gate'">
          {{ record.entryGate || '-' }}
        </template>
        <template v-else-if="column.key === 'isFastPass'">
          <a-tag v-if="record.isFastPass" color="purple">快速通道</a-tag>
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="viewDetail(record)">详情</a-button>
          <a-button
            v-if="record.isInPark"
            type="link"
            size="small"
            danger
            @click="handleExit(record)"
          >
            出园登记
          </a-button>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="detailModalVisible"
      title="游客详情"
      :width="600"
      :footer="null"
    >
      <a-descriptions v-if="currentRecord" :column="2" bordered size="small">
        <a-descriptions-item label="游客姓名">{{ currentRecord.visitorName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="游客类型">
          <a-tag :color="typeColors[currentRecord.visitorType]">
            {{ typeMap[currentRecord.visitorType] }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="身份证号">{{ currentRecord.idCard || '-' }}</a-descriptions-item>
        <a-descriptions-item label="手环ID">{{ currentRecord.wristbandId || '-' }}</a-descriptions-item>
        <a-descriptions-item label="入园时间">{{ formatDateTime(currentRecord.entryTime) }}</a-descriptions-item>
        <a-descriptions-item label="出园时间">{{ formatDateTime(currentRecord.exitTime) }}</a-descriptions-item>
        <a-descriptions-item label="在园状态">
          <a-tag :color="currentRecord.isInPark ? 'green' : 'default'">
            {{ currentRecord.isInPark ? '在园' : '已离园' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="入园闸机">{{ currentRecord.entryGate || '-' }}</a-descriptions-item>
        <a-descriptions-item label="出园闸机">{{ currentRecord.exitGate || '-' }}</a-descriptions-item>
        <a-descriptions-item label="快速通道">
          <a-tag v-if="currentRecord.isFastPass" color="purple">是</a-tag>
          <span v-else>否</span>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { getVisitorRecords, visitorExit } from '@/api/visitor'
import dayjs from 'dayjs'
import { ReloadOutlined } from '@ant-design/icons-vue'

const loading = ref(false)

const data = ref({
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
})

const filters = reactive({
  type: undefined,
  isInPark: undefined,
  keyword: '',
})

const dateRange = ref([])

const detailModalVisible = ref(false)
const currentRecord = ref(null)

const typeMap = {
  ticket: '门票',
  annual_card: '年卡',
  staff: '员工',
  guest: '嘉宾',
}

const typeColors = {
  ticket: 'blue',
  annual_card: 'green',
  staff: 'orange',
  guest: 'purple',
}

const columns = [
  { title: '游客姓名', key: 'visitorName', width: 120 },
  { title: '游客类型', key: 'visitorType', width: 100 },
  { title: '入园时间', key: 'entryTime', width: 160 },
  { title: '出园时间', key: 'exitTime', width: 160 },
  { title: '在园状态', key: 'inPark', width: 100 },
  { title: '入园闸机', key: 'gate', width: 120 },
  { title: '快速通道', key: 'isFastPass', width: 100 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' },
]

const formatDateTime = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: data.value.page,
      pageSize: data.value.pageSize,
      type: filters.type,
      isInPark: filters.isInPark,
      keyword: filters.keyword,
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
      params.endDate = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    }
    const result = await getVisitorRecords(params)
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

const handleRefresh = () => {
  loadData()
}

const viewDetail = (record) => {
  currentRecord.value = record
  detailModalVisible.value = true
}

const handleExit = (record) => {
  Modal.confirm({
    title: '出园登记',
    content: `确定要为 ${record.visitorName || '该游客'} 办理出园登记吗？`,
    okText: '确认出园',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: async () => {
      try {
        await visitorExit(record.id)
        message.success('出园登记成功')
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
.table-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
