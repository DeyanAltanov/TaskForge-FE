<template>
    <nav>
        <div v-if="authStore.user">
            Welcome, {{ authStore.user.first_name }} {{ authStore.user.last_name }} |
            <button @click="logout">Logout</button>
        </div>
        <div v-else>
            <router-link to="/login">Login</router-link> |
            <router-link to="/register">Register</router-link>
        </div>
    </nav>
</template>

<script setup>
    import axios from 'axios'
    import { useAuthStore } from '../../stores/auth'
    import { useRouter } from 'vue-router'

    const authStore = useAuthStore()
    const router = useRouter()

    const logout = async () => {
        try {
            await axios.post('/logout')
        } catch (error) {
            console.error('Logout failed:', error)
        } finally {
            authStore.clearUser()
            router.push({ name: 'welcome' })
        }
    }
</script>