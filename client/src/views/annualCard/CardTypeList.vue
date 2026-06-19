<template>
  <div class="card-type-list">
    <div class="table-toolbar">
      <div class="filter-bar">
        <a-input-search
          v-model:value="keyword"
          placeholder="搜索类型名称/编码"
          style="width: 240px"
          @search="loadData"
        />
      </div>
      <a-button type="primary" @click="openAddModal">
        <PlusOutlined />
        新增类型
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
          <a-tag :color="typeColors[record.type]">
            {{ typeMap[record.type] }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'price'">
          <span class="price-amount">¥{{ record.price }}</span>
        </template>
        <template v-else-if="column.key === 'people'">
          <div>
            <div>成人: {{ record.adultCount }} 人</div>
            <div>儿童: {{ record.childCount }} 人</div>
          </div>
        </template>
        <template v-else-if="column.key === 'validityDays'">
          {{ record.validityDays }} 天
        </template>
        <template v-else-if="column.key === 'isActive'">
          <a-tag :color="record.isActive ? 'green' : 'default'">
            {{ record.isActive ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="openEditModal(record)">编辑</a-button>
          <a-popconfirm
            title="确定删除该卡类型吗？"
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
      :title="isEdit ? '编辑卡类型' : '新增卡类型'"
      :width="600"
      @ok="handleSubmit"
      ok-text="确定"
      cancel-text="取消"
      :confirm-loading="submitLoading"
    >
      <a-form :model="form" layout="vertical" ref="formRef">
        <a-form-item label="类型名称" required>
          <a-input v-model:value="form.name" placeholder="请输入类型名称" />
        </a-form-item>
        <a-form-item label="类型编码" required>
          <a-input v-model:value="form.code" placeholder="请输入类型编码" :disabled="isEdit" />
        </a-form-item>
        <a-form-item label="卡类型" required>
          <a-select v-model:value="form.type">
            <a-select-option value="single">单人</a-select-option>
            <a-select-option value="parent_child">亲子</a-select-option>
            <a-select-option value="family">家庭</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="价格（元）" required>
          <a-input-number
            v-model:value="form.price"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="成人数量" required>
              <a-input-number
                v-model:value="form.adultCount"
                :min="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="儿童数量" required>
              <a-input-number
                v-model:value="form.childCount"
                :min="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="有效期（天）" required>
          <a-input-number
            v-model:value="form.validityDays"
            :min="1"
            style="width: 100%"
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
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  getCardTypes,
  createCardType,
  updateCardType,
  deleteCardType,
} from '@/api/annualCard'
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
  type: 'single',
  price: 0,
  adultCount: 1,
  childCount: 0,
  validityDays: 365,
  description: '',
  sortOrder: 0,
  isActive: true,
})

const typeMap = {
  single: '单人',
  parent_child: '亲子',
  family: '家庭',
}

const typeColors = {
  single: 'blue',
  parent_child: 'green',
  family: 'purple',
}

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name', width: 150 },
  { title: '编码', dataIndex: 'code', key: 'code', width: 120 },
  { title: '类型', key: 'type', width: 100 },
  { title: '价格', key: 'price', width: 100 },
  { title: '人数', key: 'people', width: 120 },
  { title: '有效期', key: 'validityDays', width: 100 },
  { title: '状态', key: 'isActive', width: 100 },
  { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
]

const loadData = async () => {
  loading.value = true
  try {
    const result = await getCardTypes()
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
    type: 'single',
    price: 0,
    adultCount: 1,
    childCount: 0,
    validityDays: 365,
    description: '',
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
    price: parseFloat(record.price),
    adultCount: record.adultCount,
    childCount: record.childCount,
    validityDays: record.validityDays,
    description: record.description,
    sortOrder: record.sortOrder,
    isActive: record.isActive,
  })
  modalVisible.value = true
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
      price: form.price,
      adultCount: form.adultCount,
      childCount: form.childCount,
      validityDays: form.validityDays,
      description: form.description,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    }
    if (isEdit.value) {
      await updateCardType(currentId.value, data)
      message.success('更新成功')
    } else {
      await createCardType(data)
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
    await deleteCardType(record.id)
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
