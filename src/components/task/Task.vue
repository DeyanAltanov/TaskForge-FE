<template>
    <main>
        <div>
            <div id="task_header">
                <section id="task_header_title_status_btns">
                    <select id="status"
                            v-model="edit.status"
                            @change="confirmAndUpdate('status', task.status, edit.status, { status: edit.status })">
                        <option v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</option>
                    </select>
                    <h1 class="page_title">{{ task?.title }}</h1>
                    <div class="task_header_title_status_btns_inner_div">
                        <button class="button">Edit</button>
                    </div>
                </section>
                <section id="task_header_team_assigned-to_created-at">
                    <div class="task_header_team_assigned-to_created-at_inner_div">
                        <img src="/icons/team.jpg" class="icon_thumbnail">
                        <select v-model.number="edit.team_id" @change="onTeamChanged">
                            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
                        </select>
                    </div>

                    <div class="task_header_team_assigned-to_created-at_inner_div">
                        <img src="/icons/person.jpg" class="icon_thumbnail">

                        <div id="assigned_to">
                            {{ task?.assigned_to ? `${task.assigned_to.first_name} ${task.assigned_to.last_name}` : 'unassigned' }}
                        </div>

                        <img
                            :src="task?.assigned_to ? ICONS.change_user : ICONS.assign_to"
                            class="icon_thumbnail icon_assign_to"
                            :title="task?.assigned_to ? 'Change assignee' : 'Assign to user'"
                            @click="openAssignModal"
                        />
                    </div>
                    <teleport to="body">
                        <div v-if="showAssignModal" class="modal_overlay" @click.self="closeAssignModal">
                            <div class="modal_card" role="dialog" aria-modal="true">
                                <h3 class="modal_title">Assign to user</h3>

                                <Multiselect
                                    v-model="candidateUser"
                                    class="multiselect_user"
                                    :searchable="!!(edit.team_id ?? task?.team?.id)"
                                    :disabled="!(edit.team_id ?? task?.team?.id)"
                                    :loading="isLoadingUsers"
                                    :internal-search="false"
                                    :options="inputQuery.length > 0 ? searchResults : []"
                                    :show-no-options="false"
                                    :show-no-results="inputQuery.length > 0"
                                    label="name"
                                    track-by="id"
                                    :custom-label="userLabel"
                                    placeholder="Type to search…"
                                    @search-change="searchUsers"
                                />

                                <div class="modal_actions">
                                    <button type="button" class="button" @click="closeAssignModal">Cancel</button>
                                    <button type="button" class="button btn_ok" :disabled="!candidateUser" @click="confirmAssign">OK</button>
                                </div>
                            </div>
                        </div>
                    </teleport>
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
                <div>
                    <p class="label">Priority</p>
                    <select id="task_data_priority"
                            v-model="edit.priority"
                            @change="confirmAndUpdate('priority', task.priority, edit.priority, { priority: edit.priority })">
                        <option v-for="p in PRIORITY_OPTIONS" :key="p" :value="p">{{ p }}</option>
                    </select>
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
        <ConfirmDialog
            v-model="showConfirm"
            :title="confirmCfg.title"
            :message="confirmCfg.message"
            :danger="confirmCfg.danger"
            @ok="confirmOk && confirmOk()"
            @cancel="confirmCancel && confirmCancel()"
        />
    </main>
</template>
<script setup>
    import { ref, onMounted } from 'vue'
    import { useRoute } from 'vue-router'
    import axios from 'axios'
    import Multiselect from 'vue-multiselect'
    import 'vue-multiselect/dist/vue-multiselect.min.css'
    import ConfirmDialog from '../partials/ConfirmDialog.vue'

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
        change_user: '/icons/change_user.jpg',
        assign_to: '/icons/assign_to.jpg'
    }
    const STATUS_OPTIONS   = ['unassigned','pending','in_progress','blocked','for_review','completed']
    const PRIORITY_OPTIONS = ['low','medium','high','critical']
    const teams = ref([])
    const isLoadingUsers = ref(false)
    const searchResults = ref([])
    const inputQuery = ref('')
    const edit = ref({
        status: 'unassigned',
        team_id: null,
        assigned_user: null,
        priority: 'medium',
    })
    const searchUsers = async (query) => {
        inputQuery.value = query
        const teamId = edit.value.team_id ?? task.value?.team?.id ?? null
        if (!query || !teamId) { searchResults.value = []; return }

        isLoadingUsers.value = true
        try {
            const res = await axios.post('/users/search', { query, team_id: teamId })
            searchResults.value = (res.data || []).map(u => ({
                ...u,
                name: u.name ?? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
            }))
        } catch (err) {
            console.error('Error searching users: ', err)
            searchResults.value = []
        } finally {
            isLoadingUsers.value = false
        }
    }
    const showAssignModal = ref(false)
    const candidateUser   = ref(null)
    const showConfirm = ref(false)
    const confirmCfg  = ref({ title: '', message: '', danger: false })

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

    function isZip(name) {
        return /\.zip$/i.test(name)
    }

    function openAssignModal() {
        candidateUser.value = null
        searchResults.value = []
        inputQuery.value = ''
        showAssignModal.value = true
        document.body.style.overflow = 'hidden'
    }

    function closeAssignModal() {
        showAssignModal.value = false
        document.body.style.overflow = ''
    }

    async function confirmAssign() {
        if (!candidateUser.value) return

        const toLabel = userLabel(candidateUser.value)
        const fromLabel = task.value?.assigned_to ? userLabel(task.value.assigned_to) : 'unassigned'
        const msg = `Assign task to "${toLabel}"?\n(Current: ${fromLabel})`

        const ok = await ask(msg, 'Are you sure?')
        if (!ok) return

        try {
            const { data } = await axios.patch(`/task/${task.value.id}`, {
            assigned_to: candidateUser.value.id
            })

            task.value = data
            syncEditFromTask()
            applyStatusClass()
            applyPriorityClass()
            closeAssignModal()
        } catch (e) {
            console.error('Update failed.', e.response?.data || e.message)
        }
    }

    function ask(msg, title='Are you sure?', danger=false){
        confirmCfg.value = { title, message: msg, danger }
        showConfirm.value = true
        return new Promise(resolve => {
            const onOk = () => resolve(true)
            const onCancel = () => resolve(false)
            confirmOk = onOk; confirmCancel = onCancel
        })
    }
    let confirmOk = null, confirmCancel = null

    function formatSize(bytes) {
        if (bytes == null) return ''
        const units = ['B','KB','MB','GB']
        let i = 0, n = Number(bytes)
        while (n >= 1024 && i < units.length-1) { n /= 1024; i++ }
        return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
    }

    function userLabel(u) {
        if (!u) return 'unassigned'
        const n = u.name ?? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
        return n || (u.email ?? `#${u.id}`)
    }

    function syncEditFromTask() {
        edit.value.status   = task.value?.status ?? 'unassigned'
        edit.value.team_id  = task.value?.team?.id ?? null
        edit.value.priority = task.value?.priority ?? 'medium'
        edit.value.assigned_user = task.value?.assigned_to
            ? {
                ...task.value.assigned_to,
                name: `${task.value.assigned_to.first_name ?? ''} ${task.value.assigned_to.last_name ?? ''}`.trim()
            }
            : null
    }

    function applyStatusClass() {
        const el = document.getElementById('status')
        if (!el) return
        el.className = ''
        const s = (task.value?.status || '').trim().toLowerCase()
        el.classList.add(
            s === 'unassigned' ? 'status-unassigned' :
            s === 'pending'    ? 'status-pending'    :
            s === 'in_progress'? 'status-in_progress':
            s === 'blocked'    ? 'status-blocked'    :
            s === 'for_review' ? 'status-for_review' :
                                'status-default'
        )
    }

    function applyPriorityClass() {
        const el = document.getElementById('task_data_priority')
        if (!el) return
        el.className = ''
        const p = (task.value?.priority || '').trim().toLowerCase()
        el.classList.add(
            p === 'low'      ? 'priority-low' :
            p === 'medium'   ? 'priority-medium' :
            p === 'high'     ? 'priority-high' :
            p === 'critical' ? 'priority-critical' :
                            'priority-default'
        )
    }

    async function onTeamChanged() {
        const teamName = teams.value.find(t => t.id === edit.value.team_id)?.name ?? ''
        await confirmAndUpdate('team', task.value?.team?.name ?? '(none)', teamName, {
            team: edit.value.team_id,
            assigned_to: null,
        })
        edit.value.assigned_user = null
        searchResults.value = []
        inputQuery.value = ''
    }

    async function loadTask() {
        const url = `/task/${route.params.id}`
        const { data } = await axios.get(url)
        task.value = data
    }

    async function loadFormData() {
        const { data } = await axios.get('/tasks/form-data')
        teams.value = (data?.teams ?? []).map(t => ({ id: t.id, name: t.name }))
    }

    async function confirmAndUpdate(kind, fromVal, toVal, payload) {
        const msg =
            kind === 'status'
            ? `Change status from "${fromVal}" to "${toVal}"?`
            : kind === 'priority'
            ? `Change priority from "${fromVal}" to "${toVal}"?`
            : kind === 'team'
            ? `Move task to team "${toVal}"?\nAssigned user will be cleared.`
            : 'Apply changes?'

        const ok = await ask(msg, 'Are you sure?')
        if (!ok) { syncEditFromTask(); return }

        try {
            const { data } = await axios.patch(`/task/${task.value.id}`, payload)
            task.value = data
            syncEditFromTask()
            applyStatusClass()
            applyPriorityClass()
            return data
        } catch (e) {
            console.error('Update failed', e.response?.data || e.message)
            syncEditFromTask()
            return Promise.reject(e)
        }
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
            await Promise.all([
                loadComments(),
                loadFormData(),
            ])
            syncEditFromTask()
            applyStatusClass()
            applyPriorityClass()
        } catch (e) {
            console.error('API error: ', e.response?.status, e.response?.data || e.message)
        }
    })
</script>
<style>
    @import '../../assets/styles/task.css';
</style>