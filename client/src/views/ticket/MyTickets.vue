<template>
  <div class="my-tickets-page">
    <a-card title="我的门票">
      <template #extra>
        <div class="filter-bar">
          <a-select
            v-model:value="filters.status"
            placeholder="订单状态"
            style="width: 140px"
            allow-clear
            @change="loadData"
          >
            <a-select-option value="paid">未使用</a-select-option>
            <a-select-option value="used">已使用</a-select-option>
            <a-select-option value="expired">已过期</a-select-option>
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
          <template v-if="column.key === 'ticketType'">
            {{ record.TicketType?.name || '-' }}
          </template>
          <template v-else-if="column.key === 'visitDate'">
            {{ record.visitDate ? dayjs(record.visitDate).format('YYYY-MM-DD') : '-' }}
          </template>
          <template v-else-if="column.key === 'seasonType'">
            <a-tag :color="record.seasonType === 'peak' ? 'red' : 'green'">
              {{ record.seasonType === 'peak' ? '旺季' : '淡季' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'isEarlyBird'">
            <a-tag v-if="record.isEarlyBird" color="orange">早鸟票</a-tag>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColors[record.status]">
              {{ statusMap[record.status] }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'actualAmount'">
            <span class="price-amount">¥{{ record.actualAmount }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="viewDetail(record)">查看详情</a-button>
            <a-button
              v-if="record.status === 'paid'"
              type="link"
              size="small"
              danger
              @click="handleRefund(record)"
            >
              申请退款
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="detailModalVisible"
      title="门票详情"
      :width="600"
      :footer="null"
    >
      <a-descriptions v-if="currentTicket" :column="2" bordered size="small">
        <a-descriptions-item label="订单号">{{ currentTicket.orderNo }}</a-descriptions-item>
        <a-descriptions-item label="票号">{{ currentTicket.ticketCode }}</a-descriptions-item>
        <a-descriptions-item label="票种">{{ currentTicket.TicketType?.name || '-' }}</a-descriptions-item>
        <a-descriptions-item label="数量">{{ currentTicket.quantity }} 张</a-descriptions-item>
        <a-descriptions-item label="入园日期">
          {{ currentTicket.visitDate ? dayjs(currentTicket.visitDate).format('YYYY-MM-DD') : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="季节类型">
          {{ currentTicket.seasonType === 'peak' ? '旺季' : '淡季' }}
        </a-descriptions-item>
        <a-descriptions-item label="单价">¥{{ currentTicket.unitPrice }}</a-descriptions-item>
        <a-descriptions-item label="原价">¥{{ currentTicket.totalAmount }}</a-descriptions-item>
        <a-descriptions-item label="优惠金额">¥{{ currentTicket.discountAmount }}</a-descriptions-item>
        <a-descriptions-item label="实付金额">
          <span class="price-amount">¥{{ currentTicket.actualAmount }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="早鸟票">
          <a-tag v-if="currentTicket.isEarlyBird" color="orange">是</a-tag>
          <span v-else>否</span>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="statusColors[currentTicket.status]">
            {{ statusMap[currentTicket.status] }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="游客姓名" :span="2">
          {{ currentTicket.visitorName || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="手机号" :span="2">
          {{ currentTicket.visitorPhone || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="身份证号" :span="2">
          {{ currentTicket.visitorIdCard || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="支付方式">{{ paymentMap[currentTicket.paymentMethod] || '-' }}</a-descriptions-item>
        <a-descriptions-item label="购买时间">
          {{ currentTicket.paidAt ? dayjs(currentTicket.paidAt).format('YYYY-MM-DD HH:mm:ss') : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="使用时间" :span="2">
          {{ currentTicket.usedAt ? dayjs(currentTicket.usedAt).format('YYYY-MM-DD HH:mm:ss') : '-' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { getTicketOrders, refundTicket } from '@/api/ticket'
import dayjs from 'dayjs'

const loading = ref(false)

const data = ref({
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
})

const filters = reactive({
  status: undefined,
})

const dateRange = ref([])
const detailModalVisible = ref(false)
const currentTicket = ref(null)

const statusMap = {
  pending: '待支付',
  paid: '未使用',
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
  { title: '票种', key: 'ticketType', width: 120 },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
  { title: '入园日期', key: 'visitDate', width: 120 },
  { title: '季节', key: 'seasonType', width: 80 },
  { title: '早鸟票', key: 'isEarlyBird', width: 80 },
  { title: '实付金额', key: 'actualAmount', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' },
]

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: data.value.page,
      pageSize: data.value.pageSize,
      status: filters.status,
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

const viewDetail = (record) => {
  currentTicket.value = record
  detailModalVisible.value = true
}

const handleRefund = (record) => {
  Modal.confirm({
    title: '申请退款',
    content: `确定要对订单 ${record.orderNo} 申请退款吗？`,
    okText: '确定退款',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: async () => {
      try {
        await refundTicket(record.id)
        message.success('退款申请已提交')
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
.my-tickets-page {
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
