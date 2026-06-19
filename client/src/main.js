import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import * as Icons from '@ant-design/icons-vue'
import App from './App.vue'
import router from './router'
import './styles/global.less'

const app = createApp(App)

const pinia = createPinia()

Object.keys(Icons).forEach((key) => {
  app.component(key, Icons[key])
})

app.use(pinia)
app.use(router)
app.use(Antd)

app.mount('#app')
