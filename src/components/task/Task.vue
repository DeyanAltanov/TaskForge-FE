<template>
    <main>
        <div>
            <div id="task_header">
                <section id="task_header_title_status_btns">
                    <div class="task_header_title_status_btns_inner_div">
                        <p v-if="task?.status" id="status">{{ task.status }}</p>
                        <h1 class="page_title">{{ task?.title }}</h1>
                    </div>
                    <div class="task_header_title_status_btns_inner_div">
                        <button class="button">Edit</button>
                    </div>
                </section>
                <section id="task_header_team_assigned-to_created-at">
                    <div class="task_header_team_assigned-to_created-at_inner_div">
                        <img src="/icons/team.jpg" class="icon_thumbnail">
                        <div v-if="task?.team" id="team">{{ task.team.name }}</div>
                    </div>
                    <div class="task_header_team_assigned-to_created-at_inner_div">
                        <img src="/icons/person.jpg" class="icon_thumbnail">
                        <div id="assigned_to">{{ task?.assigned_to ? `${task.assigned_to.first_name} ${task.assigned_to.last_name}` : 'unassigned' }}</div>
                    </div>


                </section>
            </div>
            <div id="task_data">
                <div>
                    <div>
                        <p class="label">Created at</p>
                        <p id="task_date" v-if="task?.created_at">
                            {{ new Date(task.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) }}
                        </p>
                    </div>
                    <div v-if="task?.created_by" id="task_data_created-by">
                        <p class="label">Created by</p>
                        <p>{{ task.created_by.first_name }} {{ task.created_by.last_name }}</p>
                    </div>
                </div>
                <div v-if="task?.priority">
                    <p class="label">Priority</p>
                    <p id="task_data_priority">{{ task.priority }}</p>
                </div> 
            </div>
            <div id="task_details">
                <div v-if="task?.description">
                    <p id='description_label' class="label">Description</p>
                    <p class="description">{{ task.description }}</p>
                    <div class="attachments" >
                        <div class="attachments-header" @click="showAttachments = !showAttachments">
                            <p class="label">Attachments</p>
                            <span class="arrow">{{ showAttachments ? '▲' : '▼' }}</span>
                        </div>

                        <transition name="slide">
                            <div v-if="showAttachments && task?.files?.length" class="attachments-scroller">
                                <a v-for="f in task.files"
                                    :key="f.id"
                                    class="thumb-card"
                                    :href="f.url"
                                    target="_blank"
                                    rel="noopener"
                                    :download="isZip(f.name) ? f.name : null"
                                    :title="f.name">
                                    <img class="thumb" :src="thumbSrc(f)" :alt="f.name">
                                    <div class="thumb-name">
                                        <span class="name">{{ f.name }}</span>
                                        <small class="size">({{ formatSize(f.size_bytes) }})</small>
                                    </div>
                                </a>
                            </div>
                        </transition>
                    </div>
                </div>
            </div>
            <div v-if="task?.id" id="task_comments" class="mt-6">
                <h2 id="comments_label">Comments</h2>

                <div v-if="!loadingComments && comments.length === 0" id="no_comments">No comments.</div>

                <ul v-else>
                    <li v-for="c in comments" :key="c.id" class="mb-3">
                        <div id="comment">
                            <img :src="c.user.profile_picture" class="avatar" id="comment_avatar" alt="">
                            <div id="comment_info">
                                <div id="comment_name_date">
                                    <strong id="comment_name">{{ fullName(c.user) }}</strong>
                                    <small class="comment_dates">{{ new Date(c.created_at).toLocaleString() }}</small>
                                    <small v-if="c.updated_at && c.updated_at !== c.created_at" class="comment_dates">(edited)</small>
                                </div>
                                <div id="comment_comment">
                                    <p>{{ c.comment }}</p>
                                </div>
                            </div>
                            <div id="comment_actions">
                                <div id="comment_actions_container">
                                    <button type="button" class="button_thumb" :class="{ active: c.my_reaction === true }" @click="react(c, 1)">
                                        <i class="fa-solid fa-thumbs-up"></i><span>{{ c.likes_count ?? 0 }}</span>
                                    </button>
                                    <button type="button" class="button_thumb" :class="{ active: c.my_reaction === false }" @click="react(c, 0)">
                                        <i class="fa-solid fa-thumbs-down"></i>
                                        <span>{{ c.dislikes_count ?? 0 }}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
                <form @submit.prevent="createComment" class="mb-4">
                    <textarea v-model="newComment" rows="3" maxlength="2000" placeholder="Leave a comment…" required></textarea>
                    <button :disabled="creating || !newComment.trim()" class="button">Publish</button>
                </form>
            </div>
        </div>
    </main>
</template>
<script setup>
    import { ref, onMounted } from 'vue'
    import { useRoute } from 'vue-router'
    import axios from 'axios'

    const showAttachments = ref(false)
    const route = useRoute()
    const task = ref(null)
    const comments = ref([])
    const loadingComments = ref(false)
    const newComment = ref('')
    const creating = ref(false)
    const ICONS = {
        txt: '/icons/txt.jpg',
        zip: '/icons/zip.jpg',
        pdf: '/icons/pdf.jpg',
        doc: '/icons/docx.jpg',
        docx: '/icons/docx.jpg',
        xlsx: '/icons/xlsx.jpg',
        xls: '/icons/xlsx.jpg',
    }

    onMounted(async () => {
        await loadTask()
        const status = task.value?.status?.trim().toLowerCase()
        const status_element = document.getElementById('status')

        switch (status) {
            case 'unassigned':
                status_element.classList.add('status-unassigned')
                break
            case 'pending':
                status_element.classList.add('status-pending')
                break
            case 'in_progress':
                status_element.classList.add('status-in_progress')
                break
            case 'blocked':
                status_element.classList.add('status-blocked')
                break
            case 'for_review':
                status_element.classList.add('status-for_review')
                break
            case 'completed':
                status_element.classList.add('status-completed')
                break
            default:
                status_element.classList.add('status-default')
        }

        const priority = task.value?.priority?.trim().toLowerCase()
        const priority_element = document.getElementById('task_data_priority')
        switch (priority) {
            case 'low':
                priority_element.classList.add('priority-low')
                break
            case 'medium':
                priority_element.classList.add('priority-medium')
                break
            case 'high':
                priority_element.classList.add('priority-high')
                break
            case 'critical':
                priority_element.classList.add('priority-critical')
                break
            default:
                priority_element.classList.add('priority-default')
        }
    })

    function ext(name) {
        const i = String(name).lastIndexOf('.')
        return i === -1 ? '' : name.slice(i + 1).toLowerCase()
    }

    function isImage(name) {
        const e = ext(name)
        return ['jpg','jpeg','png','webp','gif','bmp','svg'].includes(e)
    }

    function thumbSrc(f) {
        const e = ext(f.name)
        if (isImage(f.name)) return f.url
        return ICONS[e] ?? ICONS.txt
    }

    function fullName(u) { return `${u?.first_name ?? ''} ${u?.last_name ?? ''}`.trim() }

    async function loadTask() {
        const url = `/task/${route.params.id}`
        const { data } = await axios.get(url)
        task.value = data
    }

    function isZip(name) {
        return /\.zip$/i.test(name)
    }

    function formatSize(bytes) {
        if (bytes == null) return ''
        const units = ['B','KB','MB','GB']
        let i = 0, n = Number(bytes)
        while (n >= 1024 && i < units.length-1) { n /= 1024; i++ }
        return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
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