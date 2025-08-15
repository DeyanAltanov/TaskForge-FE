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
                <div class="form-field">
                    <label>Attachments</label>

                    <input type="file" multiple @change="onFileChange" />

                    <ul v-if="files.length" class="file-list">
                        <li v-for="(f, i) in files" :key="f._key">
                        {{ f.name }} ({{ Math.ceil(f.size/1024) }} KB)
                        <button type="button" @click="removeFile(i)">×</button>
                        </li>
                    </ul>
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
                        class="multiselect_user"
                        :searchable="!!form.team"
                        :disabled="!form.team"
                        :loading="isLoadingUsers"
                        :internal-search="false"
                        :clear-on-select="true"
                        :close-on-select="true"
                        :preserve-search="true"
                        :options="inputQuery.length > 0 ? searchResults : []"
                        :show-no-options="false"
                        :show-no-results="inputQuery.length > 0"
                        :placeholder="form.team ? 'Assign to user' : 'Select a team first'"
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
    const inputQuery = ref('')

    const form = reactive({
        title: '',
        description: '',
        priority: '',
        assigned_to: '',
        team: '',
    })
    const teams = ref([])
    const files = ref([])

    const { show } = usePopup()

    onMounted(async () => {
        try {
            const res = await axios.get('/tasks/form-data')
            teams.value = res.data.teams.map(team => ({
                ...team,
                name: team.name
            }))

        } catch (err) {
            console.error('❌ Error loading form data: ', err)
        }
    })
    const errors = reactive({})

    const clearError = (field) => {
        errors[field] = ''
    }

    const searchUsers = async (query) => {
        inputQuery.value = query;
        if (!query || !form.team) { searchResults.value = []; return; }

        isLoadingUsers.value = true;
        try {
            const res = await axios.post('/users/search', {
                query,
                team_id: form.team.id
            });
            searchResults.value = res.data;
        } catch (err) {
            console.error('Error searching users: ', err);
            show('Failed to search users.', 'error');
        } finally {
            isLoadingUsers.value = false;
        }
    };

    watch(() => form.assigned_to, (user) => {
        if (!user) return

        if (typeof user === 'number') {
            axios.post('/users/search', { query: String(user) }).then(res => {
                const found = res.data.find(u => u.id === user)
                if (found) {
                    if (!searchResults.value.find(x => x.id === found.id)) {
                        searchResults.value.push(found)
                    }
                    form.assigned_to = found
                }
            }).catch(err => {
                console.error('❌ Could not load user by ID!', err)
            })

            return
        }

        const match = searchResults.value.find(x => x.id === user.id)
        if (match && match !== user) {
            form.assigned_to = match
        }
    })

    watch(() => form.team, () => {
        if (!form.team) {
            form.assigned_to = null;
            return;
        }
        if (!form.assigned_to) return;

        const tId = form.team.id;
        const u = form.assigned_to;

        const inTeam =
            (Array.isArray(u.team_ids) && u.team_ids.includes(tId)) ||
            (Array.isArray(u.teams) && u.teams.some(t => t.id === tId)) ||
            (u.team_id && u.team_id === tId);

        if (!inTeam) form.assigned_to = null;
    });

    function onFileChange(e) {
        const picked = Array.from(e.target.files || [])
        picked.forEach(f => {
            const exists = files.value.some(x => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified)
            if (!exists) {
                f._key = `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`
                files.value.push(f)
            }
        })
        e.target.value = ''
    }

    function removeFile(index) {
        files.value.splice(index, 1)
    }

    const create_task = async () => {
        const formData = new FormData()
        formData.append('title', form.title)
        formData.append('description', form.description)
        formData.append('priority', form.priority)
        formData.append('assigned_to', form.assigned_to?.id || '')
        formData.append('team', form.team?.id || '')
        files.value.forEach(f => formData.append('files[]', f))

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
<style scoped>
    @import '../../assets/styles/forms.css';
</style>
<style>
    .multiselect_user .multiselect__select {
        display: none !important;
    }
</style>