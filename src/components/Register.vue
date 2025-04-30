<template>
    <div class="register">
        <h2>Register</h2>
        <form @submit.prevent="register">
            <div>
                <label>First Name</label>
                <input v-model="form.first_name" @input="clearError('first_name')" type="text" />
                <p v-if="errors.first_name" class="error">{{ errors.first_name }}</p>
            </div>

            <div>
                <label>Last Name</label>
                <input v-model="form.last_name" @input="clearError('last_name')" type="text" />
                <p v-if="errors.last_name" class="error">{{ errors.last_name }}</p>
            </div>

            <div>
                <label>Email</label>
                <input v-model="form.email" @input="clearError('email')" type="email" />
                <p v-if="errors.email" class="error">{{ errors.email }}</p>
            </div>

            <div>
                <label>Phone</label>
                <input v-model="form.phone" @input="clearError('phone')" type="text" />
                <p v-if="errors.phone" class="error">{{ errors.phone }}</p>
            </div>

            <div>
                <label>Gender</label>
                <select v-model="form.gender" @change="clearError('gender')">
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
                <p v-if="errors.gender" class="error">{{ errors.gender }}</p>
            </div>

            <div v-if="form.gender === 'other'">
                <label>Specify Gender</label>
                <input v-model="form.gender_other" @input="clearError('gender_other')" type="text" />
                <p v-if="errors.gender_other" class="error">{{ errors.gender_other }}</p>
            </div>

            <div>
                <label>Password</label>
                <input v-model="form.password" @input="clearError('password')" type="password" />
                <p v-if="errors.password" class="error">{{ errors.password }}</p>
            </div>

            <div>
                <label>Confirm Password</label>
                <input v-model="form.password_confirmation" type="password" />
            </div>

            <button type="submit">Register</button>
        </form>
    </div>
</template>

<script setup>
    import { reactive } from 'vue'
    import axios from 'axios'
    import { useRouter } from 'vue-router'
    import { useAuthStore } from '../stores/auth'

    const router = useRouter()
    const authStore = useAuthStore()

    const form = reactive({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: '',
        gender_other: '',
        password: '',
        password_confirmation: '',
    })

    const errors = reactive({})

    const clearError = (field) => {
        errors[field] = ''
    }

    const register = async () => {
        if (form.gender === 'other' && !form.gender_other.trim()) {
            errors.gender_other = 'Please specify your gender.'
            return
        }

        if (form.gender === 'other' && form.gender_other) {
            form.gender = form.gender_other
        }

        const payload = { ...form }
        delete payload.gender_other

        try {
            const response = await axios.post('/register', payload)

            authStore.setUser(response.data.user)

            if (response.data.redirect) {
                if (response.data.redirect) {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: response.data.redirect }))
                } else {
                    router.push({ name: 'login' })
                }
            } else {
                router.push({ name: 'dashboard' })
            }
        } catch (error) {
            if (error.response && error.response.data.errors) {
                Object.assign(errors, error.response.data.errors)
            } else {
                console.error('Registration error:', error)
            }
        }
    }
</script>

<style scoped>
    .register {
        max-width: 400px;
        margin: 50px auto;
    }
    label {
        display: block;
        margin-bottom: 0.3rem;
    }
    input, select {
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