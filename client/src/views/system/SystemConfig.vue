<template>
  <div class="system-config">
    <a-card title="积分配置" :bordered="false">
      <a-form :model="form" layout="vertical">
        <a-form-item label="每消费1元获得积分数量">
          <a-input-number
            v-model:value="form.point_earn_rate"
            :min="0"
            :precision="0"
            style="width: 200px"
            placeholder="请输入积分数量"
          />
          <div class="form-item-desc">用户每消费1元人民币可获得的积分数量，默认为1</div>
        </a-form-item>

        <a-form-item label="多少积分抵扣1元">
          <a-input-number
            v-model:value="form.point_spend_rate"
            :min="1"
            :precision="0"
            style="width: 200px"
            placeholder="请输入积分数量"
          />
          <div class="form-item-desc">积分抵扣现金的比例，例如100表示100积分抵扣1元，默认为100</div>
        </a-form-item>

        <a-form-item label="最低使用积分数">
          <a-input-number
            v-model:value="form.point_min_spend"
            :min="0"
            :precision="0"
            style="width: 200px"
            placeholder="请输入最低积分数"
          />
          <div class="form-item-desc">使用积分抵扣时的最低积分数，0表示不限制，默认为0</div>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" :loading="saveLoading" @click="handleSave">
            保存配置
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getPointConfig, batchUpdateConfigs } from '@/api/systemConfig'

const loading = ref(false)
const saveLoading = ref(false)

const form = reactive({
  point_earn_rate: 1,
  point_spend_rate: 100,
  point_min_spend: 0,
})

const loadConfig = async () => {
  loading.value = true
  try {
    const result = await getPointConfig()
    if (result) {
      form.point_earn_rate = result.point_earn_rate ?? 1
      form.point_spend_rate = result.point_spend_rate ?? 100
      form.point_min_spend = result.point_min_spend ?? 0
    }
  } catch (e) {
    // ignore
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (form.point_earn_rate < 0) {
    message.warning('每消费1元获得积分数量不能小于0')
    return
  }
  if (form.point_spend_rate < 1) {
    message.warning('积分抵扣比例不能小于1')
    return
  }
  if (form.point_min_spend < 0) {
    message.warning('最低使用积分数不能小于0')
    return
  }

  saveLoading.value = true
  try {
    await batchUpdateConfigs({
      point_earn_rate: form.point_earn_rate,
      point_spend_rate: form.point_spend_rate,
      point_min_spend: form.point_min_spend,
    })
    message.success('配置保存成功')
  } catch (e) {
    // ignore
  } finally {
    saveLoading.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.system-config {
  padding: 0;
}

.form-item-desc {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}
</style>
