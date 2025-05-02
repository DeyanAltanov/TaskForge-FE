<template>
    <nav id="nav">
        <router-link to="/dashboard">
            <img id='nav-logo' src="/nav.png" />
        </router-link>

        <div v-if="authStore.user" class="relative">
            <button @click="toggleDropdown" id='nav_profile_img_btn' class="flex items-center gap-2 focus:outline-none">
                <img id='nav_profile_img' :src="authStore.user.avatar_base64" />
            </button>

            <div v-if="dropdownOpen" class="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-10">
                <router-link to="/profile" class="block px-4 py-2 hover:bg-gray-100">Profile</router-link>
                <button @click="logout" class="block w-full text-left px-4 py-2 hover:bg-gray-100">Logout</button>
            </div>
        </div>

        <div v-else>
            <router-link to="/login">Login</router-link> |
            <router-link to="/register">Register</router-link>
        </div>
    </nav>
</template>

<script setup>
    import axios from 'axios'
    import { ref } from 'vue'
    import { useAuthStore } from '../../stores/auth'
    import { useRouter } from 'vue-router'

    const authStore = useAuthStore()
    const router = useRouter()

    const dropdownOpen = ref(false)

    const toggleDropdown = () => {
        dropdownOpen.value = !dropdownOpen.value
    }

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