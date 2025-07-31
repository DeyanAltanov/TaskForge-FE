<template>
    <main>
        <div class="form">
            <h1 class="page_title">Create Task</h1>
            <form @submit.prevent="create_task">
                <div class="form-field">
                    <label>Title</label>
                    <input v-model="form.title" @input="clearError('title')" type="text" />
                    <p v-if="errors.title" class="error">{{ errors.title[0] }}</p>
                </div>

                <div class="form-field">
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
                        :searchable="true"
                        :loading="isLoadingUsers"
                        :options="searchResults"
                        :internal-search="false"
                        :clear-on-select="true"
                        :close-on-select="true"
                        :preserve-search="true"
                        placeholder="Assign to user"
                        label="name"
                        track-by="id"
                        @search-change="searchUsers"
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

                <div class="form-btns">
                    <button type="button" @click="router.back()" class="button back">←</button>
                    <button type="submit" class="button save">Create</button>
                </div>
            </form>
        </div>
    </main>
</template>
<script setup>
    import { reactive, ref, onMounted, watch } from 'vue'
    import { useRouter } from 'vue-router'
    import { usePopup  } from '../../stores/popup'
    import axios from 'axios'
    import Multiselect from 'vue-multiselect'
    import 'vue-multiselect/dist/vue-multiselect.min.css'

    const router = useRouter()
    const searchResults = ref([])
    const isLoadingUsers = ref(false)

    const form = reactive({
        title: '',
        description: '',
        priority: '',
        assigned_to: '',
        team: '',
    })
    const teams = ref([])

    const { show } = usePopup()

    onMounted(async () => {
        try {
            const res = await axios.get('/tasks/form-data')
            teams.value = res.data.teams.map(team => ({
                ...team,
                name: team.name
            }))

        } catch (err) {
            console.error('❌ Error loading form data:', err)
        }
    })
    const errors = reactive({})

    const clearError = (field) => {
        errors[field] = ''
    }

    const searchUsers = async (query) => {
        if (!query) {
            searchResults.value = []
            return
        }

        isLoadingUsers.value = true

        try {
            const res = await axios.post('/users/search', {
                query: query
            })
            console.log('🔍 Search response:', res.data)

            searchResults.value = res.data.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                team_id: user.team_id 
            }))
        } catch (err) {
            console.error('❌ Error searching users:', err)
            show('Failed to search users', 'error')
        } finally {
            isLoadingUsers.value = false
        }
    }

    watch(() => form.assigned_to, async (user) => {
        if (user && user.id) {
            try {
                const res = await axios.get(`/users/${user.id}`)
                form.team = teams.value.find(t => t.id === res.data.team_id) || ''
            } catch (err) {
                console.error('❌ Failed to fetch user team', err)
            }
        }
    })

    watch(() => form.team, () => {
        if (form.assigned_to) {
            form.assigned_to = null
        }
    })

    watch(() => form.assigned_to, (user) => {
        if (user && typeof user === 'object' && user.team_id) {
            form.team = teams.value.find(t => t.id === user.team_id) || ''
        }

        else if (user && typeof user === 'number') {
            axios.get(`/users/${user}`).then(res => {
                const u = res.data
                const fullUser = {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    team_id: u.team_id
                }
                form.assigned_to = fullUser
                if (!searchResults.value.find(x => x.id === u.id)) {
                    searchResults.value.push(fullUser)
                }
            }).catch(err => {
                console.error('❌ Could not load user by ID', err)
            })
        }
    })

    const create_task = async () => {
        const formData = new FormData()
        formData.append('title', form.title)
        formData.append('description', form.description)
        formData.append('priority', form.priority)
        formData.append('assigned_to', form.assigned_to?.id || '')
        formData.append('team', form.team?.id || '')

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