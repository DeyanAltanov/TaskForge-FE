import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import { useAuthStore } from './stores/auth'
import './assets/styles/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const authStore = useAuthStore()

axios.defaults.baseURL = 'http://taskforge.local/api'
axios.defaults.withCredentials = true

axios.interceptors.request.use((config) => {
  const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('XSRF-TOKEN='))
  ?.split('=')[1]

  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token)
  }

  return config
})

async function init() {
  try {
    await axios.get('/sanctum/csrf-cookie', { baseURL: 'http://taskforge.local' })

    const xsrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1]

    axios.defaults.headers.common['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken || '')

    const res = await axios.get('/user')
    authStore.setUser(res.data)
  } catch (error) {
    authStore.clearUser()
    console.error('❌ Auth init error:', error)
  } finally {
    authStore.checked = true

    app.use(router)
    app.mount('#app')
  }
}

init()