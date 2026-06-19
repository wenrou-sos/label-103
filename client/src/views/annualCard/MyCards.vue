<template>
  <div class="my-cards-page">
    <a-card title="我的年卡">
      <template #extra>
        <div class="filter-bar">
          <a-select
            v-model:value="filters.status"
            placeholder="卡状态"
            style="width: 140px"
            allow-clear
            @change="loadData"
          >
            <a-select-option value="active">正常</a-select-option>
            <a-select-option value="frozen">冻结</a-select-option>
            <a-select-option value="expired">已过期</a-select-option>
          </a-select>
        </div>
      </template>

      <div v-if="loading" class="loading-container">
        <a-spin size="large" tip="加载中..." />
      </div>
      <div v-else-if="!data.list || data.list.length === 0" class="empty-container">
        <a-empty description="暂无年卡" />
      </div>
      <div v-else class="cards-grid">
        <div
          v-for="card in data.list"
          :key="card.id"
          class="card-item"
          :class="`card-${card.status}`"
        >
          <div class="card-header">
            <div class="card-type">
              <CreditCardOutlined class="card-icon" />
              <span class="card-type-name">{{ card.AnnualCardType?.name || '年卡' }}</span>
            </div>
            <a-tag :color="statusColors[card.status]" class="card-status-tag">
              {{ statusMap[card.status] }}
            </a-tag>
          </div>
          <div class="card-no">{{ card.cardNo }}</div>
          <div class="card-balance">
            <span class="balance-label">余额</span>
            <span class="balance-value">¥{{ (card.balance || 0).toFixed(2) }}</span>
          </div>
          <div class="card-divider"></div>
          <div class="card-info">
            <div class="info-row">
              <span class="info-label">持卡人</span>
              <span class="info-value">{{ card.holderName || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">有效期至</span>
              <span class="info-value" :class="{ 'expiring-soon': isExpiringSoon(card.expireDate) }">
                {{ card.expireDate ? dayjs(card.expireDate).format('YYYY-MM-DD') : '-' }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">手环编号</span>
              <span class="info-value">{{ card.wristbandId || '未绑定' }}</span>
            </div>
          </div>
          <div class="card-actions">
            <a-button type="primary" size="small" @click="viewDetail(card)">
              查看详情
            </a-button>
            <a-button size="small" @click="openRechargeModal(card)">
              充值
            </a-button>
          </div>
        </div>
      </div>

      <div v-if="data.list && data.list.length > 0" class="pagination-container">
        <a-pagination
          :current="data.page"
          :page-size="data.pageSize"
          :total="data.total"
          show-size-changer
          :show-total="(total) => `共 ${total} 张`"
          @change="handlePageChange"
        />
      </div>
    </a-card>

    <a-modal
      v-model:open="detailModalVisible"
      title="年卡详情"
      :width="720"
      :footer="null"
    >
      <a-tabs v-if="currentCard">
        <a-tab-pane key="info" tab="年卡信息">
          <a-descriptions :column="2" bordered size="small">
            <a-descriptions-item label="卡号">{{ currentCard.cardNo }}</a-descriptions-item>
            <a-descriptions-item label="卡类型">{{ currentCard.AnnualCardType?.name || '-' }}</a-descriptions-item>
            <a-descriptions-item label="持卡人">{{ currentCard.holderName || '-' }}</a-descriptions-item>
            <a-descriptions-item label="身份证号">{{ currentCard.holderIdCard || '-' }}</a-descriptions-item>
            <a-descriptions-item label="手机号">{{ currentCard.holderPhone || '-' }}</a-descriptions-item>
            <a-descriptions-item label="手环编号">{{ currentCard.wristbandId || '未绑定' }}</a-descriptions-item>
            <a-descriptions-item label="激活日期">
              {{ currentCard.activateDate ? dayjs(currentCard.activateDate).format('YYYY-MM-DD') : '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="有效期至">
              {{ currentCard.expireDate ? dayjs(currentCard.expireDate).format('YYYY-MM-DD') : '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="余额">
              <span class="price-amount">¥{{ (currentCard.balance || 0).toFixed(2) }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="statusColors[currentCard.status]">
                {{ statusMap[currentCard.status] }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="成人数量" :span="2">
              {{ currentCard.AnnualCardType?.adultCount || 0 }} 人
            </a-descriptions-item>
            <a-descriptions-item label="儿童数量" :span="2">
              {{ currentCard.AnnualCardType?.childCount || 0 }} 人
            </a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>

        <a-tab-pane key="projects" tab="游玩项目准入">
          <div class="projects-tab-header">
            <a-alert
              type="info"
              show-icon
              message="以下为园区全部游玩项目及准入要求，已根据持卡人信息标注可玩/待确认/不可玩状态。"
              style="margin-bottom: 12px"
            />
          </div>
          <a-spin :spinning="projectsLoading">
            <a-empty v-if="!cardProjects.length" description="暂无游玩项目" />
            <a-list v-else :data-source="cardProjects" bordered>
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #title>
                      <span style="font-weight: 600">{{ item.name }}</span>
                      <a-tag
                        :color="categoryColors[item.category]"
                        style="margin-left: 8px"
                      >
                        {{ categoryMap[item.category] || item.category }}
                      </a-tag>
                      <a-tag v-if="item.isCharged" color="orange" style="margin-left: 4px">¥{{ item.price }}</a-tag>
                      <a-tag v-else color="green" style="margin-left: 4px">免费</a-tag>
                    </template>
                    <template #description>
                      <div class="project-req-line">
                        <span>身高要求：</span>
                        <span v-if="(item.minHeight === null || item.minHeight === undefined) && (item.maxHeight === null || item.maxHeight === undefined)" class="text-muted">无限制</span>
                        <span v-else>
                          <span v-if="item.minHeight !== null && item.minHeight !== undefined">≥ {{ item.minHeight }}cm</span>
                          <span v-if="item.minHeight !== null && item.minHeight !== undefined && item.maxHeight !== null && item.maxHeight !== undefined"> / </span>
                          <span v-if="item.maxHeight !== null && item.maxHeight !== undefined">≤ {{ item.maxHeight }}cm</span>
                        </span>
                        <span style="margin-left: 16px">年龄要求：</span>
                        <span v-if="(item.minAge === null || item.minAge === undefined) && (item.maxAge === null || item.maxAge === undefined)" class="text-muted">无限制</span>
                        <span v-else>
                          <span v-if="item.minAge !== null && item.minAge !== undefined">≥ {{ item.minAge }}岁</span>
                          <span v-if="item.minAge !== null && item.minAge !== undefined && item.maxAge !== null && item.maxAge !== undefined"> / </span>
                          <span v-if="item.maxAge !== null && item.maxAge !== undefined">≤ {{ item.maxAge }}岁</span>
                        </span>
                      </div>
                    </template>
                  </a-list-item-meta>
                  <template #actions>
                    <a-tooltip v-if="item.accessible" title="持卡人可游玩">
                      <a-tag color="success">可游玩</a-tag>
                    </a-tooltip>
                    <a-tooltip v-else-if="item.infoMissing" :title="item.infoMissingReasons.join('；')">
                      <a-tag color="warning">待确认</a-tag>
                    </a-tooltip>
                    <a-tooltip v-else :title="item.failReasons.join('；')">
                      <a-tag color="error">不可游玩</a-tag>
                    </a-tooltip>
                  </template>
                </a-list-item>
              </template>
            </a-list>
          </a-spin>
        </a-tab-pane>
      </a-tabs>
    </a-modal>

    <a-modal
      v-model:open="rechargeModalVisible"
      title="年卡充值"
      :width="450"
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
          <span class="price-amount">¥{{ (currentCard?.balance || 0).toFixed(2) }}</span>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getMyCards, rechargeAnnualCard, getAnnualCardDetail } from '@/api/annualCard'
import { checkAllAccess } from '@/api/amusementProject'
import dayjs from 'dayjs'
import { CreditCardOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const rechargeLoading = ref(false)
const projectsLoading = ref(false)

const cardProjects = ref([])

const categoryMap = {
  thrill: '刺激类',
  family: '家庭类',
  children: '儿童类',
  water: '水上类',
  show: '演出类',
  other: '其他',
}

const categoryColors = {
  thrill: 'red',
  family: 'blue',
  children: 'green',
  water: 'cyan',
  show: 'purple',
  other: 'default',
}

const data = ref({
  list: [],
  total: 0,
  page: 1,
  pageSize: 8,
})

const filters = reactive({
  status: undefined,
})

const detailModalVisible = ref(false)
const rechargeModalVisible = ref(false)
const currentCard = ref(null)

const rechargeForm = reactive({
  amount: 0,
  paymentMethod: 'wechat',
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

const isExpiringSoon = (expireDate) => {
  if (!expireDate) return false
  const days = dayjs(expireDate).diff(dayjs(), 'day')
  return days > 0 && days <= 30
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: data.value.page,
      pageSize: data.value.pageSize,
      status: filters.status,
    }
    const result = await getMyCards(params)
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
    const result = await getAnnualCardDetail(record.id)
    currentCard.value = result
    detailModalVisible.value = true
    await loadCardProjects(result)
  } catch (e) {
    // ignore
  }
}

const loadCardProjects = async (card) => {
  projectsLoading.value = true
  cardProjects.value = []
  try {
    const params = {}
    if (card.holderIdCard) {
      params.idCard = card.holderIdCard
    }
    const result = await checkAllAccess(params)
    cardProjects.value = [
      ...(result.accessible || []),
      ...(result.unknown || []),
      ...(result.inaccessible || []),
    ]
  } catch (e) {
    // ignore
  } finally {
    projectsLoading.value = false
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
      paymentMethod: rechargeForm.paymentMethod,
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

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.my-cards-page {
  padding: 0;
}

.filter-bar {
  display: flex;
  gap: 12px;
}

.loading-container,
.empty-container {
  padding: 60px 0;
  text-align: center;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.card-item {
  border-radius: 12px;
  padding: 20px;
  color: #fff;
  position: relative;
  overflow: hidden;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }

  &.card-active {
    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
    box-shadow: 0 4px 15px rgba(82, 196, 26, 0.3);

    &:hover {
      box-shadow: 0 8px 25px rgba(82, 196, 26, 0.4);
    }
  }

  &.card-frozen {
    background: linear-gradient(135deg, #faad14 0%, #d48806 100%);
    box-shadow: 0 4px 15px rgba(250, 173, 20, 0.3);

    &:hover {
      box-shadow: 0 8px 25px rgba(250, 173, 20, 0.4);
    }
  }

  &.card-expired {
    background: linear-gradient(135deg, #8c8c8c 0%, #595959 100%);
    box-shadow: 0 4px 15px rgba(140, 140, 140, 0.3);

    &:hover {
      box-shadow: 0 8px 25px rgba(140, 140, 140, 0.4);
    }
  }

  &.card-pending {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    box-shadow: 0 4px 15px rgba(24, 144, 255, 0.3);

    &:hover {
      box-shadow: 0 8px 25px rgba(24, 144, 255, 0.4);
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-type {
  display: flex;
  align-items: center;
  gap: 8px;

  .card-icon {
    font-size: 24px;
  }

  .card-type-name {
    font-size: 16px;
    font-weight: 600;
  }
}

.card-status-tag {
  margin: 0;
}

.card-no {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 12px;
  font-family: 'Courier New', monospace;
}

.card-balance {
  margin-bottom: 16px;

  .balance-label {
    font-size: 12px;
    opacity: 0.8;
    margin-right: 8px;
  }

  .balance-value {
    font-size: 28px;
    font-weight: 700;
  }
}

.card-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.3);
  margin-bottom: 12px;
}

.card-info {
  flex: 1;

  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;
  }

  .info-label {
    opacity: 0.8;
  }

  .info-value {
    font-weight: 500;

    &.expiring-soon {
      color: #fff1b8;
      font-weight: 600;
    }
  }
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.price-amount {
  color: #f5222d;
  font-weight: 600;
}

.project-req-line {
  font-size: 13px;
  color: #6b7280;
}

.text-muted {
  color: #9ca3af;
}
</style>
