<template>
  <div class="annual-card-list">
    <div class="table-toolbar">
      <div class="filter-bar">
        <a-select
          v-model:value="filters.status"
          placeholder="卡状态"
          style="width: 150px"
          allow-clear
          @change="handleSearch"
        >
          <a-select-option value="pending">待激活</a-select-option>
          <a-select-option value="active">正常</a-select-option>
          <a-select-option value="frozen">冻结</a-select-option>
          <a-select-option value="expired">已过期</a-select-option>
          <a-select-option value="cancelled">已取消</a-select-option>
        </a-select>
        <a-select
          v-model:value="filters.cardTypeId"
          placeholder="卡类型"
          style="width: 150px"
          allow-clear
          @change="handleSearch"
        >
          <a-select-option
            v-for="type in cardTypes"
            :key="type.id"
            :value="type.id"
          >
            {{ type.name }}
          </a-select-option>
        </a-select>
        <a-input-search
          v-model:value="filters.keyword"
          placeholder="搜索卡号/姓名/身份证/手机号"
          style="width: 280px"
          @search="handleSearch"
        />
      </div>
      <div>
        <a-button type="primary" @click="openBuyModal">
          <PlusOutlined />
          新增年卡
        </a-button>
        <a-button @click="openVerifyModal">
          <QrcodeOutlined />
          验卡
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
        <template v-if="column.key === 'cardNo'">
          {{ record.cardNo }}
        </template>
        <template v-else-if="column.key === 'cardType'">
          {{ record.AnnualCardType?.name || '-' }}
        </template>
        <template v-else-if="column.key === 'holderName'">
          {{ record.holderName || '-' }}
        </template>
        <template v-else-if="column.key === 'holderIdCard'">
          {{ record.holderIdCard || '-' }}
        </template>
        <template v-else-if="column.key === 'holderPhone'">
          {{ record.holderPhone || '-' }}
        </template>
        <template v-else-if="column.key === 'points'">
          <span v-if="record.User?.points !== undefined" class="points-balance">{{ record.User.points }}</span>
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'activateDate'">
          {{ record.activateDate ? dayjs(record.activateDate).format('YYYY-MM-DD') : '-' }}
        </template>
        <template v-else-if="column.key === 'expireDate'">
          {{ record.expireDate ? dayjs(record.expireDate).format('YYYY-MM-DD') : '-' }}
        </template>
        <template v-else-if="column.key === 'balance'">
          <span class="price-amount">¥{{ record.balance || 0 }}</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColors[record.status]">
            {{ statusMap[record.status] }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="viewDetail(record)">详情</a-button>
          <a-button
            v-if="record.status === 'active' || record.status === 'pending'"
            type="link"
            size="small"
            @click="openRechargeModal(record)"
          >
            充值
          </a-button>
          <a-button
            v-if="record.status === 'active'"
            type="link"
            size="small"
            @click="openBindModal(record)"
          >
            绑手环
          </a-button>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="buyModalVisible"
      title="购卡"
      :width="600"
      @ok="handleBuy"
      ok-text="确认购卡"
      cancel-text="取消"
      :confirm-loading="buyLoading"
    >
      <a-form :model="buyForm" layout="vertical">
        <a-form-item label="卡类型" required>
          <a-select v-model:value="buyForm.cardTypeId" @change="onCardTypeChange">
            <a-select-option
              v-for="type in cardTypes"
              :key="type.id"
              :value="type.id"
            >
              {{ type.name }} - ¥{{ type.price }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="持卡人姓名">
          <a-input v-model:value="buyForm.holderName" placeholder="请输入持卡人姓名" />
        </a-form-item>
        <a-form-item label="身份证号">
          <a-input v-model:value="buyForm.holderIdCard" placeholder="请输入身份证号" />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input v-model:value="buyForm.holderPhone" placeholder="请输入手机号" />
        </a-form-item>
        <a-form-item label="生日">
          <a-date-picker
            v-model:value="buyForm.holderBirthday"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </a-form-item>
        <a-form-item label="支付方式">
          <a-select v-model:value="buyForm.paymentMethod">
            <a-select-option value="wechat">微信支付</a-select-option>
            <a-select-option value="alipay">支付宝</a-select-option>
            <a-select-option value="cash">现金</a-select-option>
            <a-select-option value="card">银行卡</a-select-option>
          </a-select>
        </a-form-item>
        <div v-if="selectedCardType" class="price-summary">
          <a-divider />
          <div class="price-item">
            <span>卡类型：</span>
            <span>{{ selectedCardType.name }}</span>
          </div>
          <div class="price-item">
            <span>价格：</span>
            <span class="price-amount">¥{{ selectedCardType.price }}</span>
          </div>
          <div class="price-item">
            <span>有效期：</span>
            <span>{{ selectedCardType.validityDays }}天</span>
          </div>
        </div>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="verifyModalVisible"
      title="验卡"
      @ok="handleVerify"
      ok-text="验卡"
      cancel-text="取消"
      :confirm-loading="verifyLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="卡号">
          <a-input v-model:value="verifyForm.cardNo" placeholder="请输入卡号或扫描二维码" />
        </a-form-item>
        <a-form-item label="身份证号">
          <a-input v-model:value="verifyForm.idCard" placeholder="请输入身份证号（可选）" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="rechargeModalVisible"
      title="充值"
      @ok="handleRecharge"
      ok-text="确认充值"
      cancel-text="取消"
      :confirm-loading="rechargeLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="卡号">
          <span>{{ currentCard?.cardNo }}</span>
        </a-form-item>
        <a-form-item label="当前余额">
          <span class="price-amount">¥{{ currentCard?.balance || 0 }}</span>
        </a-form-item>
        <a-form-item label="充值金额" required>
          <a-input-number
            v-model:value="rechargeForm.amount"
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="请输入充值金额"
          />
        </a-form-item>
        <a-form-item label="支付方式">
          <a-select v-model:value="rechargeForm.paymentMethod">
            <a-select-option value="wechat">微信支付</a-select-option>
            <a-select-option value="alipay">支付宝</a-select-option>
            <a-select-option value="cash">现金</a-select-option>
            <a-select-option value="card">银行卡</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="bindModalVisible"
      title="绑定手环"
      @ok="handleBind"
      ok-text="确认绑定"
      cancel-text="取消"
      :confirm-loading="bindLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="卡号">
          <span>{{ currentCard?.cardNo }}</span>
        </a-form-item>
        <a-form-item label="持卡人">
          <span>{{ currentCard?.holderName || '-' }}</span>
        </a-form-item>
        <a-form-item label="手环编号" required>
          <a-input v-model:value="bindForm.wristbandId" placeholder="请输入手环编号" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="detailModalVisible"
      title="年卡详情"
      :width="600"
      :footer="null"
    >
      <a-descriptions v-if="currentCardDetail" :column="2" bordered size="small">
        <a-descriptions-item label="卡号">{{ currentCardDetail.cardNo }}</a-descriptions-item>
        <a-descriptions-item label="卡类型">{{ currentCardDetail.AnnualCardType?.name || '-' }}</a-descriptions-item>
        <a-descriptions-item label="持卡人">{{ currentCardDetail.holderName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="身份证号">{{ currentCardDetail.holderIdCard || '-' }}</a-descriptions-item>
        <a-descriptions-item label="手机号">{{ currentCardDetail.holderPhone || '-' }}</a-descriptions-item>
        <a-descriptions-item label="手环编号">{{ currentCardDetail.wristbandId || '-' }}</a-descriptions-item>
        <a-descriptions-item label="激活日期">
          {{ currentCardDetail.activateDate ? dayjs(currentCardDetail.activateDate).format('YYYY-MM-DD') : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="到期日期">
          {{ currentCardDetail.expireDate ? dayjs(currentCardDetail.expireDate).format('YYYY-MM-DD') : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="卡内余额">
          <span class="price-amount">¥{{ currentCardDetail.balance || 0 }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="累计消费">
          ¥{{ currentCardDetail.totalConsumption || 0 }}
        </a-descriptions-item>
        <a-descriptions-item label="入园次数">
          {{ currentCardDetail.visitCount || 0 }} 次
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="statusColors[currentCardDetail.status]">
            {{ statusMap[currentCardDetail.status] }}
          </a-tag>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  getAnnualCards,
  getAnnualCardDetail,
  purchaseAnnualCard,
  verifyAnnualCard,
  rechargeAnnualCard,
  bindWristband,
  getAllCardTypes,
} from '@/api/annualCard'
import dayjs from 'dayjs'
import {
  PlusOutlined,
  QrcodeOutlined,
} from '@ant-design/icons-vue'

const loading = ref(false)
const buyLoading = ref(false)
const verifyLoading = ref(false)
const rechargeLoading = ref(false)
const bindLoading = ref(false)

const data = ref({
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
})

const filters = reactive({
  status: undefined,
  cardTypeId: undefined,
  keyword: '',
})

const cardTypes = ref([])
const currentCard = ref(null)
const currentCardDetail = ref(null)
const selectedCardType = computed(() => {
  if (!buyForm.cardTypeId) return null
  return cardTypes.value.find((t) => t.id === buyForm.cardTypeId)
})

const buyModalVisible = ref(false)
const verifyModalVisible = ref(false)
const rechargeModalVisible = ref(false)
const bindModalVisible = ref(false)
const detailModalVisible = ref(false)

const buyForm = reactive({
  cardTypeId: undefined,
  holderName: '',
  holderIdCard: '',
  holderPhone: '',
  holderBirthday: '',
  paymentMethod: 'wechat',
})

const verifyForm = reactive({
  cardNo: '',
  idCard: '',
})

const rechargeForm = reactive({
  amount: 0,
  paymentMethod: 'wechat',
})

const bindForm = reactive({
  wristbandId: '',
})

const statusMap = {
  pending: '待激活',
  active: '正常',
  frozen: '冻结',
  expired: '已过期',
  cancelled: '已取消',
}

const statusColors = {
  pending: 'default',
  active: 'green',
  frozen: 'orange',
  expired: 'red',
  cancelled: 'default',
}

const columns = [
  { title: '卡号', dataIndex: 'cardNo', key: 'cardNo', width: 160 },
  { title: '卡类型', key: 'cardType', width: 120 },
  { title: '持卡人', key: 'holderName', width: 100 },
  { title: '身份证', key: 'holderIdCard', width: 180 },
  { title: '手机号', key: 'holderPhone', width: 120 },
  { title: '积分', key: 'points', width: 100 },
  { title: '激活日期', key: 'activateDate', width: 120 },
  { title: '到期日期', key: 'expireDate', width: 120 },
  { title: '余额', key: 'balance', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' },
]

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: data.value.page,
      pageSize: data.value.pageSize,
      status: filters.status,
      cardTypeId: filters.cardTypeId,
      keyword: filters.keyword,
    }
    const result = await getAnnualCards(params)
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

const loadCardTypes = async () => {
  try {
    cardTypes.value = await getAllCardTypes()
  } catch (e) {
    // ignore
  }
}

const onCardTypeChange = () => {
  // 选中卡类型后的逻辑
}

const openBuyModal = async () => {
  buyForm.cardTypeId = undefined
  buyForm.holderName = ''
  buyForm.holderIdCard = ''
  buyForm.holderPhone = ''
  buyForm.holderBirthday = ''
  buyForm.paymentMethod = 'wechat'
  buyModalVisible.value = true
  await loadCardTypes()
}

const handleBuy = async () => {
  if (!buyForm.cardTypeId) {
    message.warning('请选择卡类型')
    return
  }
  if (!buyForm.holderName) {
    message.warning('请输入持卡人姓名')
    return
  }
  if (!buyForm.holderIdCard) {
    message.warning('请输入身份证号')
    return
  }
  buyLoading.value = true
  try {
    await purchaseAnnualCard({
      cardTypeId: buyForm.cardTypeId,
      holderName: buyForm.holderName,
      holderIdCard: buyForm.holderIdCard,
      holderPhone: buyForm.holderPhone,
      holderBirthday: buyForm.holderBirthday,
      paymentMethod: buyForm.paymentMethod,
    })
    message.success('购卡成功')
    buyModalVisible.value = false
    loadData()
  } catch (e) {
    // ignore
  } finally {
    buyLoading.value = false
  }
}

const openVerifyModal = () => {
  verifyForm.cardNo = ''
  verifyForm.idCard = ''
  verifyModalVisible.value = true
}

const handleVerify = async () => {
  if (!verifyForm.cardNo) {
    message.warning('请输入卡号')
    return
  }
  verifyLoading.value = true
  try {
    const result = await verifyAnnualCard({
      cardNo: verifyForm.cardNo,
      idCard: verifyForm.idCard,
    })
    message.success('验卡成功')
    verifyModalVisible.value = false
    loadData()
  } catch (e) {
    // ignore
  } finally {
    verifyLoading.value = false
  }
}

const openRechargeModal = (record) => {
  currentCard.value = record
  rechargeForm.amount = 0
  rechargeForm.paymentMethod = 'wechat'
  rechargeModalVisible.value = true
}

const handleRecharge = async () => {
  if (!rechargeForm.amount || rechargeForm.amount <= 0) {
    message.warning('请输入充值金额')
    return
  }
  rechargeLoading.value = true
  try {
    await rechargeAnnualCard(currentCard.value.id, {
      amount: rechargeForm.amount,
    })
    message.success('充值成功')
    rechargeModalVisible.value = false
    loadData()
  } catch (e) {
    // ignore
  } finally {
    rechargeLoading.value = false
  }
}

const openBindModal = (record) => {
  currentCard.value = record
  bindForm.wristbandId = ''
  bindModalVisible.value = true
}

const handleBind = async () => {
  if (!bindForm.wristbandId) {
    message.warning('请输入手环编号')
    return
  }
  bindLoading.value = true
  try {
    await bindWristband(currentCard.value.id, {
      wristbandId: bindForm.wristbandId,
    })
    message.success('绑定成功')
    bindModalVisible.value = false
    loadData()
  } catch (e) {
    // ignore
  } finally {
    bindLoading.value = false
  }
}

const viewDetail = async (record) => {
  try {
    const result = await getAnnualCardDetail(record.id)
    currentCardDetail.value = result
    detailModalVisible.value = true
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  loadCardTypes()
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
}

.points-balance {
  color: #faad14;
  font-weight: 600;
}
</style>
