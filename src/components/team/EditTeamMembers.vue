<template>
    <main>
        <div>
            <h1 class="page_title">Edit {{ teamName }} Members</h1>

            <div>
                <table v-if="members.length" class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="member in members" :key="member.id">
                            <td>
                                <router-link :to="`/profile/${member.id}`">
                                    {{ member.name }}
                                </router-link>
                            </td>
                            <td>{{ member.email }}</td>
                            <td>{{ member.role }}</td>
                            <td>
                                <button type="button" @click="removeMember(member.id)" title="Remove">✖</button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <p v-else>No members in this team.</p>
                <div>
                    <h3>Add Member to Team</h3>
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search..."
                    />

                    <div v-if="searchResult.length">
                        <ul>
                            <li v-for="user in searchResult" :key="user.id">
                                <span>{{ user.first_name }} {{ user.last_name }}</span>
                                <button type="button" @click="addMember(user.id)">➕ Add to Team</button>
                            </li>
                        </ul>
                    </div>
                    <p v-else-if="searchPerformed && !searchResult.length">No users found.</p>
                </div>
            </div>
        </div>
    </main>
</template>
<script setup>
    import { ref, onMounted, watch } from 'vue'
    import { useRoute } from 'vue-router'
    import debounce from 'lodash/debounce'
    import axios from 'axios'
    import { usePopup  } from '../../stores/popup'

    const route           = useRoute()
    const teamName        = ref('')
    const members         = ref([])
    const searchQuery     = ref('')
    const searchResult    = ref([])
    const searchPerformed = ref(false)
    const { show }        = usePopup()

    onMounted(async () => {
        try {
            const response = await axios.get(`/teams/${route.params.id}/edit_team_members`)
            teamName.value = response.data.team_name
            members.value = response.data.members
        } catch (err) {
            console.error('❌ Error loading team members:', err)
        }
    })

    const debouncedSearch = debounce(async (query) => {
        if (!query) {
            searchResult.value = []
            searchPerformed.value = false
            return
        }

        try {
            const result = await axios.post(`/teams/${route.params.id}/edit_team_members`, {
                query: query
            })
            searchResult.value = result.data
            searchPerformed.value = true
        } catch (err){
            console.error('❌ Error searching users:', err)
            show('Failed to search users', 'error')
        }
    }, 300)

    watch(searchQuery, (newVal) => {
        debouncedSearch(newVal)
    })

    const addMember = async (userId) => {
        try {
            await axios.post(`/teams/${route.params.id}/members`, {
                user_id: userId,
            })

            const res = await axios.get(`/teams/${route.params.id}/edit_team_members`)
            members.value = res.data.members

            searchQuery.value = ''
            searchResult.value = []
            searchPerformed.value = false

            show('User added to team', 'success')
        } catch (err) {
            if (err.response?.status === 422 && err.response.data.errors) {
                const firstField = Object.keys(err.response.data.errors)[0]
                const firstError = err.response.data.errors[firstField][0]
                show(firstError, 'error')
            } else {
                show('Failed to add user', 'error')
                console.error('❌ Failed to add user:', err)
            }
        }
    }

    const removeMember = async (userId) => {
        try {
            await axios.delete(`/teams/${route.params.id}/members/${userId}`)
            members.value = members.value.filter(m => m.id !== userId)
            show('User removed from team.', 'success')
        } catch (err) {
            show('Failed to remove member', 'error')
            console.error('❌ Failed to remove member:', err)
        }
    }
</script>
<style scoped>
    @import '../../assets/styles/forms.css';
</style>