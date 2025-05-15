<template>
  <div v-if="authStore.checked">
    <Nav />
    <router-view />
  </div>
  <Popup v-if="popup.text" :text="popup.text" :type="popup.type" />
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from './stores/auth'
  import { usePopup } from './stores/popup'
  import Nav from './components/partials/Nav.vue'
  import Popup from './components/partials/Popup.vue'

  const authStore = useAuthStore()
  const router = useRouter()
  const { popup } = usePopup()

  onMounted(() => {
    window.addEventListener('navigate', (event) => {
      router.push(event.detail)
    })
  })
</script>