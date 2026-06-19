<template>
  <div class="ticket-list">
    <div class="table-toolbar">
      <div class="filter-bar">
        <a-select
          v-model:value="filters.status"
          placeholder="订单状态"
          style="width: 150px"
          allow-clear
          @change="loadData"
        >
          <a-select-option value="pending">待支付</a-select-option>
          <a-select-option value="paid">已支付</a-select-option>
          <a-select-option value="used">已使用</a-select-option>
          <a-select-option value="refunded">已退款</a-select-option>
          <a-select-option value="cancelled">已取消</a-select-option>
          <a-select-option value="expired">已过期</a-select-option>
        </a-select>
        <a-range-picker v-model:value="dateRange" @change="loadData" />
        <a-input-search
          v-model:value="filters.keyword"
          placeholder="搜索订单号/票号/姓名/电话"
          style="width: 280px"
          @search="loadData"
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
import { getTicketOrders, getTicketTypes, createTicketOrder, verifyTicket, refundTicket } from '@/api/ticket'
import dayjs from 'dayjs'
import {
  PlusOutlined,
  QrcodeOutlined,
} from '@ant-design/icons-vue'

const loading = ref(false)
const buyLoading = ref(false)
const verifyLoading = ref(false)

const data = ref({
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
})

const filters = reactive({
  status: undefined,
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

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.price-summary {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
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
