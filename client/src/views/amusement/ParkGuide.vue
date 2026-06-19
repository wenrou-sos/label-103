<template>
  <div class="park-guide-page">
    <a-card title="园区游玩指南">
      <template #extra>
        <a-button type="primary" @click="checkAccessVisible = true">
          <template #icon><SafetyOutlined /></template>
          准入查询
        </a-button>
      </template>

      <a-alert
        type="info"
        show-icon
        message="此处展示园区全部游玩项目及准入要求。点击右上角「准入查询」可输入游客信息，查询该游客可游玩的项目。"
        style="margin-bottom: 16px"
      />

      <a-spin :spinning="loading">
        <a-empty v-if="!projects.length" description="暂无游玩项目" />
        <div v-else class="projects-grid">
          <div
            v-for="project in projects"
            :key="project.id"
            class="project-card"
          >
            <div class="project-card-header">
              <a-tag :color="categoryColors[project.category]">
                {{ categoryMap[project.category] || project.category }}
              </a-tag>
              <a-tag v-if="project.isCharged" color="orange">¥{{ project.price }}</a-tag>
              <a-tag v-else color="green">免费</a-tag>
            </div>
            <div class="project-card-name">{{ project.name }}</div>
            <div class="project-card-location" v-if="project.location">
              <EnvironmentOutlined /> {{ project.location }}
            </div>
            <a-divider style="margin: 12px 0" />
            <div class="project-card-req">
              <div class="req-row">
                <span class="req-label">身高要求</span>
                <span class="req-value">
                  <span v-if="(project.minHeight === null || project.minHeight === undefined) && (project.maxHeight === null || project.maxHeight === undefined)" class="text-muted">无限制</span>
                  <span v-else>
                    <span v-if="project.minHeight !== null && project.minHeight !== undefined">≥ {{ project.minHeight }}cm</span>
                    <span v-if="project.minHeight !== null && project.minHeight !== undefined && project.maxHeight !== null && project.maxHeight !== undefined"> / </span>
                    <span v-if="project.maxHeight !== null && project.maxHeight !== undefined">≤ {{ project.maxHeight }}cm</span>
                  </span>
                </span>
              </div>
              <div class="req-row">
                <span class="req-label">年龄要求</span>
                <span class="req-value">
                  <span v-if="(project.minAge === null || project.minAge === undefined) && (project.maxAge === null || project.maxAge === undefined)" class="text-muted">无限制</span>
                  <span v-else>
                    <span v-if="project.minAge !== null && project.minAge !== undefined">≥ {{ project.minAge }}岁</span>
                    <span v-if="project.minAge !== null && project.minAge !== undefined && project.maxAge !== null && project.maxAge !== undefined"> / </span>
                    <span v-if="project.maxAge !== null && project.maxAge !== undefined">≤ {{ project.maxAge }}岁</span>
                  </span>
                </span>
              </div>
              <div class="req-row" v-if="project.duration">
                <span class="req-label">游玩时长</span>
                <span class="req-value">{{ project.duration }} 分钟</span>
              </div>
            </div>
            <div class="project-card-desc" v-if="project.description">
              {{ project.description }}
            </div>
            <div class="project-card-remarks" v-if="project.remarks">
              <InfoCircleOutlined /> {{ project.remarks }}
            </div>
          </div>
        </div>
      </a-spin>
    </a-card>

    <a-modal
      v-model:open="checkAccessVisible"
      title="游客准入查询"
      :width="720"
      @ok="handleCheckAccess"
      ok-text="查询"
      cancel-text="关闭"
      :confirm-loading="checkLoading"
    >
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="游客身高(cm)">
              <a-input-number
                v-model:value="visitorInfo.height"
                :min="0"
                :max="300"
                :precision="1"
                style="width: 100%"
                placeholder="可选"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="游客年龄(岁)">
              <a-input-number
                v-model:value="visitorInfo.age"
                :min="0"
                :max="120"
                style="width: 100%"
                placeholder="可选"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="身份证号">
              <a-input
                v-model:value="visitorInfo.idCard"
                placeholder="可选，自动算年龄"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-alert
          type="info"
          show-icon
          message="填写任意一项即可查询，填写身份证号可自动推算年龄。"
        />
      </a-form>

      <div v-if="accessResult" class="access-result">
        <a-divider />
        <a-row :gutter="16">
          <a-col :span="6">
            <a-statistic title="项目总数" :value="accessResult.summary.total" />
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="可游玩"
              :value="accessResult.summary.accessibleCount"
              :value-style="{ color: '#52c41a' }"
            />
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="待确认"
              :value="accessResult.summary.unknownCount"
              :value-style="{ color: '#faad14' }"
            />
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="不可游玩"
              :value="accessResult.summary.inaccessibleCount"
              :value-style="{ color: '#ff4d4f' }"
            />
          </a-col>
        </a-row>

        <div v-if="accessResult.inaccessible.length" style="margin-top: 16px">
          <a-alert
            type="error"
            show-icon
            :message="`以下 ${accessResult.inaccessible.length} 个项目该游客无法游玩`"
            style="margin-bottom: 8px"
          />
          <a-list size="small" bordered :data-source="accessResult.inaccessible">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta :title="item.name">
                  <template #description>
                    <span class="reason-text">{{ item.failReasons.join('；') }}</span>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </div>

        <div v-if="accessResult.unknown && accessResult.unknown.length" style="margin-top: 16px">
          <a-alert
            type="warning"
            show-icon
            :message="`以下 ${accessResult.unknown.length} 个项目因游客信息不全无法确认，请补充信息后重新查询`"
            style="margin-bottom: 8px"
          />
          <a-list size="small" bordered :data-source="accessResult.unknown">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta :title="item.name">
                  <template #description>
                    <span class="reason-text unknown">{{ item.infoMissingReasons.join('；') }}</span>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </div>

        <div v-if="accessResult.accessible.length" style="margin-top: 16px">
          <a-alert
            type="success"
            show-icon
            :message="`以下 ${accessResult.accessible.length} 个项目该游客可游玩`"
            style="margin-bottom: 8px"
          />
          <a-list size="small" bordered :data-source="accessResult.accessible">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    {{ item.name }}
                    <a-tag v-if="item.isCharged" color="orange" style="margin-left: 8px">¥{{ item.price }}</a-tag>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getActiveAmusementProjects, checkAllAccess } from '@/api/amusementProject'
import {
  SafetyOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue'

const loading = ref(false)
const checkLoading = ref(false)
const checkAccessVisible = ref(false)
const accessResult = ref(null)

const projects = ref([])

const visitorInfo = reactive({
  height: null,
  age: null,
  idCard: '',
})

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

const loadData = async () => {
  loading.value = true
  try {
    projects.value = await getActiveAmusementProjects()
  } catch (e) {
    // ignore
  } finally {
    loading.value = false
  }
}

const hasValue = (val) => val !== null && val !== undefined && val !== ''

const handleCheckAccess = async () => {
  const hasHeight = hasValue(visitorInfo.height)
  const hasAge = hasValue(visitorInfo.age)
  const hasIdCard = !!visitorInfo.idCard
  if (!hasHeight && !hasAge && !hasIdCard) {
    message.warning('请至少填写一项游客信息')
    return
  }
  checkLoading.value = true
  try {
    const params = {}
    if (hasHeight) params.height = visitorInfo.height
    if (hasAge) params.age = visitorInfo.age
    if (hasIdCard) params.idCard = visitorInfo.idCard
    accessResult.value = await checkAllAccess(params)
  } catch (e) {
    // ignore
  } finally {
    checkLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.park-guide-page {
  padding: 0;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.project-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  transition: box-shadow 0.3s ease;
}

.project-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.project-card-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.project-card-location {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.project-card-req .req-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
}

.project-card-req .req-label {
  color: #6b7280;
}

.project-card-req .req-value {
  color: #1f2937;
}

.project-card-desc {
  font-size: 13px;
  color: #6b7280;
  margin-top: 8px;
  line-height: 1.6;
}

.project-card-remarks {
  font-size: 12px;
  color: #faad14;
  margin-top: 8px;
  padding: 6px 8px;
  background: #fffbe6;
  border-radius: 4px;
}

.text-muted {
  color: #9ca3af;
}

.reason-text {
  color: #ff4d4f;
  font-size: 12px;
}

.reason-text.unknown {
  color: #faad14;
}

.access-result {
  margin-top: 16px;
}
</style>
