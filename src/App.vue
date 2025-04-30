<template>
  <div>
    <Nav />
    <router-view />
  </div>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import Nav from './components/partials/Nav.vue'

  const router = useRouter()

  onMounted(() => {
    window.addEventListener('navigate', (event) => {
      router.push(event.detail)
    })
  })
</script>

<style scoped>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
  }
</style>