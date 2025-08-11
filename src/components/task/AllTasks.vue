<template>
    <main>
        <h1 class="page_title">All Tasks</h1>

        <table class="task-table">
            <thead>
                <tr>
                    <th @click="toggleSort('created_at')" class="sortable">Created at <span v-html="arrow('created_at')"></span></th>
                    <th>Title</th>
                    <th>Description</th>
                    <th @click="toggleSort('status')" class="sortable">Status <span v-html="arrow('status')"></span></th>
                    <th @click="toggleSort('priority')" class="sortable">Priority <span v-html="arrow('priority')"></span></th>
                    <th>Assigned to</th>
                    <th @click="toggleSort('team')" class="sortable">Team <span v-html="arrow('team')"></span></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="task in tasks" :key="task.id">
                    <td>
                        {{ new Date(task.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) }}
                    </td>
                    <td>{{ task.title }}</td>
                    <td>{{ task.description }}</td>
                    <td>{{ task.status }}</td>
                    <td>{{ task.priority }}</td>
                    <td>{{ task.assigned_to ? task.assigned_to['first_name'] + ' ' + task.assigned_to['last_name']: '' }}</td>
                    <td>{{ task.team['name'] }}</td>
                </tr>
            </tbody>
        </table>

        <div class="pagination">
            <button :disabled="currentPage===1" @click="prevPage">Prev</button>
            <span>Page {{ currentPage }} / {{ lastPage }}</span>
            <button :disabled="currentPage===lastPage" @click="nextPage">Next</button>
        </div>
    </main>
</template>

<script setup>
    import { reactive, ref, onMounted } from 'vue'
    import axios from 'axios'

    const tasks = ref([])
    const currentPage = ref(1)
    const lastPage = ref(1)

    const sort = reactive({ by: null, dir: 'asc' })

    async function fetchTasks(page = 1) {
        const params = { page }
        if (sort.by) {
            params.sort_by = sort.by
            params.sort_dir = sort.dir
        }

        const { data } = await axios.get('/all_tasks', { params })
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
</style>