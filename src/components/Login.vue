<template>
    <main>
        <div class="form">
            <h1 class="page_title">Login</h1>
            <form @submit.prevent="login">
                <div>
                    <label>Email</label>
                    <input v-model="form.email" type="email" />
                    <p v-if="errors.email" class="error">{{ errors.email[0] }}</p>
                </div>

                <div>
                    <label>Password</label>
                    <input v-model="form.password" type="password" />
                    <p v-if="errors.password" class="error">{{ errors.password[0] }}</p>
                </div>

                <button type="submit">Login</button>
            </form>
        </div>
    </main>
</template>

<script setup>
    import { reactive } from 'vue'
    import axios from 'axios'
    import { useAuthStore } from '../stores/auth'
    import { useRouter } from 'vue-router'

    const authStore = useAuthStore()
    const router = useRouter()

    const form = reactive({
        email: '',
        password: '',
    })

    const errors = reactive({})

    const login = async () => {
        try {
            await axios.get('http://taskforge.local/sanctum/csrf-cookie', { withCredentials: true })
            const response = await axios.post('/login', form)
            await authStore.fetchUser()

            localStorage.setItem('user', JSON.stringify(response.data.user))

            window.location.reload()
            router.push({ name: 'dashboard' })
        } catch (error) {
            if (error.response?.data?.errors) {
                Object.assign(errors, error.response.data.errors)
            } else if (error.response?.data?.message) {
                errors.password = error.response.data.message
            } else {
                console.error('Login error:', error)
                errors.password = 'Unexpected error'
            }
        }
    }
</script>
<style scoped>
    @import '../assets/styles/forms.css';
</style>