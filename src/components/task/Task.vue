<template>
    <main>
        <div>
            <h1 class="page_title">{{ task?.title }}</h1>

            <div id="task_details">
                <p id="task_date" v-if="task?.created_at">Created at: 
                    {{ new Date(task.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) }}
                </p>
                <section id="task_properties">
                    <div v-if="task?.team" class="row">
                        <p class="label">Team</p>
                        <p class="value">{{ task.team.name }}</p>
                    </div>
                    <div v-if="task?.assigned_to" class="row">
                        <p class="label">Assigned to</p>
                        <p class="value">{{ task.assigned_to.first_name }} {{ task.assigned_to.last_name }}</p>
                    </div> 
                    <div v-if="task?.status" class="row">
                        <p class="label">Status</p>
                        <p class="value">{{ task.status }}</p>
                    </div>
                    <div v-if="task?.priority" class="row">
                        <p class="label">Priority</p>
                        <p class="value">{{ task.priority }}</p>
                    </div>
                </section>
                <div v-if="task?.description" class="row">
                    <p class="label">Description</p>
                    <div class="value">
                        <p class="description">{{ task.description }}</p>
                    </div>
                </div>
            </div>
        </div>

        <section v-if="task?.id" class="mt-6">
            <h2>Comments</h2>

            <div v-if="!loadingComments && comments.length === 0" id="no_comments">No comments.</div>

            <ul v-else>
                <li v-for="c in comments" :key="c.id" class="mb-3">
                    <div class="meta">
                        <strong>{{ fullName(c.user) }}</strong>
                        <small> • {{ new Date(c.created_at).toLocaleString() }}</small>
                        <small v-if="c.updated_at && c.updated_at !== c.created_at">(edited)</small>
                    </div>

                    <p class="body">{{ c.comment }}</p>

                    <div class="actions">
                        <button @click="react(c, 1)">
                            👍 {{ c.likes_count ?? 0 }} <span v-if="c.my_reaction === true"></span>
                        </button>
                        <button @click="react(c, 0)">
                            👎 {{ c.dislikes_count ?? 0 }} <span v-if="c.my_reaction === false"></span>
                        </button>
                    </div>
                </li>
            </ul>

            <form @submit.prevent="createComment" class="mb-4">
                <textarea v-model="newComment" rows="3" maxlength="2000" placeholder="Leave a comment…" required></textarea>
                <button :disabled="creating || !newComment.trim()" class="button">Publish</button>
            </form>
        </section>
    </main>
</template>
<script setup>
    import { ref, onMounted } from 'vue'
    import { useRoute } from 'vue-router'
    import axios from 'axios'

    const route = useRoute()
    const task = ref(null)

    const comments = ref([])
    const loadingComments = ref(false)
    const newComment = ref('')
    const creating = ref(false)

    function fullName(u) { return `${u?.first_name ?? ''} ${u?.last_name ?? ''}`.trim() }

    async function loadTask() {
        const url = `/task/${route.params.id}`
        const { data } = await axios.get(url)
        task.value = data
    }

    async function loadComments() {
        loadingComments.value = true
        try {
            const { data } = await axios.get('/comments', { params: { task_id: route.params.id, page: 1 } })
            comments.value = Array.isArray(data?.data) ? data.data : []
        } finally {
            loadingComments.value = false
        }
    }

    async function createComment() {
        if (!newComment.value.trim()) return
        creating.value = true
        try {
            await axios.post('/comments', { task_id: route.params.id, comment: newComment.value.trim() })
            newComment.value = ''
            await loadComments()
        } finally {
            creating.value = false
        }
    }

    async function react(c, value) {
        const { data } = await axios.post(`/comments/${c.id}/reaction`, { value })
        c.likes_count = data.likes
        c.dislikes_count = data.dislikes
        if (c.my_reaction === (value === 1)) {
            c.my_reaction = null
        } else {
            c.my_reaction = (value === 1)
        }
    }

    onMounted(async () => {
        try {
            await loadTask()
            await loadComments()
        } catch (e) {
            console.error('API error: ', e.response?.status, e.response?.data || e.message)
        }
    })
</script>
<style>
    @import '../../assets/styles/task.css';
</style>