<template>
  <div class="renewal-package-list">
    <div class="table-toolbar">
      <div class="filter-bar">
        <a-select
          v-model:value="filters.cardTypeId"
          placeholder="卡类型"
          style="width: 180px"
          allow-clear
          @change="loadData"
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
          placeholder="搜索套餐名称"
          style="width: 240px"
          @search="loadData"
        />
      </div>
      <a-button type="primary" @click="openAddModal">
        <PlusOutlined />
        新增套餐
      </a-button>
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
        <template v-if="column.key === 'name'">
          {{ record.name }}
        </template>
        <template v-else-if="column.key === 'cardType'">
          {{ record.AnnualCardType?.name || '-' }}
        </template>
        <template v-else-if="column.key === 'originalPrice'">
          <span style="text-decoration: line-through; color: #999">¥{{ record.originalPrice }}</span>
        </template>
        <template v-else-if="column.key === 'discountPrice'">
          <span class="price-amount">¥{{ record.discountPrice }}</span>
        </template>
        <template v-else-if="column.key === 'discountRate'">
          <a-tag color="orange">{{ (record.discountRate * 10).toFixed(1) }}折</a-tag>
        </template>
        <template v-else-if="column.key === 'extraDays'">
          <a-tag v-if="record.extraDays > 0" color="green">+{{ record.extraDays }}天</a-tag>
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'isActive'">
          <a-tag :color="record.isActive ? 'green' : 'default'">
            {{ record.isActive ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="openEditModal(record)">编辑</a-button>
          <a-popconfirm
            title="确定删除该套餐吗？"
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
      :title="isEdit ? '编辑套餐' : '新增套餐'"
      :width="600"
      @ok="handleSubmit"
      ok-text="确定"
      cancel-text="取消"
      :confirm-loading="submitLoading"
    >
      <a-form :model="form" layout="vertical" ref="formRef">
        <a-form-item label="套餐名称" required>
          <a-input v-model:value="form.name" placeholder="请输入套餐名称" />
        </a-form-item>
        <a-form-item label="卡类型" required>
          <a-select v-model:value="form.cardTypeId" @change="onAnnualCardTypeChange">
            <a-select-option
              v-for="type in cardTypes"
              :key="type.id"
              :value="type.id"
            >
              {{ type.name }} - ¥{{ type.price }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="原价（元）" required>
          <a-input-number
            v-model:value="form.originalPrice"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="折扣价（元）" required>
          <a-input-number
            v-model:value="form.discountPrice"
            :min="0"
            :precision="2"
            style="width: 100%"
            @change="calculateDiscountRate"
          />
        </a-form-item>
        <a-form-item label="折扣率">
          <span v-if="calculatedRate">{{ calculatedRate }}折</span>
          <span v-else>-</span>
        </a-form-item>
        <a-form-item label="赠送天数">
          <a-input-number
            v-model:value="form.extraDays"
            :min="0"
            style="width: 100%"
            placeholder="请输入赠送天数"
          />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" :rows="3" placeholder="请输入描述" />
        </a-form-item>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  getRenewalPackages,
  createRenewalPackage,
  updateRenewalPackage,
  deleteRenewalPackage,
  getAllAnnualCardTypes,
} from '@/api/annualCard'
import { PlusOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const submitLoading = ref(false)

const data = ref({
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
})

const filters = reactive({
  cardTypeId: undefined,
  keyword: '',
})

const cardTypes = ref([])

const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentId = ref('')

const form = reactive({
  name: '',
  cardTypeId: undefined,
  originalPrice: 0,
  discountPrice: 0,
  extraDays: 0,
  description: '',
  sortOrder: 0,
  isActive: true,
})

const calculatedRate = computed(() => {
  if (!form.originalPrice || !form.discountPrice) return ''
  const rate = (form.discountPrice / form.originalPrice) * 10
  return rate.toFixed(1)
})

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '卡类型', key: 'cardType', width: 150 },
  { title: '原价', key: 'originalPrice', width: 100 },
  { title: '折扣价', key: 'discountPrice', width: 100 },
  { title: '折扣率', key: 'discountRate', width: 100 },
  { title: '赠送天数', key: 'extraDays', width: 100 },
  { title: '状态', key: 'isActive', width: 100 },
  { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
]

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: data.value.page,
      pageSize: data.value.pageSize,
      cardTypeId: filters.cardTypeId,
      keyword: filters.keyword,
    }
    const result = await getRenewalPackages(params)
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

const loadAnnualCardTypes = async () => {
  try {
    cardTypes.value = await getAllAnnualCardTypes()
  } catch (e) {
    // ignore
  }
}

const onAnnualCardTypeChange = () => {
  const selected = cardTypes.value.find((t) => t.id === form.cardTypeId)
  if (selected && !isEdit.value) {
    form.originalPrice = parseFloat(selected.price)
  }
}

const calculateDiscountRate = () => {
  // 计算逻辑通过 computed 自动处理
}

const openAddModal = async () => {
  isEdit.value = false
  currentId.value = ''
  Object.assign(form, {
    name: '',
    cardTypeId: undefined,
    originalPrice: 0,
    discountPrice: 0,
    extraDays: 0,
    description: '',
    sortOrder: 0,
    isActive: true,
  })
  modalVisible.value = true
  await loadAnnualCardTypes()
}

const openEditModal = async (record) => {
  isEdit.value = true
  currentId.value = record.id
  Object.assign(form, {
    name: record.name,
    cardTypeId: record.cardTypeId,
    originalPrice: parseFloat(record.originalPrice),
    discountPrice: parseFloat(record.discountPrice),
    extraDays: record.extraDays,
    description: record.description,
    sortOrder: record.sortOrder,
    isActive: record.isActive,
  })
  modalVisible.value = true
  await loadAnnualCardTypes()
}

const handleSubmit = async () => {
  if (!form.name || !form.cardTypeId) {
    message.warning('请填写必填项')
    return
  }
  submitLoading.value = true
  try {
    const data = {
      name: form.name,
      cardTypeId: form.cardTypeId,
      originalPrice: form.originalPrice,
      discountPrice: form.discountPrice,
      extraDays: form.extraDays,
      description: form.description,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    }
    if (isEdit.value) {
      await updateRenewalPackage(currentId.value, data)
      message.success('更新成功')
    } else {
      await createRenewalPackage(data)
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
    await deleteRenewalPackage(record.id)
    message.success('删除成功')
    loadData()
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  loadData()
  loadAnnualCardTypes()
})
</script>
