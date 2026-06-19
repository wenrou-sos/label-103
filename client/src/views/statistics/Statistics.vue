<template>
  <div class="statistics-page">
    <a-card>
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="sales" tab="销售统计">
          <div class="tab-content">
            <div class="filter-bar">
              <a-range-picker
                v-model:value="salesDateRange"
                :disabled-date="disabledDate"
                @change="loadSalesData"
              />
            </div>
            <a-card title="销售额趋势" class="chart-card">
              <v-chart class="chart" :option="salesTrendOption" autoresize />
            </a-card>
          </div>
        </a-tab-pane>

        <a-tab-pane key="ticket" tab="票种统计">
          <div class="tab-content">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-card title="票种销售数量占比" class="chart-card">
                  <v-chart class="chart" :option="ticketTypePieOption" autoresize />
                </a-card>
              </a-col>
              <a-col :span="12">
                <a-card title="票种销售额" class="chart-card">
                  <v-chart class="chart" :option="ticketTypeBarOption" autoresize />
                </a-card>
              </a-col>
            </a-row>
          </div>
        </a-tab-pane>

        <a-tab-pane key="card" tab="年卡统计">
          <div class="tab-content">
            <a-card title="年卡类型销售占比" class="chart-card">
              <v-chart class="chart" :option="cardTypePieOption" autoresize />
            </a-card>
          </div>
        </a-tab-pane>

        <a-tab-pane key="consumption" tab="消费统计">
          <div class="tab-content">
            <a-card title="消费类别占比" class="chart-card">
              <v-chart class="chart" :option="consumptionPieOption" autoresize />
            </a-card>
          </div>
        </a-tab-pane>

        <a-tab-pane key="expiring" tab="到期预警">
          <div class="tab-content">
            <a-alert
              message={`共 ${expiringCards.list?.length || 0} 张年卡将在30天内到期`}
              type="warning"
              show-icon
              class="expiring-alert"
            />
            <a-table
              :columns="expiringColumns"
              :data-source="expiringCards.list"
              :loading="expiringLoading"
              :pagination="false"
              row-key="id"
              class="expiring-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'cardType'">
                  {{ record.AnnualCardType?.name || '-' }}
                </template>
                <template v-else-if="column.key === 'validUntil'">
                  <span :class="{ 'expiring-soon': isExpiringSoon(record.expireDate) }">
                    {{ record.expireDate ? dayjs(record.expireDate).format('YYYY-MM-DD') : '-' }}
                  </span>
                </template>
                <template v-else-if="column.key === 'daysLeft'">
                  <a-tag :color="getDaysLeftColor(record.expireDate)">
                    {{ getDaysLeft(record.expireDate) }}天
                  </a-tag>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import {
  getSalesStatistics,
  getTicketTypeStatistics,
  getCardTypeStatistics,
  getConsumptionCategoryStatistics,
  getExpiringCards,
} from '@/api/statistics'
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

const activeTab = ref('sales')

const salesDateRange = ref([dayjs().subtract(30, 'day').toDate(), dayjs().toDate()])
const salesData = ref([])
const ticketTypeData = ref([])
const cardTypeData = ref([])
const consumptionData = ref([])

const expiringLoading = ref(false)
const expiringCards = ref({ list: [] })

const disabledDate = (current) => {
  return current && current > dayjs().endOf('day')
}

const salesTrendOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
  },
  legend: {
    data: ['门票销售', '年卡销售', '消费'],
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
    data: salesData.value.map((item) => item.date),
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '¥{value}',
    },
  },
  series: [
    {
      name: '门票销售',
      type: 'line',
      smooth: true,
      data: salesData.value.map((item) => item.ticketSales || 0),
      lineStyle: { color: '#1890ff', width: 2 },
      itemStyle: { color: '#1890ff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.02)' },
          ],
        },
      },
    },
    {
      name: '年卡销售',
      type: 'line',
      smooth: true,
      data: salesData.value.map((item) => item.cardSales || 0),
      lineStyle: { color: '#52c41a', width: 2 },
      itemStyle: { color: '#52c41a' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
            { offset: 1, color: 'rgba(82, 196, 26, 0.02)' },
          ],
        },
      },
    },
    {
      name: '消费',
      type: 'line',
      smooth: true,
      data: salesData.value.map((item) => item.consumption || 0),
      lineStyle: { color: '#faad14', width: 2 },
      itemStyle: { color: '#faad14' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(250, 173, 20, 0.3)' },
            { offset: 1, color: 'rgba(250, 173, 20, 0.02)' },
          ],
        },
      },
    },
  ],
}))

const ticketTypePieOption = computed(() => ({
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
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: false,
      },
      data: ticketTypeData.value.map((item, index) => ({
        name: item.ticketTypeName || '其他',
        value: item.quantity || 0,
        itemStyle: {
          color: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2'][index % 6],
        },
      })),
    },
  ],
}))

const ticketTypeBarOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params) => {
      return `${params[0].name}<br/>销售额：¥${params[0].value}`
    },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ticketTypeData.value.map((item) => item.ticketTypeName || '其他'),
    axisLabel: {
      interval: 0,
      rotate: 30,
    },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '¥{value}',
    },
  },
  series: [
    {
      type: 'bar',
      barWidth: '50%',
      data: ticketTypeData.value.map((item, index) => ({
        value: item.salesAmount || 0,
        itemStyle: {
          color: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2'][index % 6],
          borderRadius: [4, 4, 0, 0],
        },
      })),
    },
  ],
}))

const cardTypePieOption = computed(() => ({
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
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%',
      },
      data: cardTypeData.value.map((item, index) => ({
        name: item.cardTypeName || '其他',
        value: item.count || 0,
        itemStyle: {
          color: ['#52c41a', '#1890ff', '#faad14', '#722ed1', '#eb2f96'][index % 5],
        },
      })),
    },
  ],
}))

const consumptionPieOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: ¥{c} ({d}%)',
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center',
  },
  series: [
    {
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%',
      },
      data: consumptionData.value.map((item, index) => ({
        name: item.categoryName || '其他',
        value: item.amount || 0,
        itemStyle: {
          color: ['#faad14', '#1890ff', '#52c41a', '#722ed1', '#eb2f96', '#13c2c2'][index % 6],
        },
      })),
    },
  ],
}))

const expiringColumns = [
  { title: '卡号', dataIndex: 'cardNo', key: 'cardNo', width: 160 },
  { title: '卡类型', key: 'cardType', width: 120 },
  { title: '持卡人', dataIndex: 'holderName', key: 'holderName', width: 100 },
  { title: '手机号', dataIndex: 'holderPhone', key: 'holderPhone', width: 120 },
  { title: '有效期至', key: 'validUntil', width: 140 },
  { title: '剩余天数', key: 'daysLeft', width: 100 },
]

const getDaysLeft = (validUntil) => {
  if (!validUntil) return 0
  return dayjs(validUntil).diff(dayjs(), 'day')
}

const getDaysLeftColor = (validUntil) => {
  const days = getDaysLeft(validUntil)
  if (days <= 7) return 'red'
  if (days <= 15) return 'orange'
  return 'green'
}

const isExpiringSoon = (validUntil) => {
  return getDaysLeft(validUntil) <= 7
}

const loadSalesData = async () => {
  if (!salesDateRange.value || salesDateRange.value.length !== 2) return
  try {
    const params = {
      startDate: dayjs(salesDateRange.value[0]).format('YYYY-MM-DD'),
      endDate: dayjs(salesDateRange.value[1]).format('YYYY-MM-DD'),
    }
    const result = await getSalesStatistics(params)
    salesData.value = result.list || result || []
  } catch (e) {
    // ignore
  }
}

const loadTicketTypeData = async () => {
  try {
    const result = await getTicketTypeStatistics()
    ticketTypeData.value = result.list || result || []
  } catch (e) {
    // ignore
  }
}

const loadCardTypeData = async () => {
  try {
    const result = await getCardTypeStatistics()
    cardTypeData.value = result.list || result || []
  } catch (e) {
    // ignore
  }
}

const loadConsumptionData = async () => {
  try {
    const result = await getConsumptionCategoryStatistics()
    consumptionData.value = result.list || result || []
  } catch (e) {
    // ignore
  }
}

const loadExpiringCards = async () => {
  expiringLoading.value = true
  try {
    const result = await getExpiringCards({ days: 30 })
    expiringCards.value = { list: result.list || result || [] }
  } catch (e) {
    // ignore
  } finally {
    expiringLoading.value = false
  }
}

onMounted(() => {
  loadSalesData()
  loadTicketTypeData()
  loadCardTypeData()
  loadConsumptionData()
  loadExpiringCards()
})
</script>

<style scoped>
.statistics-page {
  padding: 0;
}

.tab-content {
  padding-top: 16px;
}

.filter-bar {
  margin-bottom: 16px;
}

.chart-card {
  margin-bottom: 16px;
}

.chart {
  height: 350px;
}

.expiring-alert {
  margin-bottom: 16px;
}

.expiring-table {
  margin-top: 16px;
}

.expiring-soon {
  color: #ff4d4f;
  font-weight: 600;
}
</style>
