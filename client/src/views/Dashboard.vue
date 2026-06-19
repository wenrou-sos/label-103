<template>
  <div class="dashboard">
    <div class="card-section">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-icon">
              <DollarOutlined style="color: #1890ff" />
            </div>
            <div class="stat-value">¥{{ formatNumber(stats.today?.ticketSales || 0) }}</div>
            <div class="stat-label">今日门票销售额</div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-icon">
              <CreditCardOutlined style="color: #52c41a" />
            </div>
            <div class="stat-value">¥{{ formatNumber(stats.today?.cardSales || 0) }}</div>
            <div class="stat-label">今日年卡销售额</div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-icon">
              <ShoppingCartOutlined style="color: #faad14" />
            </div>
            <div class="stat-value">¥{{ formatNumber(stats.today?.consumption || 0) }}</div>
            <div class="stat-label">今日消费额</div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-icon">
              <TeamOutlined :style="{ color: parkStatusColor }" />
            </div>
            <div class="stat-value" :style="{ color: parkStatusColor }">
              {{ stats.total?.inPark || 0 }}
            </div>
            <div class="stat-label">当前在园人数</div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <div class="card-section">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-card title="客流趋势">
            <v-chart class="chart" :option="visitorTrendOption" autoresize />
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="销售统计">
            <v-chart class="chart" :option="salesChartOption" autoresize />
          </a-card>
        </a-col>
      </a-row>
    </div>

    <div class="card-section">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-card title="园区状态">
            <div class="park-status">
              <div class="status-item">
                <span class="status-label">最大承载量</span>
                <span class="status-value">{{ stats.total?.inPark ? stats.parkStatus?.maxCapacity : 10000 }} 人</span>
              </div>
              <div class="status-item">
                <span class="status-label">当前客流</span>
                <span class="status-value">{{ stats.total?.inPark || 0 }} 人</span>
              </div>
              <div class="status-item">
                <span class="status-label">承载率</span>
                <span class="status-value" :style="{ color: parkStatusColor }">
                  {{ stats.parkStatus?.percentage || 0 }}%
                </span>
              </div>
              <a-progress
                :percent="parseFloat(stats.parkStatus?.percentage || 0)"
                :status="parkProgressStatus"
                :show-info="false"
              />
              <a-alert
                :message="stats.parkStatus?.message || '园区运行正常'"
                :type="parkAlertType"
                show-icon
                class="status-alert"
              />
            </div>
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card title="票种销售占比">
            <v-chart class="chart-sm" :option="ticketTypeOption" autoresize />
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card title="即将到期年卡">
            <div class="expiring-cards">
              <div class="expiring-count">
                <span class="count">{{ expiringCardsCount }}</span>
                <span class="label">张年卡30天内到期</span>
              </div>
              <a-button type="primary" size="small" @click="goToExpiring">查看详情</a-button>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboardStats } from '@/api/statistics'
import { getHourlyTrend } from '@/api/visitor'
import { getTicketTypeStatistics } from '@/api/statistics'
import { getExpiringCards } from '@/api/statistics'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  DollarOutlined,
  CreditCardOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

const router = useRouter()

const stats = ref({})
const hourlyData = ref([])
const ticketTypeStats = ref([])
const expiringCardsCount = ref(0)

const parkStatusColor = computed(() => {
  const status = stats.value.parkStatus?.status
  if (status === 'full') return '#ff4d4f'
  if (status === 'warning') return '#faad14'
  return '#52c41a'
})

const parkProgressStatus = computed(() => {
  const status = stats.value.parkStatus?.status
  if (status === 'full') return 'exception'
  if (status === 'warning') return 'active'
  return 'normal'
})

const parkAlertType = computed(() => {
  const status = stats.value.parkStatus?.status
  if (status === 'full') return 'error'
  if (status === 'warning') return 'warning'
  return 'success'
})

const visitorTrendOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: hourlyData.value.map((item) => item.hour),
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '入园人数',
      type: 'line',
      smooth: true,
      data: hourlyData.value.map((item) => item.count),
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(24, 144, 255, 0.5)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
          ],
        },
      },
      lineStyle: {
        color: '#1890ff',
        width: 2,
      },
      itemStyle: {
        color: '#1890ff',
      },
    },
  ],
}))

const salesChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  legend: {
    data: ['门票', '年卡', '消费'],
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ['今日'],
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '¥{value}',
    },
  },
  series: [
    {
      name: '门票',
      type: 'bar',
      data: [stats.value.today?.ticketSales || 0],
      itemStyle: { color: '#1890ff' },
    },
    {
      name: '年卡',
      type: 'bar',
      data: [stats.value.today?.cardSales || 0],
      itemStyle: { color: '#52c41a' },
    },
    {
      name: '消费',
      type: 'bar',
      data: [stats.value.today?.consumption || 0],
      itemStyle: { color: '#faad14' },
    },
  ],
}))

const ticketTypeOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} 张 ({d}%)',
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center',
  },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: false,
      },
      data: ticketTypeStats.value.map((item, index) => ({
        name: item.ticketTypeName || '其他',
        value: item.quantity || 0,
        itemStyle: {
          color: ['#1890ff', '#52c41a', '#faad14', '#722ed1'][index % 4],
        },
      })),
    },
  ],
}))

const formatNumber = (num) => {
  return Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const loadData = async () => {
  try {
    stats.value = await getDashboardStats()
  } catch (e) {
    // ignore
  }

  try {
    hourlyData.value = await getHourlyTrend()
  } catch (e) {
    // ignore
  }

  try {
    ticketTypeStats.value = await getTicketTypeStatistics()
  } catch (e) {
    // ignore
  }

  try {
    const result = await getExpiringCards({ days: 30 })
    expiringCardsCount.value = result.count
  } catch (e) {
    // ignore
  }
}

const goToExpiring = () => {
  router.push('/statistics')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  text-align: center;
}

.stat-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.chart {
  height: 300px;
}

.chart-sm {
  height: 200px;
}

.park-status {
  .status-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .status-label {
    color: #6b7280;
  }

  .status-value {
    font-weight: 600;
    color: #1f2937;
  }

  .status-alert {
    margin-top: 16px;
  }
}

.expiring-cards {
  text-align: center;

  .expiring-count {
    margin-bottom: 20px;

    .count {
      font-size: 36px;
      font-weight: 700;
      color: #faad14;
      display: block;
    }

    .label {
      color: #6b7280;
      font-size: 14px;
    }
  }
}
</style>
