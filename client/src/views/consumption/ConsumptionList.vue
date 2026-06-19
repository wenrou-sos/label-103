<template>
  <div class="consumption-list">
    <div class="table-toolbar">
      <div class="filter-bar">
        <a-select
          v-model:value="filters.category"
          placeholder="消费类型"
          style="width: 140px"
          allow-clear
          @change="loadData"
        >
          <a-select-option value="shop">商店</a-select-option>
          <a-select-option value="restaurant">餐饮</a-select-option>
          <a-select-option value="attraction">游乐项目</a-select-option>
          <a-select-option value="other">其他</a-select-option>
        </a-select>
        <a-select
          v-model:value="filters.paymentMethod"
          placeholder="支付方式"
          style="width: 140px"
          allow-clear
          @change="loadData"
        >
          <a-select-option value="wristband">手环</a-select-option>
          <a-select-option value="qrcode">扫码</a-select-option>
          <a-select-option value="cash">现金</a-select-option>
          <a-select-option value="annual_card">年卡扣款</a-select-option>
        </a-select>
        <a-select
          v-model:value="filters.settlementStatus"
          placeholder="结算状态"
          style="width: 140px"
          allow-clear
          @change="loadData"
        >
          <a-select-option value="pending">未结算</a-select-option>
          <a-select-option value="settled">已结算</a-select-option>
          <a-select-option value="refunded">已退款</a-select-option>
        </a-select>
        <a-range-picker v-model:value="dateRange" @change="loadData" />
        <a-input-search
          v-model:value="filters.keyword"
          placeholder="搜索订单号/商户名称/手环ID"
          style="width: 280px"
          @search="loadData"
        />
      </div>
      <div>
        <a-button type="primary" @click="openCreateModal">
          <PlusOutlined />
          新增消费
        </a-button>
        <a-button @click="openSettleModal">
          <CreditCardOutlined />
          手环结算
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
        <template v-if="column.key === 'type'">
          <a-tag :color="typeColors[record.category]">
            {{ typeMap[record.category] }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'amount'">
          <span>¥{{ record.totalAmount?.toFixed(2) }}</span>
        </template>
        <template v-else-if="column.key === 'discount'">
          <span v-if="record.discountAmount">¥{{ record.discountAmount?.toFixed(2) }}</span>
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'actualAmount'">
          <span class="price-amount">¥{{ record.actualAmount?.toFixed(2) }}</span>
        </template>
        <template v-else-if="column.key === 'paymentMethod'">
          {{ paymentMap[record.paymentMethod] || '-' }}
        </template>
        <template v-else-if="column.key === 'settleStatus'">
          <a-tag :color="settleColors[record.settlementStatus]">
            {{ settleMap[record.settlementStatus] }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'consumedAt'">
          {{ formatDateTime(record.createdAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="viewDetail(record)">详情</a-button>
          <a-button
            v-if="record.settlementStatus === 'pending'"
            type="link"
            size="small"
            @click="handleSettle(record)"
          >
            结算
          </a-button>
          <a-button
            v-if="record.settlementStatus === 'settled'"
            type="link"
            size="small"
            danger
            @click="handleRefund(record)"
          >
            退款
          </a-button>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="createModalVisible"
      title="新增消费"
      :width="600"
      @ok="handleCreate"
      ok-text="确认新增"
      cancel-text="取消"
      :confirm-loading="createLoading"
    >
      <a-form :model="createForm" layout="vertical">
        <a-form-item label="卡ID/手环ID">
          <a-input v-model:value="createForm.wristbandId" placeholder="请输入手环ID或卡号" />
        </a-form-item>
        <a-form-item label="消费类型">
          <a-select v-model:value="createForm.category" style="width: 100%">
            <a-select-option value="shop">商店</a-select-option>
            <a-select-option value="restaurant">餐饮</a-select-option>
            <a-select-option value="attraction">游乐项目</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="商户名称">
          <a-input v-model:value="createForm.merchantName" placeholder="请输入商户名称" />
        </a-form-item>
        <a-form-item label="消费项目明细">
          <a-textarea
            v-model:value="createForm.items"
            :rows="4"
            placeholder="请输入消费项目明细，每行一个项目"
          />
        </a-form-item>
        <a-form-item label="总金额">
          <a-input-number
            v-model:value="createForm.amount"
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="请输入总金额"
          />
        </a-form-item>
        <a-form-item label="支付方式">
          <a-select v-model:value="createForm.paymentMethod" style="width: 100%">
            <a-select-option value="wristband">手环</a-select-option>
            <a-select-option value="qrcode">扫码</a-select-option>
            <a-select-option value="cash">现金</a-select-option>
            <a-select-option value="annual_card">年卡扣款</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="settleModalVisible"
      title="手环结算"
      :width="500"
      @ok="handleSettleByWristband"
      ok-text="确认结算"
      cancel-text="取消"
      :confirm-loading="settleLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="手环ID">
          <a-input v-model:value="settleForm.wristbandId" placeholder="请输入手环ID" />
        </a-form-item>
      </a-form>
      <div v-if="settleSummary" class="settle-summary">
        <a-divider />
        <div class="summary-item">
          <span>待结算笔数：</span>
          <span>{{ settleSummary.count }} 笔</span>
        </div>
        <div class="summary-item total">
          <span>待结算金额：</span>
          <span class="price-amount">¥{{ settleSummary.totalAmount?.toFixed(2) }}</span>
        </div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="detailModalVisible"
      title="消费详情"
      :width="600"
      :footer="null"
    >
      <a-descriptions v-if="currentRecord" :column="2" bordered size="small">
        <a-descriptions-item label="订单号">{{ currentRecord.orderNo }}</a-descriptions-item>
        <a-descriptions-item label="消费类型">
          <a-tag :color="typeColors[currentRecord.category]">
            {{ typeMap[currentRecord.category] }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="商户名称">{{ currentRecord.merchantName }}</a-descriptions-item>
        <a-descriptions-item label="位置">{{ currentRecord.location || '-' }}</a-descriptions-item>
        <a-descriptions-item label="总金额">¥{{ currentRecord.totalAmount?.toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item label="优惠金额">¥{{ currentRecord.discountAmount?.toFixed(2) || '-' }}</a-descriptions-item>
        <a-descriptions-item label="会员折扣">
          {{ currentRecord.memberDiscount ? (currentRecord.memberDiscount * 10).toFixed(1) + '折' : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="实付金额">
          <span class="price-amount">¥{{ currentRecord.actualAmount?.toFixed(2) }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="支付方式">
          {{ paymentMap[currentRecord.paymentMethod] || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="结算状态">
          <a-tag :color="settleColors[currentRecord.settlementStatus]">
            {{ settleMap[currentRecord.settlementStatus] }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="消费时间">
          {{ formatDateTime(currentRecord.createdAt) }}
        </a-descriptions-item>
        <a-descriptions-item label="消费项目明细" :span="2">
          <pre style="white-space: pre-wrap; margin: 0;">{{ currentRecord.items || '-' }}</pre>
        </a-descriptions-item>
        <a-descriptions-item label="结算时间" :span="2">
          {{ currentRecord.settledAt ? formatDateTime(currentRecord.settledAt) : '-' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  getConsumptionRecords,
  createConsumption,
  settleConsumption,
  settleByWristband,
  refundConsumption,
  getConsumptionDetail,
} from '@/api/consumption'
import dayjs from 'dayjs'
import {
  PlusOutlined,
  CreditCardOutlined,
} from '@ant-design/icons-vue'

const loading = ref(false)
const createLoading = ref(false)
const settleLoading = ref(false)

const data = ref({
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
})

const filters = reactive({
  category: undefined,
  paymentMethod: undefined,
  settlementStatus: undefined,
  keyword: '',
})

const dateRange = ref([])

const createModalVisible = ref(false)
const settleModalVisible = ref(false)
const detailModalVisible = ref(false)
const currentRecord = ref(null)

const createForm = reactive({
  wristbandId: '',
  category: undefined,
  merchantName: '',
  items: '',
  totalAmount: 0,
  paymentMethod: 'wristband',
})

const settleForm = reactive({
  wristbandId: '',
})

const settleSummary = ref(null)

const typeMap = {
  shop: '商店',
  restaurant: '餐饮',
  attraction: '游乐项目',
  other: '其他',
}

const typeColors = {
  shop: 'blue',
  restaurant: 'orange',
  attraction: 'green',
  other: 'default',
}

const paymentMap = {
  wristband: '手环',
  qrcode: '扫码',
  cash: '现金',
  annual_card: '年卡扣款',
}

const settleMap = {
  pending: '未结算',
  settled: '已结算',
  refunded: '已退款',
}

const settleColors = {
  pending: 'orange',
  settled: 'green',
  refunded: 'red',
}

const columns = [
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
  { title: '消费类型', key: 'type', width: 100 },
  { title: '商户名称', dataIndex: 'merchantName', key: 'merchantName', width: 140 },
  { title: '金额', key: 'amount', width: 100 },
  { title: '优惠', key: 'discount', width: 100 },
  { title: '实付', key: 'actualAmount', width: 100 },
  { title: '支付方式', key: 'paymentMethod', width: 100 },
  { title: '结算状态', key: 'settleStatus', width: 100 },
  { title: '消费时间', key: 'consumedAt', width: 160 },
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
      category: filters.category,
      paymentMethod: filters.paymentMethod,
      settlementStatus: filters.settlementStatus,
      keyword: filters.keyword,
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
      params.endDate = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    }
    const result = await getConsumptionRecords(params)
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

const openCreateModal = () => {
  createForm.wristbandId = ''
  createForm.category = undefined
  createForm.merchantName = ''
  createForm.items = ''
  createForm.totalAmount = 0
  createForm.paymentMethod = 'wristband'
  createModalVisible.value = true
}

const handleCreate = async () => {
  if (!createForm.wristbandId && createForm.paymentMethod === 'wristband') {
    message.warning('请输入手环ID')
    return
  }
  if (!createForm.category) {
    message.warning('请选择消费类型')
    return
  }
  if (!createForm.merchantName) {
    message.warning('请输入商户名称')
    return
  }
  if (!createForm.totalAmount || createForm.totalAmount <= 0) {
    message.warning('请输入有效金额')
    return
  }
  createLoading.value = true
  try {
    await createConsumption({
      wristbandId: createForm.wristbandId,
      category: createForm.category,
      merchantName: createForm.merchantName,
      items: createForm.items,
      totalAmount: createForm.totalAmount,
      paymentMethod: createForm.paymentMethod,
    })
    message.success('新增消费成功')
    createModalVisible.value = false
    loadData()
  } catch (e) {
    // ignore
  } finally {
    createLoading.value = false
  }
}

const openSettleModal = () => {
  settleForm.wristbandId = ''
  settleSummary.value = null
  settleModalVisible.value = true
}

const handleSettleByWristband = async () => {
  if (!settleForm.wristbandId) {
    message.warning('请输入手环ID')
    return
  }
  settleLoading.value = true
  try {
    await settleByWristband({
      wristbandId: settleForm.wristbandId,
    })
    message.success('结算成功')
    settleModalVisible.value = false
    loadData()
  } catch (e) {
    // ignore
  } finally {
    settleLoading.value = false
  }
}

const viewDetail = async (record) => {
  try {
    const detail = await getConsumptionDetail(record.id)
    currentRecord.value = detail
    detailModalVisible.value = true
  } catch (e) {
    // ignore
  }
}

const handleSettle = (record) => {
  Modal.confirm({
    title: '确认结算',
    content: `确定要对订单 ${record.orderNo} 进行结算吗？`,
    okText: '确定结算',
    cancelText: '取消',
    onOk: async () => {
      try {
        await settleConsumption(record.id)
        message.success('结算成功')
        loadData()
      } catch (e) {
        // ignore
      }
    },
  })
}

const handleRefund = (record) => {
  Modal.confirm({
    title: '确认退款',
    content: `确定要对订单 ${record.orderNo} 进行退款吗？`,
    okText: '确定退款',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: async () => {
      try {
        await refundConsumption(record.id)
        message.success('退款成功')
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

.price-amount {
  color: #f5222d;
  font-weight: 600;
}

.settle-summary {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;

  .summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;

    &.total {
      font-size: 16px;
      font-weight: 600;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #d9d9d9;
    }
  }
}
</style>
