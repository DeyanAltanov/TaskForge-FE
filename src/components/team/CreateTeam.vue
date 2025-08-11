<template>
    <main>
        <div class="form">
            <h1 class="page_title">Create Team</h1>
            <form @submit.prevent="create_team">
                <div class="form-field">
                    <label>Name</label>
                    <input v-model="form.name" @input="clearError('name')" type="text" />
                    <p v-if="errors.name" class="error">{{ errors.name[0] }}</p>
                </div>

                <div class="form-field">
                    <label>Description</label>
                    <input v-model="form.description" @input="clearError('description')" type="text" />
                </div>

                <div class="form-btns">
                    <button type="button" @click="router.back()" class="button back">←</button>
                    <button type="submit" class="button save">Create</button>
                </div>
            </form>
        </div>
    </main>
</template>
<script setup>
    import { reactive } from 'vue'
    import axios from 'axios'
    import { useRouter } from 'vue-router'
    import { useAuthStore } from '../../stores/auth'
    import { usePopup  } from '../../stores/popup'

    const router = useRouter()
    const authStore = useAuthStore()

    const form = reactive({
        name: '',
        description: ''
    })

    const { show } = usePopup()

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

            show('Team created!', 'success')
            setTimeout(() => {
                window.location.href = '/dashboard'
            }, 500)
        } catch (error) {
            if (error.response?.status === 422 && error.response.data.errors) {
                Object.assign(errors, error.response.data.errors)
                const firstField = Object.keys(error.response.data.errors)[0]
                const firstError = error.response.data.errors[firstField][0]
                show(firstError, 'error')
            } else {
                console.error('❌ Server error:', error)
            }
        }
    }
</script>
<style scoped>
    @import '../../assets/styles/forms.css';
</style>