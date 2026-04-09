<template>
    <main>
       <section class="myteams_header">
          <h1 class="page_title">My Teams</h1>
          <div class="select_wrap">
             <select class="selector" v-model.number="selectedTeamId" @change="onTeamChange">
                <option :value="null" disabled>Select team…</option>
                <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
             </select>
          </div>
       </section>
       <section v-if="selectedTeamId" class="board">
          <div v-if="loading">Loading…</div>
          <div v-else class="team-board">
             <div class="team-board__users-bar">
                <div class="team-board__users-scroll">
                   <div class="avatar avatar--all" :class="{ active: selectedUserId === null }" @click="selectedUserId = null" title="All users">All</div>
                   <div v-for="m in members" :key="m.id" class="avatar_wrap">
                      <img
                         v-if="m.profile_picture"
                         class="avatar"
                         :class="{ active: selectedUserId === m.id }"
                         :src="m.profile_picture"
                         :title="`${m.first_name} ${m.last_name}`"
                         :alt="`${m.first_name} ${m.last_name}`"
                         @click="toggleUser(m.id)"
                         />
                      <div
                         v-else
                         class="avatar avatar_placeholder"
                         :class="{ active: selectedUserId === m.id }"
                         :title="`${m.first_name} ${m.last_name}`"
                         @click="toggleUser(m.id)"
                         >
                         {{ getInitials(m) }}
                      </div>
                   </div>
                </div>
             </div>
             <div class="team-board__statuses">
                <div v-for="status in statuses" :key="status.key" class="status_col">
                   {{ status.label }}
                </div>
             </div>
             <div class="team-board__columns">
                <div v-for="status in statuses" :key="status.key" class="column">
                   <div class="col_scroll">
                      <div v-for="t in getTasksByStatus(status.key)" :key="t.id" :class="[`ticket_card`, `ticket_card-${t.priority}`]">
                        <router-link :to="`/task/${t.id}`" class="ticket_title">{{ t.title }}</router-link>
                         <div class="ticket_date">{{ fmtDate(t.created_at) }}</div>
                         <div class="ticket_desc" v-if="t.description">{{ t.description }}</div>
                         <div class="ticket_meta">
                            <span :class="['badge', `badge-${t.priority}`]">{{ t.priority }}</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
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
    const selectedUserId = ref(null)

    const statuses = [
        {
            key: 'unassigned',
            label: 'Unassigned'
        },
        {
            key: 'new',
            label: 'New'
        },
        {
            key: 'pending',
            label: 'Pending'
        },
        {
            key: 'in_progress',
            label: 'In Progress'
        },
        {
            key: 'blocked',
            label: 'Blocked'
        },
        {
            key: 'for_review',
            label: 'For Review'
        },
        {
            key: 'completed',
            label: 'Completed'
        }
    ]

    function resetBoard() {
        members.value = []
        tasksByUser.value = {}
        unassigned.value = []
        selectedUserId.value = null
    }

    function fmtDate(iso) {
        if (!iso) return ''

        return new Date(iso).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    function getInitials(member) {
        const first = member?.first_name?.charAt(0) ?? ''
        const last = member?.last_name?.charAt(0) ?? ''

        return `${first}${last}`.toUpperCase()
    }

    function toggleUser(id) {
        selectedUserId.value = selectedUserId.value === id ? null : id
    }

    function getTasksByStatus(status) {
        if (status === 'unassigned') {
            return unassigned.value
        }

        let tasks = []

        if (selectedUserId.value === null) {
            tasks = Object.values(tasksByUser.value).flat()
        } else {
            tasks = tasksByUser.value[selectedUserId.value] ?? []
        }

        return tasks.filter(t => t.status === status)
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
        selectedUserId.value = null

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
    .team-board {
        --board-cols: 7;
        --board-col-min: 190px;
        width: 85%;
        margin-top: 40px;
        border: 1px solid #bfbccc;
        border-radius: 5px;
        background: #fff;
    }

    .selector {
        font-size: 17px;
        padding: 5px;
    }

    .team-board__users-bar {
        width: 100%;
        border-bottom: 1px solid #bfbccc;
        background: #bfbccc;
        padding: 12px 14px;
        box-sizing: border-box;
        overflow: hidden;
    }

    .team-board__users-scroll {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        overflow-x: auto;
        overflow-y: hidden;
        white-space: nowrap;
        scrollbar-gutter: stable;
    }

    .avatar_wrap {
        flex: 0 0 auto;
    }

    .avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        object-fit: cover;
        display: block;
        cursor: pointer;
        flex: 0 0 auto;
        border: 2px solid transparent;
        box-sizing: border-box;
    }

    .avatar.active {
        border-color: #4b57d1;
        background: rgba(75, 87, 209, 0.1);
    }

    .avatar:hover {
        transform: scale(1.05);
    }

    .avatar--all {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #efefef;
        color: #333;
        font-size: 13px;
        font-weight: 700;
    }

    .avatar_placeholder {
        background: #d9d9d9;
        color: #555;
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .avatar.active {
        border-color: #4b57d1;
    }

    .team-board__statuses,
    .team-board__columns {
        display: grid;
        grid-template-columns: repeat(7, minmax(190px, 1fr));
    }

    .status_col {
        min-height: 58px;
        border-right: 1px solid #bfbccc;
        border-bottom: 1px solid #bfbccc;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0 16px;
        font-weight: 700;
        font-size: 16px;
        text-transform: capitalize;
        box-sizing: border-box;
        color: #211c84;
    }

    .status_col:last-child {
        border-right: none;
    }

    .column {
        min-height: 520px;
        height: 520px;
        border-right: 1px solid #bfbccc;
        padding: 8px;
        box-sizing: border-box;
        background: #f8f8fb;
    }

    .column:last-child {
        border-right: none;
    }

    .col_scroll {
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 2px;
        box-sizing: border-box;
    }

    .ticket_card {
        border: 1px solid #bfbccc;
        border-radius: 8px;
        padding: 8px;
        margin-top: 8px;
        background: #fff;
        transition: all 0.15s ease;
    }

    .ticket_card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    }

    .ticket_title {
        font-weight: 700;
        font-size: 16px;
        line-height: 1.15;
        word-break: break-word;
        color: #211c84;
        text-decoration: none;
    }

    .ticket_date {
        font-size: 12px;
        opacity: 0.75;
        margin-top: 4px;
        color: black;
        font-weight: 600;
    }

    .ticket_desc {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin-top: 6px;
        font-size: 13px;
        line-height: 1.3;
        opacity: 0.9;
        word-break: break-word;
    }

    .ticket_meta {
        margin-top: 8px;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }

    .badge {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 999px;
        color: white;
        font-weight: 600;
        margin-top: 6px;
    }

    .badge-low { 
        background: #008000; 
    }

    .badge-medium { 
        background: #ffa500; 
    }

    .badge-high { 
        background: #d96e66; 
    }

    .badge-critical { 
        background: #8b0000; 
    }

    .badge-low,
    .badge-medium,
    .badge-high,
    .badge-critical {
        border: 1px solid currentColor;
    }

    .ticket_card-high,
    .ticket_card-critical {
        background-color: #f5eeed;
        border-color: #d96e66;
    }

    .select_wrap select {
        flex: 1;
        height: 42px;
        padding: 5px 12px;
        width: 100%;
        border: 1px solid #d7d7d7;
        border-radius: 10px;
        background: #fff;
        font-size: 14px;
    }

    @media (max-width: 1400px) {
        .team-board {
            overflow-x: auto;
        }

        .team-board__users-bar,
        .team-board__statuses,
        .team-board__columns {
            min-width: calc(var(--board-cols) * var(--board-col-min));
        }
    }
</style>