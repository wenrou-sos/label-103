<template>
  <div class="ticket-list">
    <div class="table-toolbar">
      <div class="filter-bar">
        <a-select
          v-model:value="filters.status"
          placeholder="订单状态"
          style="width: 150px"
          allow-clear
          @change="handleSearch"
        >
          <a-select-option value="pending">待支付</a-select-option>
          <a-select-option value="paid">已支付</a-select-option>
          <a-select-option value="used">已使用</a-select-option>
          <a-select-option value="refunded">已退款</a-select-option>
          <a-select-option value="cancelled">已取消</a-select-option>
          <a-select-option value="expired">已过期</a-select-option>
        </a-select>
        <a-select
          v-model:value="filters.ticketTypeId"
          placeholder="票种类型"
          style="width: 150px"
          allow-clear
          @change="handleSearch"
        >
          <a-select-option
            v-for="type in ticketTypes"
            :key="type.id"
            :value="type.id"
          >
            {{ type.name }}
          </a-select-option>
        </a-select>
        <a-range-picker v-model:value="dateRange" @change="handleSearch" />
        <a-input-search
          v-model:value="filters.keyword"
          placeholder="搜索订单号/票号/姓名/电话"
          style="width: 280px"
          @search="handleSearch"
        />
      </div>
      <div>
        <a-button type="primary" @click="openBuyModal">
          <PlusOutlined />
          售票
        </a-button>
        <a-button @click="openVerifyModal">
          <QrcodeOutlined />
          验票
        </a-button>
        <a-popconfirm
          v-if="selectedRowKeys.length > 0"
          title={`确定对已选的 ${selectedRowKeys.length} 个订单执行批量退票吗？`}
          ok-text="确定"
          cancel-text="取消"
          ok-button-props="{ danger: true }"
          @confirm="openBatchRefundModal"
        >
          <a-button danger>
            <RollbackOutlined />
            批量退票 ({{ selectedRowKeys.length }})
          </a-button>
        </a-popconfirm>
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
      :row-selection="rowSelection"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="statusColors[record.status]">
            {{ statusMap[record.status] }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'isEarlyBird'">
          <a-tag v-if="record.isEarlyBird" color="orange">早鸟票</a-tag>
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'seasonType'">
          <a-tag :color="record.seasonType === 'peak' ? 'red' : 'green'">
            {{ record.seasonType === 'peak' ? '旺季' : '淡季' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'actualAmount'">
          <span class="price-amount">¥{{ record.actualAmount }}</span>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="viewDetail(record)">查看</a-button>
          <a-button
            v-if="record.status === 'paid'"
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
      v-model:open="buyModalVisible"
      title="售票"
      :width="600"
      @ok="handleBuy"
      ok-text="确认购票"
      cancel-text="取消"
      :confirm-loading="buyLoading"
    >
      <a-form :model="buyForm" layout="vertical">
        <a-form-item label="票种">
          <a-select v-model:value="buyForm.ticketTypeId" @change="onTicketTypeChange">
            <a-select-option
              v-for="type in ticketTypes"
              :key="type.id"
              :value="type.id"
            >
              {{ type.name }} - {{ seasonType === 'peak' ? '旺季' : '淡季' }} ¥{{ seasonType === 'peak' ? type.peakPrice : type.offPeakPrice }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="入园日期">
          <a-date-picker
            v-model:value="buyForm.visitDate"
            style="width: 100%"
            :disabled-date="disabledDate"
            @change="calculatePrice"
          />
        </a-form-item>
        <a-form-item label="购票数量">
          <a-input-number
            v-model:value="buyForm.quantity"
            :min="1"
            :max="10"
            style="width: 100%"
            @change="calculatePrice"
          />
        </a-form-item>
        <a-form-item label="游客信息">
          <a-input v-model:value="buyForm.visitorName" placeholder="姓名" style="margin-bottom: 8px" />
          <a-input v-model:value="buyForm.visitorPhone" placeholder="手机号" style="margin-bottom: 8px" />
          <a-input v-model:value="buyForm.visitorIdCard" placeholder="身份证号" />
        </a-form-item>
        <a-form-item label="支付方式">
          <a-select v-model:value="buyForm.paymentMethod">
            <a-select-option value="wechat">微信支付</a-select-option>
            <a-select-option value="alipay">支付宝</a-select-option>
            <a-select-option value="cash">现金</a-select-option>
            <a-select-option value="card">银行卡</a-select-option>
          </a-select>
        </a-form-item>
        <div v-if="priceInfo" class="price-summary">
          <a-divider />
          <div class="price-item">
            <span>单价：</span>
            <span>¥{{ priceInfo.unitPrice }}</span>
          </div>
          <div class="price-item">
            <span>数量：</span>
            <span>{{ buyForm.quantity }} 张</span>
          </div>
          <div v-if="priceInfo.isEarlyBird" class="price-item discount">
            <span>早鸟优惠：</span>
            <span>-¥{{ priceInfo.discountTotal.toFixed(2) }}</span>
          </div>
          <div class="price-item total">
            <span>应付金额：</span>
            <span class="price-amount">¥{{ priceInfo.finalPrice.toFixed(2) }}</span>
          </div>
        </div>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="verifyModalVisible"
      title="验票"
      @ok="handleVerify"
      ok-text="验票"
      cancel-text="取消"
      :confirm-loading="verifyLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="票号">
          <a-input v-model:value="verifyForm.ticketCode" placeholder="请输入票号或扫描二维码" />
        </a-form-item>
        <a-form-item label="身份证号">
          <a-input v-model:value="verifyForm.idCard" placeholder="请输入身份证号（可选）" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="batchRefundModalVisible"
      title="批量退票"
      :width="520"
      @ok="handleBatchRefund"
      ok-text="确认退款"
      cancel-text="取消"
      ok-button-props="{ danger: true }"
      :confirm-loading="batchRefundLoading"
    >
      <a-alert
        type="warning"
        :show-icon="true"
        :message="`将对 ${selectedRowKeys.length} 个订单执行批量退款操作，此操作不可撤销。`"
        style="margin-bottom: 16px"
      />
      <a-descriptions :column="2" bordered size="small" style="margin-bottom: 16px">
        <a-descriptions-item label="选择总数">
          <b>{{ selectedRowKeys.length }}</b> 单
        </a-descriptions-item>
        <a-descriptions-item label="预计金额">
          <b class="price-amount">¥{{ selectedTotalAmount.toFixed(2) }}</b>
        </a-descriptions-item>
      </a-descriptions>
      <a-form layout="vertical">
        <a-form-item label="退款原因（可选）">
          <a-textarea
            v-model:value="batchRefundReason"
            :rows="3"
            placeholder="请输入退款原因，便于后续追溯"
            :maxlength="200"
            show-count
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="refundResultVisible"
      title="批量退款结果"
      :width="680"
      ok-text="确定"
      :cancel-button-props="{ style: { display: 'none' } }"
      @ok="handleRefundResultClose"
    >
      <a-result
        v-if="refundResult?.summary"
        :status="refundResult.summary.failedCount === 0 ? 'success' : 'warning'"
        :title="refundResult.message"
      >
        <template #sub-title>
          <div class="refund-summary">
            <span>总计：<b>{{ refundResult.summary.total }}</b> 单</span>
            <span style="margin-left: 16px; color: #52c41a">
              成功：<b>{{ refundResult.summary.successCount }}</b> 单
            </span>
            <span style="margin-left: 16px; color: #ff4d4f">
              失败：<b>{{ refundResult.summary.failedCount }}</b> 单
            </span>
            <span style="margin-left: 16px; color: #1677ff">
              已退款金额：<b>¥{{ refundResult.summary.totalRefundedAmount }}</b>
            </span>
          </div>
        </template>
      </a-result>

      <div v-if="refundResult?.results?.failed?.length" style="margin-top: 16px">
        <a-alert
          type="error"
          show-icon
          :message="`以下 ${refundResult.results.failed.length} 个订单退款失败`"
          style="margin-bottom: 8px"
        />
        <a-table
          size="small"
          :columns="failedColumns"
          :data-source="refundResult.results.failed"
          :pagination="false"
          row-key="id"
          bordered
        />
      </div>

      <div v-if="refundResult?.results?.success?.length" style="margin-top: 16px">
        <a-alert
          type="success"
          show-icon
          :message="`以下 ${refundResult.results.success.length} 个订单退款成功`"
          style="margin-bottom: 8px"
        />
        <a-table
          size="small"
          :columns="successColumns"
          :data-source="refundResult.results.success"
          :pagination="false"
          row-key="id"
          bordered
        />
      </div>
    </a-modal>

    <a-modal
      v-model:open="detailModalVisible"
      title="订单详情"
      :width="600"
      :footer="null"
    >
      <a-descriptions v-if="currentOrder" :column="2" bordered size="small">
        <a-descriptions-item label="订单号">{{ currentOrder.orderNo }}</a-descriptions-item>
        <a-descriptions-item label="票号">{{ currentOrder.ticketCode }}</a-descriptions-item>
        <a-descriptions-item label="票种">{{ currentOrder.TicketType?.name }}</a-descriptions-item>
        <a-descriptions-item label="数量">{{ currentOrder.quantity }} 张</a-descriptions-item>
        <a-descriptions-item label="入园日期">
          {{ dayjs(currentOrder.visitDate).format('YYYY-MM-DD') }}
        </a-descriptions-item>
        <a-descriptions-item label="季节类型">
          {{ currentOrder.seasonType === 'peak' ? '旺季' : '淡季' }}
        </a-descriptions-item>
        <a-descriptions-item label="单价">¥{{ currentOrder.unitPrice }}</a-descriptions-item>
        <a-descriptions-item label="原价">¥{{ currentOrder.totalAmount }}</a-descriptions-item>
        <a-descriptions-item label="优惠金额">¥{{ currentOrder.discountAmount }}</a-descriptions-item>
        <a-descriptions-item label="实付金额">
          <span class="price-amount">¥{{ currentOrder.actualAmount }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="早鸟票">
          <a-tag v-if="currentOrder.isEarlyBird" color="orange">是</a-tag>
          <span v-else>否</span>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="statusColors[currentOrder.status]">
            {{ statusMap[currentOrder.status] }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="游客姓名" :span="2">
          {{ currentOrder.visitorName || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="手机号" :span="2">
          {{ currentOrder.visitorPhone || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="身份证号" :span="2">
          {{ currentOrder.visitorIdCard || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="支付方式">{{ paymentMap[currentOrder.paymentMethod] || '-' }}</a-descriptions-item>
        <a-descriptions-item label="支付时间">
          {{ currentOrder.paidAt ? dayjs(currentOrder.paidAt).format('YYYY-MM-DD HH:mm:ss') : '-' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { getTicketOrders, getTicketTypes, createTicketOrder, verifyTicket, refundTicket, batchRefundTickets } from '@/api/ticket'
import dayjs from 'dayjs'
import {
  PlusOutlined,
  QrcodeOutlined,
  RollbackOutlined,
} from '@ant-design/icons-vue'

const loading = ref(false)
const buyLoading = ref(false)
const verifyLoading = ref(false)
const batchRefundLoading = ref(false)

const selectedRowKeys = ref([])
const selectedRows = ref([])

const batchRefundModalVisible = ref(false)
const batchRefundReason = ref('')

const refundResultVisible = ref(false)
const refundResult = ref(null)

const successColumns = [
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
  { title: '退款金额', dataIndex: 'amount', key: 'amount', width: 120, customRender: ({ text }) => `¥${text}` },
]

const failedColumns = [
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
  { title: '失败原因', dataIndex: 'reason', key: 'reason' },
]

const data = ref({
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
})

const filters = reactive({
  status: undefined,
  ticketTypeId: undefined,
  keyword: '',
})

const dateRange = ref([])

const ticketTypes = ref([])
const priceInfo = ref(null)
const seasonType = ref('off_peak')

const buyModalVisible = ref(false)
const verifyModalVisible = ref(false)
const detailModalVisible = ref(false)
const currentOrder = ref(null)

const buyForm = reactive({
  ticketTypeId: undefined,
  visitDate: null,
  quantity: 1,
  visitorName: '',
  visitorPhone: '',
  visitorIdCard: '',
  paymentMethod: 'wechat',
})

const verifyForm = reactive({
  ticketCode: '',
  idCard: '',
})

const statusMap = {
  pending: '待支付',
  paid: '已支付',
  used: '已使用',
  refunded: '已退款',
  cancelled: '已取消',
  expired: '已过期',
}

const statusColors = {
  pending: 'default',
  paid: 'green',
  used: 'blue',
  refunded: 'red',
  cancelled: 'default',
  expired: 'orange',
}

const paymentMap = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金',
  card: '银行卡',
}

const columns = [
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
  { title: '票号', dataIndex: 'ticketCode', key: 'ticketCode', width: 140 },
  { title: '票种', dataIndex: ['TicketType', 'name'], key: 'ticketType', width: 100 },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
  { title: '入园日期', dataIndex: 'visitDate', key: 'visitDate', width: 120 },
  { title: '季节', key: 'seasonType', width: 80 },
  { title: '早鸟票', key: 'isEarlyBird', width: 80 },
  { title: '实付金额', key: 'actualAmount', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '游客', dataIndex: 'visitorName', key: 'visitorName', width: 100 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
]

const selectedTotalAmount = computed(() => {
  return selectedRows.value.reduce((sum, row) => sum + (parseFloat(row.actualAmount) || 0), 0)
})

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys, rows) => {
    selectedRowKeys.value = keys
    selectedRows.value = rows
  },
  getCheckboxProps: (record) => ({
    disabled: record.status !== 'paid',
  }),
}))

const disabledDate = (current) => {
  return current && current < dayjs().startOf('day')
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: data.value.page,
      pageSize: data.value.pageSize,
      status: filters.status,
      ticketTypeId: filters.ticketTypeId,
      keyword: filters.keyword,
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
      params.endDate = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    }
    const result = await getTicketOrders(params)
    data.value = result
  } catch (e) {
    // ignore
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  data.value.page = 1
  loadData()
}

const handlePageChange = (page, pageSize) => {
  data.value.page = page
  data.value.pageSize = pageSize
  loadData()
}

const loadTicketTypes = async () => {
  try {
    ticketTypes.value = await getTicketTypes()
  } catch (e) {
    // ignore
  }
}

const onTicketTypeChange = async () => {
  if (buyForm.ticketTypeId && buyForm.visitDate) {
    await calculatePrice()
  }
}

const calculatePrice = async () => {
  if (!buyForm.ticketTypeId || !buyForm.visitDate) {
    priceInfo.value = null
    return
  }
  try {
    const result = await import('@/api/ticket').then((m) => m.calculatePrice({
      ticketTypeId: buyForm.ticketTypeId,
      visitDate: dayjs(buyForm.visitDate).format('YYYY-MM-DD'),
      quantity: buyForm.quantity,
    }))
    priceInfo.value = result
    seasonType.value = result.seasonType
  } catch (e) {
    // ignore
  }
}

const openBuyModal = async () => {
  buyForm.ticketTypeId = undefined
  buyForm.visitDate = null
  buyForm.quantity = 1
  buyForm.visitorName = ''
  buyForm.visitorPhone = ''
  buyForm.visitorIdCard = ''
  buyForm.paymentMethod = 'wechat'
  priceInfo.value = null
  buyModalVisible.value = true
  await loadTicketTypes()
}

const handleBuy = async () => {
  if (!buyForm.ticketTypeId) {
    message.warning('请选择票种')
    return
  }
  if (!buyForm.visitDate) {
    message.warning('请选择入园日期')
    return
  }
  buyLoading.value = true
  try {
    await createTicketOrder({
      ticketTypeId: buyForm.ticketTypeId,
      visitDate: dayjs(buyForm.visitDate).format('YYYY-MM-DD'),
      quantity: buyForm.quantity,
      visitorName: buyForm.visitorName,
      visitorPhone: buyForm.visitorPhone,
      visitorIdCard: buyForm.visitorIdCard,
      paymentMethod: buyForm.paymentMethod,
    })
    message.success('购票成功')
    buyModalVisible.value = false
    loadData()
  } catch (e) {
    // ignore
  } finally {
    buyLoading.value = false
  }
}

const openVerifyModal = () => {
  verifyForm.ticketCode = ''
  verifyForm.idCard = ''
  verifyModalVisible.value = true
}

const handleVerify = async () => {
  if (!verifyForm.ticketCode) {
    message.warning('请输入票号')
    return
  }
  verifyLoading.value = true
  try {
    const result = await verifyTicket({
      ticketCode: verifyForm.ticketCode,
      idCard: verifyForm.idCard,
    })
    message.success('验票成功')
    verifyModalVisible.value = false
    loadData()
  } catch (e) {
    // ignore
  } finally {
    verifyLoading.value = false
  }
}

const viewDetail = (record) => {
  currentOrder.value = record
  detailModalVisible.value = true
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
        await refundTicket(record.id)
        message.success('退款成功')
        loadData()
      } catch (e) {
        // ignore
      }
    },
  })
}

const openBatchRefundModal = () => {
  const payableRows = selectedRows.value.filter((r) => r.status === 'paid')
  if (payableRows.length === 0) {
    message.warning('选中的订单中没有可退款的订单（仅已支付订单可退款）')
    return
  }
  selectedRowKeys.value = payableRows.map((r) => r.id)
  selectedRows.value = payableRows
  batchRefundReason.value = ''
  batchRefundModalVisible.value = true
}

const handleBatchRefund = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要退款的订单')
    return
  }
  batchRefundLoading.value = true
  try {
    const result = await batchRefundTickets({
      ids: selectedRowKeys.value,
      reason: batchRefundReason.value,
    })
    refundResult.value = result
    batchRefundModalVisible.value = false
    refundResultVisible.value = true
    selectedRowKeys.value = []
    selectedRows.value = []
    loadData()
  } catch (e) {
    // ignore
  } finally {
    batchRefundLoading.value = false
  }
}

const handleRefundResultClose = () => {
  refundResultVisible.value = false
  refundResult.value = null
}

onMounted(() => {
  loadTicketTypes()
  loadData()
})
</script>

<style scoped>
.price-summary {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
}

.refund-summary {
  font-size: 14px;
  line-height: 2;
}

.price-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;

  &.discount {
    color: #faad14;
  }

  &.total {
    font-size: 16px;
    font-weight: 600;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #d9d9d9;
  }
}
</style>
