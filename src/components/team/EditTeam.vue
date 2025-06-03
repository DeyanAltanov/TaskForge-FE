<template>
    <main>
        <div class="form">
            <h1 class="page_title">Edit {{ form.name }}</h1>
            <form @submit.prevent="edit_team">
                <div class="form-field">
                    <label>Name</label>
                    <input v-model="form.name" type="text" @input="clearError('name')" placeholder="Team name" />
                    <p v-if="errors.name" class="error">{{ errors.name[0] }}</p>
                </div>

                <div class="form-field">
                    <label>Description</label>
                    <textarea v-model="form.description" @input="clearError('description')" placeholder="Description"></textarea>
                </div>

                <div class="form-btns">
                    <button type="button" @click="router.back()" class="button back">←</button>
                    <button type="button" class='button' @click="editTeamMembers">Edit Team Members</button>
                    <button type="submit" class="button save">Save</button>
                </div>
            </form>
        </div>
    </main>
</template>
<script setup>
    import { ref, onMounted, reactive } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import axios from 'axios'
    import { usePopup  } from '../../stores/popup'

    const route = useRoute()
    const router = useRouter()
    const errors = reactive({})
    const { show } = usePopup()

    const clearError = (field) => {
        errors[field] = ''
    }

    const form = ref({
        name: '',
        description: ''
    })

    onMounted(async () => {
        try {
            const res = await axios.get(`/teams/${route.params.id}/edit`)
            form.value.name = res.data.name
            form.value.description = res.data.description
        } catch (err) {
            console.error('❌ Error loading team:', err)
        }
    })

    async function edit_team() {
        const formData = new FormData()
        formData.append('name', form.value.name)
        formData.append('description', form.value.description)

        try {
            await axios.post(`/teams/${route.params.id}/edit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            show('Team updated!', 'success')

            setTimeout(() => {
                router.push('/all_teams')
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

    function editTeamMembers() {
        router.push({ name: 'edit_team_members', params: { id: route.params.id } })
    }
</script>