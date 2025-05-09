<template>
  <div v-if="authStore.checked">
    <Nav />
    <router-view />
  </div>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import Nav from './components/partials/Nav.vue'
  import { useAuthStore } from './stores/auth'

  const authStore = useAuthStore()
  const router = useRouter()

  onMounted(() => {
    window.addEventListener('navigate', (event) => {
      router.push(event.detail)
    })
  })
</script>