<template>
    <div class="login">
        <h2>Login</h2>
        <form @submit.prevent="login">
            <div>
                <label>Email</label>
                <input v-model="form.email" type="email" />
                <p v-if="errors.email" class="error">{{ errors.email }}</p>
            </div>

            <div>
                <label>Password</label>
                <input v-model="form.password" type="password" />
                <p v-if="errors.password" class="error">{{ errors.password }}</p>
            </div>

            <button type="submit">Login</button>
        </form>
    </div>
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

            authStore.setUser(response.data.user)
            localStorage.setItem('user', JSON.stringify(response.data.user))

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
    .login {
        max-width: 400px;
        margin: 50px auto;
    }
    label {
        display: block;
        margin-bottom: 0.3rem;
    }
    input {
        width: 100%;
        padding: 0.5rem;
        margin-bottom: 1rem;
    }
    button {
        padding: 0.5rem 1rem;
        cursor: pointer;
    }
    .error {
        color: red;
        font-size: 0.9rem;
        margin-top: -0.5rem;
        margin-bottom: 0.5rem;
    }
</style>