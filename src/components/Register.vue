<template>
    <main>
        <div class="form">
            <h1 class="page_title">Register</h1>
            <form @submit.prevent="register">
                <div>
                    <label>First Name</label>
                    <input v-model="form.first_name" @input="clearError('first_name')" type="text" />
                    <p v-if="errors.first_name" class="error">{{ errors.first_name[0] }}</p>
                </div>

                <div>
                    <label>Last Name</label>
                    <input v-model="form.last_name" @input="clearError('last_name')" type="text" />
                    <p v-if="errors.last_name" class="error">{{ errors.last_name[0] }}</p>
                </div>

                <div>
                    <label>Email</label>
                    <input v-model="form.email" @input="clearError('email')" type="email" />
                    <p v-if="errors.email" class="error">{{ errors.email[0] }}</p>
                </div>

                <div>
                    <label>Phone</label>
                    <input v-model="form.phone" @input="clearError('phone')" type="text" />
                    <p v-if="errors.phone" class="error">{{ errors.phone[0] }}</p>
                </div>

                <div>
                    <label>Gender</label>
                    <select v-model="form.gender" @change="clearError('gender')">
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                    <p v-if="errors.gender" class="error">{{ errors.gender[0] }}</p>
                </div>

                <div>
                    <label>Profile Picture</label>
                    <input type="file" @change="onFileChange" accept="image/*" />
                    <p v-if="errors.profile_picture" class="error">{{ errors.profile_picture[0] }}</p>

                    <div v-if="previewUrl">
                        <img :src="previewUrl" class="rounded-full w-20 h-20" />
                    </div>
                </div>

                <div v-if="form.gender === 'other'">
                    <label>Specify Gender</label>
                    <input v-model="form.gender_other" @input="clearError('gender_other')" type="text" />
                    <p v-if="errors.gender_other" class="error">{{ errors.gender_other[0] }}</p>
                </div>

                <div>
                    <label>Password</label>
                    <input v-model="form.password" @input="clearError('password')" type="password" />
                    <p v-if="errors.password" class="error">{{ errors.password[0] }}</p>
                </div>

                <div>
                    <label>Confirm Password</label>
                    <input v-model="form.password_confirmation" type="password" />
                </div>

                <button type="submit">Register</button>
            </form>
        </div>
    </main>
</template>

<script setup>
    import { reactive, ref } from 'vue'
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
        profile_picture: null
    })

    const errors = reactive({})
    const previewUrl = ref(null)

    const clearError = (field) => {
        errors[field] = ''
    }

    const onFileChange = (e) => {
        const file = e.target.files[0]
        form.profile_picture = file
        previewUrl.value = URL.createObjectURL(file)
    }

    const register = async () => {
        if (form.gender === 'other' && !form.gender_other.trim()) {
            errors.gender_other = 'Please specify your gender.'
            return
        }

        if (form.gender === 'other' && form.gender_other) {
            form.gender = form.gender_other
        }

        const formData = new FormData()
        formData.append('first_name', form.first_name)
        formData.append('last_name', form.last_name)
        formData.append('email', form.email)
        formData.append('phone', form.phone)
        formData.append('gender', form.gender)
        formData.append('password', form.password)
        formData.append('password_confirmation', form.password_confirmation)

        if (form.profile_picture) {
            formData.append('profile_picture', form.profile_picture)
        }

        try {
            const response = await axios.post('/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            authStore.setUser(response.data.user)

            if (response.data.redirect) {
                window.dispatchEvent(new CustomEvent('navigate', { detail: response.data.redirect }))
            } else {
                router.push({ name: 'dashboard' })
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                Object.assign(errors, error.response.data.errors)
            } else {
                console.error('Registration error: ', error)
            }
        }
    }
</script>
<style scoped>
    @import '../assets/styles/forms.css';
</style>