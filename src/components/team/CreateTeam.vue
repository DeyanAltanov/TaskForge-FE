<template>
    <div class="create_team">
        <h2>Create Team</h2>
        <form @submit.prevent="create_team">
            <div>
                <label>Name</label>
                <input v-model="form.name" @input="clearError('name')" type="text" />
                <p v-if="errors.name" class="error">{{ errors.name }}</p>
            </div>

            <div>
                <label>Description</label>
                <input v-model="form.description" @input="clearError('description')" type="text" />
            </div>
            <button type="submit">Create</button>
        </form>
    </div>
</template>
<script setup>
    import { reactive } from 'vue'
    import axios from 'axios'
    import { useRouter } from 'vue-router'
    import { useAuthStore } from '../../stores/auth'

    useRouter()
    useAuthStore()

    const form = reactive({
        name: '',
        description: ''
    })

    const errors = reactive({})

    const clearError = (field) => {
        errors[field] = ''
    }

    const create_team = async () => {
        const formData = new FormData()
        formData.append('name', form.name)
        formData.append('description', form.description)

        try {
            await axios.post('/create_team', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            window.location.href = '/dashboard'
        } catch (error) {
            if (error.response?.status === 422 && error.response.data.errors) {
                Object.assign(errors, error.response.data.errors)
            } else {
                console.error('❌ Server error:', error)
            }
        }
    }
</script>