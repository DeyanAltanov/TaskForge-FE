<template>
    <main>
       <section class="myteams_header">
          <h1 class="page_title">My Teams</h1>
          <div class="select_wrap">
            <select class='selector' v-model.number="selectedTeamId" @change="onTeamChange">
                <option :value="null" disabled>Select team…</option>
                <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
       </section>
       <section v-if="selectedTeamId" class="board">
          <div v-if="loading">Loading…</div>
          <table v-else class="team_board">
             <thead>
                <tr>
                   <th class="th_unassigned"><div class="th_inner">Unassigned</div></th>
                   <th v-for="m in members" :key="m.id" class="th_member">
                        <div class="th_inner">
                            <img class="avatar" :src="m.profile_picture" :title="`${m.first_name} ${m.last_name}`" alt="" />
                        </div>
                   </th>
                </tr>
             </thead>
             <tbody>
                <tr>
                   <td>
                      <div class="col_scroll">
                         <div v-for="t in unassigned" :key="t.id" class="ticket_card">
                            <div class="ticket_title">{{ t.title }}</div>
                            <div class="ticket_date">{{ fmtDate(t.created_at) }}</div>
                            <div class="ticket_desc" v-if="t.description">{{ t.description }}</div>
                            <div class="ticket_meta">
                               <span class="badge">{{ t.status }}</span>
                               <span class="badge">{{ t.priority }}</span>
                            </div>
                         </div>
                      </div>
                   </td>
                   <td v-for="m in members" :key="m.id">
                      <div class="col_scroll">
                         <div v-for="t in (tasksByUser[m.id] ?? [])" :key="t.id" class="ticket_card">
                            <div class="ticket_title">{{ t.title }}</div>
                            <div class="ticket_date">{{ fmtDate(t.created_at) }}</div>
                            <div class="ticket_desc" v-if="t.description">{{ t.description }}</div>
                            <div class="ticket_meta">
                               <span class="badge">{{ t.status }}</span>
                               <span class="badge">{{ t.priority }}</span>
                            </div>
                         </div>
                      </div>
                   </td>
                </tr>
             </tbody>
          </table>
       </section>
    </main>
 </template>

<script setup>
    import { ref, onMounted } from 'vue'
    import axios from 'axios'

    const teams = ref([])
    const selectedTeamId = ref(null)

    const loading = ref(false)
    const members = ref([])
    const tasksByUser = ref({})
    const unassigned = ref([])

    function resetBoard() {
        members.value = []
        tasksByUser.value = {}
        unassigned.value = []
    }

    function fmtDate(iso) {
        if (!iso) return ''

        return new Date(iso).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    async function loadTeams() {
        const {
            data
        } = await axios.get('/teams/my')
        teams.value = data?.teams ?? []
    }

    async function onTeamChange() {
        if (!selectedTeamId.value) {
            resetBoard()
            return
        }

        loading.value = true
        try {
            const {
                data
            } = await axios.get(`/teams/${selectedTeamId.value}/board`)
            members.value = data?.members ?? []
            tasksByUser.value = data?.tasksByUser ?? {}
            unassigned.value = data?.unassigned ?? []
        } catch (e) {
            console.error('Load board failed: ', e.response?.data || e.message)
            resetBoard()
        } finally {
            loading.value = false
        }
    }

    onMounted(async () => {
        try {
            await loadTeams()
        } catch (e) {
            console.error('Load teams failed: ', e.response?.data || e.message)
        }
    })
</script>
<style>
    .team_board {
        width: 70%;
        border-collapse: collapse;
        table-layout: fixed;
        margin-top: 40px;
    }

    .selector {
        font-size: 17px;
        padding: 5px ;
    }

    .team_board th,
    .team_board td {
        border: 1px solid #ddd;
        vertical-align: top;
        padding: 8px;
    }

    .team_board thead th {
        height: 60px;
    }

    .avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        object-fit: cover;
    }

    .team_board tbody td {
        height: 520px;
        padding: 8px;
    }

    .col_scroll {
        height: 100%;
        overflow-y: auto;
    }

    .ticket_card {
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 8px;
        margin-bottom: 8px;
        background: #fff;
    }

    .ticket_title {
        font-weight: 700;
    }

    .ticket_date {
        font-size: 12px;
        opacity: 0.75;
        margin-top: 2px;
    }

    .ticket_desc {
        margin-top: 6px;
        font-size: 13px;
        line-height: 1.3;
        opacity: 0.9;
    }

    .th_inner {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }

    .th_inner > .avatar {
        cursor: pointer;
    }

    .ticket_meta {
        margin-top: 8px;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }

    .badge {
        font-size: 12px;
        border: 1px solid #bbb;
        padding: 2px 6px;
        border-radius: 999px;
    }
</style>