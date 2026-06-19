<template>
  <div class="visitor-monitor">
    <div class="card-section">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-icon">
              <TeamOutlined :style="{ color: statusColor }" />
            </div>
            <div class="stat-value" :style="{ color: statusColor }">
              {{ stats.currentInPark || 0 }}
            </div>
            <div class="stat-label">当前在园人数</div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-icon">
              <LoginOutlined style="color: #52c41a" />
            </div>
            <div class="stat-value" style="color: #52c41a">
              {{ stats.todayEntry || 0 }}
            </div>
            <div class="stat-label">今日入园数</div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-icon">
              <LogoutOutlined style="color: #faad14" />
            </div>
            <div class="stat-value" style="color: #faad14">
              {{ stats.todayExit || 0 }}
            </div>
            <div class="stat-label">今日出园数</div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-icon">
              <SafetyOutlined style="color: #1890ff" />
            </div>
            <div class="stat-value" style="color: #1890ff">
              {{ stats.maxCapacity || 10000 }}
            </div>
            <div class="stat-label">最大承载量</div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <div class="card-section">
      <a-card :class="['park-status-card', `status-${parkStatus}`]">
        <div class="status-header">
          <div class="status-title">园区状态</div>
          <a-badge :status="badgeStatus" :text="statusText" />
        </div>
        <div class="status-content">
          <div class="status-info">
            <div class="info-item">
              <span class="info-label">当前客流</span>
              <span class="info-value">{{ stats.currentInPark || 0 }} 人</span>
            </div>
            <div class="info-item">
              <span class="info-label">承载率</span>
              <span class="info-value">{{ loadRate }}%</span>
            </div>
          </div>
          <div class="status-progress">
            <a-progress
              :percent="loadRate"
              :status="progressStatus"
              :show-info="false"
              stroke-width="20"
            />
          </div>
        </div>
        <div class="status-alert">
          <a-alert
            :message="statusMessage"
            :type="alertType"
            show-icon
          />
        </div>
      </a-card>
    </div>

    <div class="card-section">
      <a-row :gutter="16">
        <a-col :span="16">
          <a-card title="小时客流趋势">
            <v-chart class="chart" :option="trendChartOption" autoresize />
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card title="实时入园记录">
            <a-table
              :columns="recentColumns"
              :data-source="recentVisitors"
              :loading="loading"
              :pagination="false"
              size="small"
              row-key="id"
              class="recent-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'visitorName'">
                  {{ record.visitorName || '-' }}
                </template>
                <template v-else-if="column.key === 'visitorType'">
                  <a-tag :color="typeColors[record.visitorType]" style="font-size: 10px;">
                    {{ typeMap[record.visitorType] }}
                  </a-tag>
                </template>
                <template v-else-if="column.key === 'entryTime'">
                  {{ formatTime(record.entryTime) }}
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getCurrentVisitorCount, getTodayStatistics, getHourlyTrend, getVisitorRecords } from '@/api/visitor'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import dayjs from 'dayjs'
import {
  TeamOutlined,
  LoginOutlined,
  LogoutOutlined,
  SafetyOutlined,
} from '@ant-design/icons-vue'

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

const loading = ref(false)
const stats = ref({})
const hourlyData = ref([])
const recentVisitors = ref([])

let refreshTimer = null

const parkStatus = computed(() => {
  const rate = loadRate.value
  if (rate >= 100) return 'full'
  if (rate >= 80) return 'warning'
  return 'normal'
})

const statusColor = computed(() => {
  const status = parkStatus.value
  if (status === 'full') return '#ff4d4f'
  if (status === 'warning') return '#faad14'
  return '#52c41a'
})

const badgeStatus = computed(() => {
  const status = parkStatus.value
  if (status === 'full') return 'error'
  if (status === 'warning') return 'warning'
  return 'success'
})

const statusText = computed(() => {
  const status = parkStatus.value
  if (status === 'full') return '满员'
  if (status === 'warning') return '预警'
  return '正常'
})

const progressStatus = computed(() => {
  const status = parkStatus.value
  if (status === 'full') return 'exception'
  if (status === 'warning') return 'active'
  return 'normal'
})

const alertType = computed(() => {
  const status = parkStatus.value
  if (status === 'full') return 'error'
  if (status === 'warning') return 'warning'
  return 'success'
})

const statusMessage = computed(() => {
  const status = parkStatus.value
  if (status === 'full') return '园区已达最大承载量，暂停入园！'
  if (status === 'warning') return '园区客流较多，请注意疏导！'
  return '园区运行正常，客流平稳'
})

const loadRate = computed(() => {
  const current = stats.value.currentInPark || 0
  const max = stats.value.maxCapacity || 10000
  return Math.min(Math.round((current / max) * 100), 100)
})

const trendChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: ['入园人数', '出园人数'],
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
      data: hourlyData.value.map((item) => item.entryCount || 0),
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(82, 196, 26, 0.5)' },
            { offset: 1, color: 'rgba(82, 196, 26, 0.05)' },
          ],
        },
      },
      lineStyle: {
        color: '#52c41a',
        width: 2,
      },
      itemStyle: {
        color: '#52c41a',
      },
    },
    {
      name: '出园人数',
      type: 'line',
      smooth: true,
      data: hourlyData.value.map((item) => item.exitCount || 0),
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(250, 173, 20, 0.5)' },
            { offset: 1, color: 'rgba(250, 173, 20, 0.05)' },
          ],
        },
      },
      lineStyle: {
        color: '#faad14',
        width: 2,
      },
      itemStyle: {
        color: '#faad14',
      },
    },
  ],
}))

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

const recentColumns = [
  { title: '游客', dataIndex: 'visitorName', key: 'visitorName', width: 80 },
  { title: '类型', key: 'visitorType', width: 60 },
  { title: '入园时间', key: 'entryTime', width: 100 },
]

const formatTime = (date) => {
  return date ? dayjs(date).format('HH:mm:ss') : '-'
}

const loadData = async () => {
  loading.value = true
  try {
    const [currentRes, todayRes, hourlyRes, recentRes] = await Promise.all([
      getCurrentVisitorCount().catch(() => ({})),
      getTodayStatistics().catch(() => ({})),
      getHourlyTrend().catch(() => []),
      getVisitorRecords({ page: 1, pageSize: 10, inPark: true }).catch(() => ({ list: [] })),
    ])
    stats.value = {
      currentInPark: currentRes.count || currentRes.currentInPark || 0,
      todayEntry: todayRes.todayEntry || todayRes.entryCount || 0,
      todayExit: todayRes.todayExit || todayRes.exitCount || 0,
      maxCapacity: currentRes.maxCapacity || 10000,
    }
    hourlyData.value = hourlyRes
    recentVisitors.value = recentRes.list || []
  } catch (e) {
    // ignore
  } finally {
    loading.value = false
  }
}

const startAutoRefresh = () => {
  stopAutoRefresh()
  refreshTimer = setInterval(() => {
    loadData()
  }, 30000)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

onMounted(() => {
  loadData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.visitor-monitor {
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
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.park-status-card {
  border-radius: 8px;

  &.status-normal {
    border-left: 4px solid #52c41a;
  }

  &.status-warning {
    border-left: 4px solid #faad14;
  }

  &.status-full {
    border-left: 4px solid #ff4d4f;
  }
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .status-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }
}

.status-content {
  display: flex;
  align-items: center;
  gap: 40px;
  margin-bottom: 16px;
}

.status-info {
  flex: 1;

  .info-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;

    .info-label {
      color: #6b7280;
      font-size: 14px;
    }

    .info-value {
      font-weight: 600;
      color: #1f2937;
      font-size: 16px;
    }
  }
}

.status-progress {
  flex: 2;
}

.status-alert {
  margin-top: 8px;
}

.chart {
  height: 350px;
}

.recent-table {
  :deep(.ant-table-thead > tr > th) {
    background: #fafafa;
  }
}
</style>
