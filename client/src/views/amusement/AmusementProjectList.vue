<template>
  <div class="amusement-project-list">
    <div class="table-toolbar">
      <div class="filter-bar">
        <a-select
          v-model:value="filters.category"
          placeholder="项目类别"
          style="width: 140px"
          allow-clear
          @change="handleSearch"
        >
          <a-select-option
            v-for="item in categoryOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </a-select-option>
        </a-select>
        <a-select
          v-model:value="filters.isActive"
          placeholder="状态"
          style="width: 120px"
          allow-clear
          @change="handleSearch"
        >
          <a-select-option :value="true">启用</a-select-option>
          <a-select-option :value="false">停用</a-select-option>
        </a-select>
        <a-input-search
          v-model:value="filters.keyword"
          placeholder="搜索项目名称/编码/位置"
          style="width: 260px"
          allow-clear
          @search="handleSearch"
        />
      </div>
      <div>
        <a-button type="primary" @click="openCreateModal">
          <template #icon><PlusOutlined /></template>
          新增项目
        </a-button>
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="data.list"
      :loading="loading"
      :pagination="tablePagination"
      :scroll="{ x: 1500 }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <div>
            <div class="project-name">{{ record.name }}</div>
            <div class="project-code">{{ record.code }}</div>
          </div>
        </template>
        <template v-else-if="column.key === 'category'">
          <a-tag :color="categoryColors[record.category]">
            {{ categoryMap[record.category] || record.category }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'heightReq'">
          <span v-if="(record.minHeight === null || record.minHeight === undefined) && (record.maxHeight === null || record.maxHeight === undefined)" class="text-muted">无限制</span>
          <span v-else>
            <span v-if="record.minHeight !== null && record.minHeight !== undefined">≥ {{ record.minHeight }}cm</span>
            <span v-if="record.minHeight !== null && record.minHeight !== undefined && record.maxHeight !== null && record.maxHeight !== undefined"> / </span>
            <span v-if="record.maxHeight !== null && record.maxHeight !== undefined">≤ {{ record.maxHeight }}cm</span>
          </span>
        </template>
        <template v-else-if="column.key === 'ageReq'">
          <span v-if="(record.minAge === null || record.minAge === undefined) && (record.maxAge === null || record.maxAge === undefined)" class="text-muted">无限制</span>
          <span v-else>
            <span v-if="record.minAge !== null && record.minAge !== undefined">≥ {{ record.minAge }}岁</span>
            <span v-if="record.minAge !== null && record.minAge !== undefined && record.maxAge !== null && record.maxAge !== undefined"> / </span>
            <span v-if="record.maxAge !== null && record.maxAge !== undefined">≤ {{ record.maxAge }}岁</span>
          </span>
        </template>
        <template v-else-if="column.key === 'charge'">
          <div v-if="record.isCharged">
            <a-tag color="orange">收费</a-tag>
            <span class="price-amount">¥{{ record.price }}</span>
          </div>
          <a-tag v-else color="green">免费</a-tag>
        </template>
        <template v-else-if="column.key === 'isActive'">
          <a-tag :color="record.isActive ? 'green' : 'default'">
            {{ record.isActive ? '启用' : '停用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="openEditModal(record)">编辑</a-button>
          <a-popconfirm
            title="确定删除该项目吗？"
            ok-text="确定"
            cancel-text="取消"
            ok-type="danger"
            @confirm="handleDelete(record)"
          >
            <a-button type="link" size="small" danger>删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="formModalVisible"
      :title="editingId ? '编辑游玩项目' : '新增游玩项目'"
      :width="680"
      @ok="handleSubmit"
      ok-text="保存"
      cancel-text="取消"
      :confirm-loading="submitLoading"
    >
      <a-form :model="formData" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="项目名称" required>
              <a-input v-model:value="formData.name" placeholder="如：过山车" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="项目编码" required>
              <a-input v-model:value="formData.code" placeholder="如：RC001" :disabled="!!editingId" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="项目类别">
              <a-select v-model:value="formData.category">
                <a-select-option
                  v-for="item in categoryOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="项目位置">
              <a-input v-model:value="formData.location" placeholder="如：A区-01" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider orientation="left">准入要求</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="最低身高(cm)">
              <a-input-number
                v-model:value="formData.minHeight"
                :min="0"
                :max="300"
                :precision="1"
                style="width: 100%"
                placeholder="留空表示无限制"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="最高身高(cm)">
              <a-input-number
                v-model:value="formData.maxHeight"
                :min="0"
                :max="300"
                :precision="1"
                style="width: 100%"
                placeholder="留空表示无限制"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="最低年龄(岁)">
              <a-input-number
                v-model:value="formData.minAge"
                :min="0"
                :max="120"
                style="width: 100%"
                placeholder="留空表示无限制"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="最高年龄(岁)">
              <a-input-number
                v-model:value="formData.maxAge"
                :min="0"
                :max="120"
                style="width: 100%"
                placeholder="留空表示无限制"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider orientation="left">收费与运营</a-divider>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="是否收费">
              <a-switch v-model:checked="formData.isCharged" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="收费金额(元)">
              <a-input-number
                v-model:value="formData.price"
                :min="0"
                :precision="2"
                style="width: 100%"
                :disabled="!formData.isCharged"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="单次时长(分钟)">
              <a-input-number
                v-model:value="formData.duration"
                :min="0"
                style="width: 100%"
                placeholder="可选"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="单次承载(人)">
              <a-input-number
                v-model:value="formData.capacity"
                :min="0"
                style="width: 100%"
                placeholder="可选"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="排序权重">
              <a-input-number
                v-model:value="formData.sortOrder"
                :min="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="启用状态">
              <a-switch v-model:checked="formData.isActive" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="项目描述">
          <a-textarea
            v-model:value="formData.description"
            :rows="2"
            placeholder="项目介绍"
          />
        </a-form-item>
        <a-form-item label="注意事项">
          <a-textarea
            v-model:value="formData.remarks"
            :rows="2"
            placeholder="如：心脏病患者禁止乘坐"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  getAmusementProjects,
  createAmusementProject,
  updateAmusementProject,
  deleteAmusementProject,
} from '@/api/amusementProject'
import { PlusOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const submitLoading = ref(false)
const formModalVisible = ref(false)
const editingId = ref(null)

const data = ref({
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
})

const filters = reactive({
  category: undefined,
  isActive: undefined,
  keyword: '',
})

const defaultForm = () => ({
  name: '',
  code: '',
  description: '',
  category: 'other',
  location: '',
  minHeight: null,
  maxHeight: null,
  minAge: null,
  maxAge: null,
  isCharged: false,
  price: 0,
  duration: null,
  capacity: null,
  remarks: '',
  sortOrder: 0,
  isActive: true,
})

const formData = reactive(defaultForm())

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

const categoryOptions = Object.keys(categoryMap).map((key) => ({
  value: key,
  label: categoryMap[key],
}))

const columns = [
  { title: '项目名称', key: 'name', width: 160 },
  { title: '类别', key: 'category', width: 100 },
  { title: '位置', dataIndex: 'location', key: 'location', width: 100 },
  { title: '身高要求', key: 'heightReq', width: 150 },
  { title: '年龄要求', key: 'ageReq', width: 130 },
  { title: '收费', key: 'charge', width: 120 },
  { title: '状态', key: 'isActive', width: 90 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
]

const tablePagination = computed(() => ({
  current: data.value.page,
  pageSize: data.value.pageSize,
  total: data.value.total,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
}))

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: data.value.page,
      pageSize: data.value.pageSize,
      category: filters.category,
      isActive: filters.isActive,
      keyword: filters.keyword,
    }
    const result = await getAmusementProjects(params)
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

const handleTableChange = (pagination) => {
  data.value.page = pagination.current
  data.value.pageSize = pagination.pageSize
  loadData()
}

const resetForm = () => {
  Object.assign(formData, defaultForm())
}

const openCreateModal = () => {
  editingId.value = null
  resetForm()
  formModalVisible.value = true
}

const openEditModal = (record) => {
  editingId.value = record.id
  resetForm()
  Object.assign(formData, {
    name: record.name,
    code: record.code,
    description: record.description || '',
    category: record.category || 'other',
    location: record.location || '',
    minHeight: record.minHeight,
    maxHeight: record.maxHeight,
    minAge: record.minAge,
    maxAge: record.maxAge,
    isCharged: record.isCharged,
    price: record.price,
    duration: record.duration,
    capacity: record.capacity,
    remarks: record.remarks || '',
    sortOrder: record.sortOrder || 0,
    isActive: record.isActive,
  })
  formModalVisible.value = true
}

const handleSubmit = async () => {
  if (!formData.name) {
    message.warning('请输入项目名称')
    return
  }
  if (!formData.code) {
    message.warning('请输入项目编码')
    return
  }
  submitLoading.value = true
  try {
    if (editingId.value) {
      await updateAmusementProject(editingId.value, formData)
      message.success('更新成功')
    } else {
      await createAmusementProject(formData)
      message.success('创建成功')
    }
    formModalVisible.value = false
    loadData()
  } catch (e) {
    // ignore
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (record) => {
  try {
    await deleteAmusementProject(record.id)
    message.success('删除成功')
    loadData()
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.project-name {
  font-weight: 500;
  color: #1f2937;
}

.project-code {
  font-size: 12px;
  color: #9ca3af;
  font-family: 'Courier New', monospace;
}

.text-muted {
  color: #9ca3af;
}

.price-amount {
  color: #f5222d;
  font-weight: 600;
  margin-left: 4px;
}
</style>
