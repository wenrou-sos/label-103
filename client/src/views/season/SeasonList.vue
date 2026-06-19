<template>
  <div class="season-list">
    <div class="table-toolbar">
      <div class="filter-bar">
        <a-select
          v-model:value="filters.type"
          placeholder="季节类型"
          style="width: 150px"
          allow-clear
          @change="loadData"
        >
          <a-select-option value="peak">旺季</a-select-option>
          <a-select-option value="off_peak">淡季</a-select-option>
        </a-select>
        <a-select
          v-model:value="filters.isActive"
          placeholder="状态"
          style="width: 150px"
          allow-clear
          @change="loadData"
        >
          <a-select-option :value="true">启用</a-select-option>
          <a-select-option :value="false">禁用</a-select-option>
        </a-select>
      </div>
      <div>
        <a-button type="primary" @click="openAddModal">
          <PlusOutlined />
          新增季节
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
        <template v-if="column.key === 'type'">
          <a-tag :color="record.type === 'peak' ? 'red' : 'green'">
            {{ record.type === 'peak' ? '旺季' : '淡季' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'startDate'">
          {{ formatMonthDay(record.startMonth, record.startDay) }}
        </template>
        <template v-else-if="column.key === 'endDate'">
          {{ formatMonthDay(record.endMonth, record.endDay) }}
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.isActive ? 'green' : 'default'">
            {{ record.isActive ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="openEditModal(record)">编辑</a-button>
          <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑季节' : '新增季节'"
      :width="500"
      @ok="handleSubmit"
      ok-text="确认"
      cancel-text="取消"
      :confirm-loading="submitLoading"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item label="名称" required>
          <a-input v-model:value="form.name" placeholder="请输入季节名称" />
        </a-form-item>
        <a-form-item label="类型" required>
          <a-select v-model:value="form.type" placeholder="请选择季节类型">
            <a-select-option value="peak">旺季</a-select-option>
            <a-select-option value="off_peak">淡季</a-select-option>
          </a-select>
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="开始月份" required>
              <a-select v-model:value="form.startMonth" placeholder="选择月份">
                <a-select-option v-for="m in 12" :key="m" :value="m">
                  {{ m }}月
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="开始日期" required>
              <a-select v-model:value="form.startDay" placeholder="选择日期">
                <a-select-option v-for="d in 31" :key="d" :value="d">
                  {{ d }}日
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="结束月份" required>
              <a-select v-model:value="form.endMonth" placeholder="选择月份">
                <a-select-option v-for="m in 12" :key="m" :value="m">
                  {{ m }}月
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="结束日期" required>
              <a-select v-model:value="form.endDay" placeholder="选择日期">
                <a-select-option v-for="d in 31" :key="d" :value="d">
                  {{ d }}日
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" :rows="3" placeholder="请输入描述" />
        </a-form-item>
        <a-form-item label="状态">
          <a-switch v-model:checked="form.isActive" checked-children="启用" un-checked-children="禁用" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  getSeasonRules,
  createSeasonRule,
  updateSeasonRule,
  deleteSeasonRule,
} from '@/api/season'
import { PlusOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const modalVisible = ref(false)
const currentId = ref(null)

const data = ref({
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
})

const filters = reactive({
  type: undefined,
  isActive: undefined,
})

const form = reactive({
  name: '',
  type: 'peak',
  startMonth: 1,
  startDay: 1,
  endMonth: 12,
  endDay: 31,
  description: '',
  isActive: true,
})

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name', width: 150 },
  { title: '类型', key: 'type', width: 100 },
  { title: '开始日期', key: 'startDate', width: 120 },
  { title: '结束日期', key: 'endDate', width: 120 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' },
]

const formatMonthDay = (month, day) => {
  if (!month || !day) return '-'
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const loadData = async () => {
  loading.value = true
  try {
    const result = await getSeasonRules({
      page: data.value.page,
      pageSize: data.value.pageSize,
      type: filters.type,
      isActive: filters.isActive,
    })
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

const resetForm = () => {
  form.name = ''
  form.type = 'peak'
  form.startMonth = 1
  form.startDay = 1
  form.endMonth = 12
  form.endDay = 31
  form.description = ''
  form.isActive = true
}

const openAddModal = () => {
  isEdit.value = false
  currentId.value = null
  resetForm()
  modalVisible.value = true
}

const openEditModal = (record) => {
  isEdit.value = true
  currentId.value = record.id
  form.name = record.name
  form.type = record.type
  form.startMonth = record.startMonth
  form.startDay = record.startDay
  form.endMonth = record.endMonth
  form.endDay = record.endDay
  form.description = record.description || ''
  form.isActive = record.isActive !== false
  modalVisible.value = true
}

const validateForm = () => {
  if (!form.name.trim()) {
    message.warning('请输入季节名称')
    return false
  }
  if (!form.type) {
    message.warning('请选择季节类型')
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return
  submitLoading.value = true
  try {
    const submitData = {
      name: form.name,
      type: form.type,
      startMonth: form.startMonth,
      startDay: form.startDay,
      endMonth: form.endMonth,
      endDay: form.endDay,
      description: form.description,
      isActive: form.isActive,
    }
    if (isEdit.value) {
      await updateSeasonRule(currentId.value, submitData)
      message.success('编辑成功')
    } else {
      await createSeasonRule(submitData)
      message.success('新增成功')
    }
    modalVisible.value = false
    loadData()
  } catch (e) {
    // ignore
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = (record) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除季节 "${record.name}" 吗？`,
    okText: '确定删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: async () => {
      try {
        await deleteSeasonRule(record.id)
        message.success('删除成功')
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
.season-list {
  padding: 0;
}
</style>
