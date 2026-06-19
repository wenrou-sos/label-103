<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <div class="error-code">
        <span class="code-4">4</span>
        <span class="code-0">0</span>
        <span class="code-4">4</span>
      </div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-desc">抱歉，您访问的页面不存在或已被移除</p>
      <div class="error-actions">
        <a-button type="primary" size="large" @click="goHome">
          <HomeOutlined />
          返回首页
        </a-button>
        <a-button size="large" @click="goBack">
          <ArrowLeftOutlined />
          返回上一页
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
}

.not-found-container {
  text-align: center;
  padding: 40px;
}

.error-code {
  font-size: 160px;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  gap: 8px;

  .code-4 {
    color: #1890ff;
    text-shadow: 4px 4px 0 rgba(24, 144, 255, 0.1);
  }

  .code-0 {
    color: #faad14;
    text-shadow: 4px 4px 0 rgba(250, 173, 20, 0.1);
    animation: spin 6s linear infinite;
    display: inline-block;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px;
}

.error-desc {
  font-size: 16px;
  color: #6b7280;
  margin: 0 0 32px;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>
