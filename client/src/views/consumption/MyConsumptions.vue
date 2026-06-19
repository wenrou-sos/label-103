<template>
  <div class="my-consumptions-page">
    <a-card title="我的消费记录">
      <template #extra>
        <div class="filter-bar">
          <a-select
            v-model:value="filters.settlementStatus"
            placeholder="消费状态"
            style="width: 140px"
            allow-clear
            @change="loadData"
          >
            <a-select-option value="pending">待结算</a-select-option>
            <a-select-option value="settled">已结算</a-select-option>
            <a-select-option value="refunded">已退款</a-select-option>
          </a-select>
          <a-range-picker v-model:value="dateRange" style="width: 260px" @change="loadData" />
        </div>
      </template>

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
          <template v-if="column.key === 'consumptionNo'">
            {{ record.orderNo }}
          </template>
          <template v-else-if="column.key === 'category'">
            <a-tag :color="categoryColors[record.category] || 'blue'">
              {{ categoryMap[record.category] || record.category }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'amount'">
            <span class="price-amount">¥{{ record.totalAmount?.toFixed(2) }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColors[record.settlementStatus]">
              {{ statusMap[record.settlementStatus] }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ record.createdAt ? dayjs(record.createdAt).format('YYYY-MM-DD HH:mm') : '-' }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="viewDetail(record)">查看详情</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="detailModalVisible"
      title="消费详情"
      :width="600"
      :footer="null"
    >
      <a-descriptions v-if="currentConsumption" :column="2" bordered size="small">
        <a-descriptions-item label="消费单号">{{ currentConsumption.orderNo }}</a-descriptions-item>
        <a-descriptions-item label="消费类别">
          {{ categoryMap[currentConsumption.category] || currentConsumption.category }}
        </a-descriptions-item>
        <a-descriptions-item label="消费金额">
          <span class="price-amount">¥{{ currentConsumption.totalAmount?.toFixed(2) }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="statusColors[currentConsumption.settlementStatus]">
            {{ statusMap[currentConsumption.settlementStatus] }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="消费时间" :span="2">
          {{ currentConsumption.createdAt ? dayjs(currentConsumption.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="结算时间" :span="2">
          {{ currentConsumption.settledAt ? dayjs(currentConsumption.settledAt).format('YYYY-MM-DD HH:mm:ss') : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="支付方式">
          {{ paymentMap[currentConsumption.paymentMethod] || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="关联年卡">
          {{ currentConsumption.AnnualCard?.cardNo || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="消费项目" :span="2">
          {{ currentConsumption.items || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="商户名称">
          {{ currentConsumption.merchantName || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="位置">
          {{ currentConsumption.location || '-' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getMyConsumptions, getConsumptionDetail } from '@/api/consumption'
import dayjs from 'dayjs'

const loading = ref(false)

const data = ref({
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
})

const filters = reactive({
  settlementStatus: undefined,
})

const dateRange = ref([])
const detailModalVisible = ref(false)
const currentConsumption = ref(null)

const statusMap = {
  pending: '待结算',
  settled: '已结算',
  refunded: '已退款',
}

const statusColors = {
  pending: 'orange',
  settled: 'green',
  refunded: 'red',
}

const categoryMap = {
  shop: '商店',
  restaurant: '餐饮',
  attraction: '游乐项目',
  other: '其他',
}

const categoryColors = {
  shop: 'blue',
  restaurant: 'orange',
  attraction: 'green',
  other: 'default',
}

const paymentMap = {
  wristband: '手环',
  qrcode: '扫码',
  cash: '现金',
  annual_card: '年卡扣费',
}

const columns = [
  { title: '消费单号', dataIndex: 'orderNo', key: 'consumptionNo', width: 180 },
  { title: '消费类别', key: 'category', width: 100 },
  { title: '消费项目', dataIndex: 'items', key: 'items', ellipsis: true },
  { title: '消费金额', key: 'amount', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '消费时间', key: 'createdAt', width: 160 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
]

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: data.value.page,
      pageSize: data.value.pageSize,
      settlementStatus: filters.settlementStatus,
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
      params.endDate = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    }
    const result = await getMyConsumptions(params)
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

const viewDetail = async (record) => {
  try {
    const result = await getConsumptionDetail(record.id)
    currentConsumption.value = result
    detailModalVisible.value = true
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.my-consumptions-page {
  padding: 0;
}

.filter-bar {
  display: flex;
  gap: 12px;
}

.price-amount {
  color: #f5222d;
  font-weight: 600;
}
</style>
