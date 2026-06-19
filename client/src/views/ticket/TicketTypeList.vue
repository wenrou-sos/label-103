<template>
  <div class="ticket-type-list">
    <div class="table-toolbar">
      <div class="filter-bar">
        <a-input-search
          v-model:value="keyword"
          placeholder="搜索票种名称"
          style="width: 240px"
          @search="loadData"
        />
      </div>
      <a-button type="primary" @click="openAddModal">
        <PlusOutlined />
        新增票种
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      row-key="id"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          {{ typeMap[record.type] }}
        </template>
        <template v-else-if="column.key === 'prices'">
          <div>
            <div>旺季: <span style="color: #ff4d4f">¥{{ record.peakPrice }}</span></div>
            <div>淡季: <span style="color: #52c41a">¥{{ record.offPeakPrice }}</span></div>
          </div>
        </template>
        <template v-else-if="column.key === 'isActive'">
          <a-tag :color="record.isActive ? 'green' : 'default'">
            {{ record.isActive ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="openEditModal(record)">编辑</a-button>
          <a-popconfirm
            title="确定删除该票种吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete(record)"
          >
            <a-button type="link" size="small" danger>删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑票种' : '新增票种'"
      :width="600"
      @ok="handleSubmit"
      ok-text="确定"
      cancel-text="取消"
      :confirm-loading="submitLoading"
    >
      <a-form :model="form" layout="vertical" ref="formRef">
        <a-form-item label="票种名称" required>
          <a-input v-model:value="form.name" placeholder="请输入票种名称" />
        </a-form-item>
        <a-form-item label="票种编码" required>
          <a-input v-model:value="form.code" placeholder="请输入票种编码" :disabled="isEdit" />
        </a-form-item>
        <a-form-item label="票种类型" required>
          <a-select v-model:value="form.type">
            <a-select-option value="single_day">单日票</a-select-option>
            <a-select-option value="two_day">两日票</a-select-option>
            <a-select-option value="afternoon">午后票</a-select-option>
            <a-select-option value="night">夜场票</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" :rows="3" placeholder="请输入描述" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="旺季价格（元）" required>
              <a-input-number
                v-model:value="form.peakPrice"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="淡季价格（元）" required>
              <a-input-number
                v-model:value="form.offPeakPrice"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="有效期（天）">
              <a-input-number
                v-model:value="form.validDays"
                :min="1"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="入园时间">
              <a-time-picker
                v-model:value="form.entryTimeObj"
                format="HH:mm"
                style="width: 100%"
                placeholder="可入园时间"
                @change="onTimeChange"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="排序">
              <a-input-number
                v-model:value="form.sortOrder"
                :min="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态">
              <a-switch v-model:checked="form.isActive" checked-children="启用" un-checked-children="禁用" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getAllTicketTypes, createTicketType, updateTicketType, deleteTicketType } from '@/api/ticket'
import dayjs from 'dayjs'
import { PlusOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const submitLoading = ref(false)
const list = ref([])
const keyword = ref('')

const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentId = ref('')

const form = reactive({
  name: '',
  code: '',
  type: 'single_day',
  description: '',
  peakPrice: 0,
  offPeakPrice: 0,
  validDays: 1,
  entryTime: '',
  entryTimeObj: null,
  sortOrder: 0,
  isActive: true,
})

const typeMap = {
  single_day: '单日票',
  two_day: '两日票',
  afternoon: '午后票',
  night: '夜场票',
}

const columns = [
  { title: '票种名称', dataIndex: 'name', key: 'name', width: 120 },
  { title: '编码', dataIndex: 'code', key: 'code', width: 120 },
  { title: '类型', key: 'type', width: 100 },
  { title: '价格', key: 'prices', width: 160 },
  { title: '有效期', dataIndex: 'validDays', key: 'validDays', width: 100, customRender: ({ text }) => `${text}天` },
  { title: '入园时间', dataIndex: 'entryTime', key: 'entryTime', width: 100, customRender: ({ text }) => text || '全天' },
  { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
  { title: '状态', key: 'isActive', width: 100 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
]

const loadData = async () => {
  loading.value = true
  try {
    const result = await getAllTicketTypes()
    if (keyword.value) {
      list.value = result.filter((item) =>
        item.name.includes(keyword.value) || item.code.includes(keyword.value)
      )
    } else {
      list.value = result
    }
  } catch (e) {
    // ignore
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  isEdit.value = false
  currentId.value = ''
  Object.assign(form, {
    name: '',
    code: '',
    type: 'single_day',
    description: '',
    peakPrice: 0,
    offPeakPrice: 0,
    validDays: 1,
    entryTime: '',
    entryTimeObj: null,
    sortOrder: 0,
    isActive: true,
  })
  modalVisible.value = true
}

const openEditModal = (record) => {
  isEdit.value = true
  currentId.value = record.id
  Object.assign(form, {
    name: record.name,
    code: record.code,
    type: record.type,
    description: record.description,
    peakPrice: parseFloat(record.peakPrice),
    offPeakPrice: parseFloat(record.offPeakPrice),
    validDays: record.validDays,
    entryTime: record.entryTime,
    entryTimeObj: record.entryTime ? dayjs(record.entryTime, 'HH:mm') : null,
    sortOrder: record.sortOrder,
    isActive: record.isActive,
  })
  modalVisible.value = true
}

const onTimeChange = (time) => {
  form.entryTime = time ? time.format('HH:mm') : ''
}

const handleSubmit = async () => {
  if (!form.name || !form.code) {
    message.warning('请填写必填项')
    return
  }
  submitLoading.value = true
  try {
    const data = {
      name: form.name,
      code: form.code,
      type: form.type,
      description: form.description,
      peakPrice: form.peakPrice,
      offPeakPrice: form.offPeakPrice,
      validDays: form.validDays,
      entryTime: form.entryTime,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    }
    if (isEdit.value) {
      await updateTicketType(currentId.value, data)
      message.success('更新成功')
    } else {
      await createTicketType(data)
      message.success('创建成功')
    }
    modalVisible.value = false
    loadData()
  } catch (e) {
    // ignore
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (record) => {
  try {
    await deleteTicketType(record.id)
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
