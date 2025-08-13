<template>
    <main>
        <h1 class="page_title">All Teams</h1>
        <div class="multiselect form">
            <Multiselect
                v-model="form.team"
                :options="teams"
                label="name"
                track-by="id"
                placeholder="Select team"
                @input="teamError = ''"
            />
            <p v-if="teamError" class="error" style="margin: 3px;">{{ teamError }}</p>
            <button type="button" @click="editTeam">Edit</button>
        </div>
    </main>
</template>
<script setup>
    import { ref, onMounted } from 'vue'
    import axios from 'axios'
    import Multiselect from 'vue-multiselect'
    import { useRouter } from 'vue-router'

    const teams = ref([])
    const users = ref([])
    const teamError = ref('')
    const router = useRouter()

    const form = ref({
        team: null
    })

    onMounted(async () => {
        try {
            const response = await axios.get('/all_teams')
            teams.value = response.data.teams
            users.value = response.data.users
        } catch (err) {
            console.error('❌ Error loading data: ', err)
        }
    })

    function editTeam() {
        if (!form.value.team) {
            teamError.value = 'Please select a team!'
            return
        }

        teamError.value = ''
        router.push({ name: 'edit_team', params: { id: form.value.team.id } })
    }
</script>
<style scoped>
    @import '../../assets/styles/forms.css';
</style>