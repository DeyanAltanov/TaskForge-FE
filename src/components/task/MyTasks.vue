<template>
    <main>
        <h1 class="page_title">My Tasks</h1>

        <table class="task-table-desktop">
            <thead>
                <tr>
                    <th @click="toggleSort('created_at')" class="sortable">Created at <span v-html="arrow('created_at')"></span></th>
                    <th>Title</th>
                    <th @click="toggleSort('status')" class="sortable">Status <span v-html="arrow('status')"></span></th>
                    <th @click="toggleSort('priority')" class="sortable">Priority <span v-html="arrow('priority')"></span></th>
                    <th>Assigned to</th>
                    <th @click="toggleSort('team')" class="sortable">Team <span v-html="arrow('team')"></span></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="task in tasks" :key="task.id" :class="`task-row-priority-${task.priority}`">
                    <td>
                        {{ new Date(task.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) }}
                    </td>
                    <td><router-link :to="`/task/${task.id}`" class="task_title">{{ task.title }}</router-link></td>
                    <td>{{ task.status_label  }}</td>
                    <td :class="`task-priority-${task.priority}`">{{ task.priority }}</td>
                    <td>{{ task.assigned_to ? task.assigned_to['first_name'] + ' ' + task.assigned_to['last_name']: '' }}</td>
                    <td>{{ task.team['name'] }}</td>
                </tr>
            </tbody>
        </table>
        <div class="task-table-mobile">
            <h3 class="task-mobile-cell-ticket-headline task_title" style="margin-top: 35px;">Sort by:</h3>
            <div class="task-mobile-sort">
                <select v-model="sortByMobile" @change="applyMobileSort">
                    <option value="created_at">Created at</option>
                    <option value="status">Status</option>
                    <option value="priority">Priority</option>
                    <option value="team">Team</option>
                </select>

                <select v-model="sortDirectionMobile" @change="applyMobileSort">
                    <option value="asc">ASC</option>
                    <option value="desc">DESC</option>
                </select>
            </div>
            <article class="task-mobile" v-for="task in tasks" :key="task.id">

                <h3 class="task-mobile-cell-ticket-headline">
                    <router-link :to="`/task/${task.id}`" class="task_title">
                        {{ task.title }}
                    </router-link>
                </h3>

                <div class="task-mobile-cell">
                    <p class="task-mobile-cell-headline">Created:</p>
                    <time>
                        {{ new Date(task.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) }}
                    </time>
                </div>

                <div class="task-mobile-cell">
                    <p class="task-mobile-cell-headline">Assigned to:</p>
                    <p>
                        {{ task.assigned_to
                            ? task.assigned_to['first_name'] + ' ' + task.assigned_to['last_name']
                            : '' }}
                    </p>
                </div>

                <div class="task-mobile-cell">
                    <p class="task-mobile-cell-headline">Team:</p>
                    <p>{{ task.team['name'] }}</p>
                </div>

                <div class="task-mobile-cell">
                    <p class="task-mobile-cell-headline">Status:</p>
                    <p>{{ task.status_label  }}</p>
                </div>

                <div :class="`task-priority-${task.priority} task-mobile-cell`">
                    <p class="task-mobile-cell-headline">Priority:</p>
                    <p>{{ task.priority }}</p>
                </div>

            </article>
        </div>

        <div class="pagination">
            <button :disabled="currentPage===1" @click="prevPage">Prev</button>
            <span>Page {{ currentPage }} / {{ lastPage }}</span>
            <button :disabled="currentPage===lastPage" @click="nextPage">Next</button>
        </div>
    </main>
</template>

<script setup>
    import { reactive, ref, onMounted } from 'vue'
    import { useAuthStore } from '../../stores/auth'
    import axios from 'axios'

    const tasks = ref([])
    const currentPage = ref(1)
    const lastPage = ref(1)
    const auth = useAuthStore()
    const userId = auth.user.id

    const sort = reactive({ by: null, dir: 'asc' })
    const sortByMobile = ref('created_at')
    const sortDirectionMobile = ref('asc')

    async function fetchTasks(page = 1) {
        const params = { page }
        if (sort.by) {
            params.sort_by = sort.by
            params.sort_dir = sort.dir
        }

        const { data } = await axios.get('/tasks/' + userId, { params })
        tasks.value = data.data
        currentPage.value = data.current_page
        lastPage.value = data.last_page
    }

    function toggleSort(col) {
        if (sort.by === col) {
            sort.dir = sort.dir === 'asc' ? 'desc' : 'asc'
        } else {
            sort.by = col
            sort.dir = 'asc'
        }

        sortByMobile.value = sort.by
        sortDirectionMobile.value = sort.dir
        currentPage.value = 1
        fetchTasks(1)
    }

    function applyMobileSort() {
        sort.by = sortByMobile.value
        sort.dir = sortDirectionMobile.value
        currentPage.value = 1
        fetchTasks(1)
    }

    function arrow(col) {
        if (sort.by !== col) return '&nbsp;▾'
        return sort.dir === 'asc' ? '▲' : '▼'
    }

    const nextPage = () => currentPage.value < lastPage.value && fetchTasks(currentPage.value + 1)
    const prevPage = () => currentPage.value > 1 && fetchTasks(currentPage.value - 1)

    onMounted(() => fetchTasks(1))
</script>
<style scoped>
    @import '../../assets/styles/forms.css';

    .task-mobile-sort {
        display: none;
    }

    @media (max-width: 1024px) {
        .task-mobile-sort {
            display: flex;
            margin: 0 auto;
            gap: 10px;
            width: 90%;
        }

        .task-mobile-sort select {
            flex: 1;
            height: 42px;
            padding: 5px 12px;
            width: 50%;
            border: 1px solid #d7d7d7;
            border-radius: 10px;
            background: #fff;
            font-size: 14px;
        }
    }
</style>