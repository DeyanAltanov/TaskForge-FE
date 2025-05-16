<template>
    <main>
        <div class="form">
            <h1 class="page_title">Create Task</h1>
            <form @submit.prevent="create_task">
                <div>
                    <label>Title</label>
                    <input v-model="form.title" @input="clearError('title')" type="text" />
                    <p v-if="errors.title" class="error">{{ errors.title[0] }}</p>
                </div>

                <div>
                    <label>Description</label>
                    <input v-model="form.description" @input="clearError('description')" type="text" />
                    <p v-if="errors.description" class="error">{{ errors.description[0] }}</p>
                </div>
                <select v-model="form.priority" required>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
                <div class="multiselect">
                    <Multiselect
                        v-model="form.assigned_to"
                        :options="users"
                        label="name"
                        track-by="id"
                        placeholder="Assign to user"
                    />
                    <Multiselect
                        v-model="form.team"
                        :options="teams"
                        label="name"
                        track-by="id"
                        placeholder="Assign to team"
                    />
                    <p v-if="errors.team" class="error" style="margin-top: 5px;">{{ errors.team[0] }}</p>
                </div>
                <button type="submit">Create</button>
            </form>
        </div>
    </main>
</template>
<script setup>
    import { reactive, ref, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { useAuthStore } from '../../stores/auth'
    import { usePopup  } from '../../stores/popup'
    import axios from 'axios'
    import Multiselect from 'vue-multiselect'
    import 'vue-multiselect/dist/vue-multiselect.min.css'

    useRouter()
    useAuthStore()

    const form = reactive({
        title: '',
        description: '',
        priority: '',
        assigned_to: '',
        team: '',
    })
    const users = ref([])
    const teams = ref([])

    const { show } = usePopup()

    onMounted(async () => {
        try {
            const res = await axios.get('/tasks/form-data')
            teams.value = res.data.teams.map(team => ({
                ...team,
                name: team.name
            }))

            users.value = res.data.users.map(user => ({
                ...user,
                name: `${user.first_name} ${user.last_name}`
            }))
        } catch (err) {
            console.error('❌ Error loading form data:', err)
        }
    })
    const errors = reactive({})

    const clearError = (field) => {
        errors[field] = ''
    }

    const create_task = async () => {
        const formData = new FormData()
        formData.append('title', form.title)
        formData.append('description', form.description)
        formData.append('priority', form.priority)
        formData.append('assigned_to', form.assigned_to?.id || '')
        formData.append('team', form.team.id)

        try {
            await axios.post('/create_task', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            show('Task created!', 'success')
            setTimeout(() => {
                window.location.href = '/dashboard'
            }, 500)
        } catch (error) {
            if (error.response?.status === 422 && error.response.data.errors) {
                Object.assign(errors, error.response.data.errors)
                const firstField = Object.keys(error.response.data.errors)[0]
                const firstError = error.response.data.errors[firstField][0]
            } else {
                const msg =
                error.response?.data?.message ||
                error.message || 
                'Unexpected error'

                show(msg, 'error')
            }
        }
    }
</script>