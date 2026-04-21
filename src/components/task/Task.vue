<template>
    <main>
        <div>
            <div id="task_header">
                <section id="task_header_title">
                    <div class="title_with_edit">
                        <template v-if="!editingTitle">
                            <h1 class="page_title">{{ task?.title }}</h1>
                            <button type="button" class="inline_edit_btn" title="Edit title" @click="startEditTitle">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                        </template>

                        <template v-else>
                            <div class="inline_edit_block title_edit_block">
                                <input
                                    v-model="editingTitleText"
                                    type="text"
                                    class="inline_edit_input title_edit_input"
                                    maxlength="255"
                                >
                                <div class="inline_edit_actions">
                                    <button type="button" class="button" @click="saveTitle">Save</button>
                                    <button type="button" class="button button_cancel" @click="cancelEditTitle">Cancel</button>
                                </div>
                            </div>
                        </template>
                    </div>
                </section>
                <section id="task_header_team_assigned-to_created-at">
                    <div class="task_header_team_inner_div">
                        <img src="/icons/team.jpg" class="icon_thumbnail icon_current_team" title="Team">
                        <select v-model.number="edit.team_id" @change="onTeamChanged">
                            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
                        </select>
                    </div>
                    <select id="status" v-model="edit.status" @change="handleStatusChange">
                        <option v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</option>
                    </select>
                    <div class="task_header_assigned-to_inner_div">
                        <div class="task_header_assigned-to_inner_inner_div">
                            <img src="/icons/person.jpg" class="icon_thumbnail icon_current_user" title="Assigned to">
                            <div id="assigned_to">
                                {{ task?.assigned_to ? fullName(task.assigned_to) : 'unassigned' }}
                            </div>
                        </div>

                        <img
                            :src="task?.assigned_to ? ICONS.change_user : ICONS.assign_to"
                            class="icon_thumbnail icon_assign_to"
                            :title="task?.assigned_to ? 'Change assignee' : 'Assign to'"
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
                    <teleport to="body">
                        <div v-if="showCloseModal" class="modal_overlay" @click.self="closeCloseModal">
                            <div class="modal_card close_task_modal" role="dialog" aria-modal="true">
                                <h3 class="modal_title">Close task</h3>

                                <textarea
                                    v-model="closureNote"
                                    class="close_task_note"
                                    :class="{ 'input_error': closureNoteError }"
                                    rows="6"
                                    maxlength="2000"
                                    placeholder="Write closure note..."
                                    @input="onClosureNoteInput"
                                ></textarea>

                                <p class="close_task_hint">
                                    Minimum 20 characters.
                                </p>
                                <p v-if="closureNoteError" class="close_task_error">
                                    {{ closureNoteError }}
                                </p>

                                <div class="modal_actions">
                                    <button type="button" class="button button_cancel" :disabled="closingInProgress" @click="closeCloseModal">
                                        Cancel
                                    </button>

                                    <button type="button" class="button btn_ok" :disabled="closingInProgress" @click="confirmCloseTask">
                                        OK
                                    </button>
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
                        <p>{{ fullName(task.created_by) }}</p>
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
                    <div class="description_header">
                        <p id="description_label" class="label">Description</p>
                        <button
                            v-if="!editingDescription"
                            type="button"
                            class="inline_edit_btn"
                            title="Edit description"
                            @click="startEditDescription"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </div>

                    <template v-if="!editingDescription">
                        <p class="description">{{ task.description }}</p>
                    </template>

                    <template v-else>
                        <div class="inline_edit_block">
                            <textarea
                                v-model="editingDescriptionText"
                                rows="5"
                                maxlength="2000"
                                class="inline_edit_textarea"
                            ></textarea>

                            <div class="inline_edit_actions">
                                <button type="button" class="button" @click="saveDescription">Save</button>
                                <button type="button" class="button button_cancel" @click="cancelEditDescription">Cancel</button>
                            </div>
                        </div>
                    </template>

                    <div class="attachments">
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
                                    <div id="comment_meta_row">
                                        <small class="comment_dates">{{ new Date(c.created_at).toLocaleString() }}</small>

                                        <button
                                            v-if="c.user_id === authUser?.id && editingCommentId !== c.id"
                                            type="button"
                                            class="comment_edit_btn"
                                            title="Edit comment"
                                            @click="startEditComment(c)"
                                        >
                                            <i class="fa-solid fa-pen"></i>
                                        </button>

                                        <small v-if="c.updated_at && c.updated_at !== c.created_at" class="comment_dates">(edited)</small>
                                    </div>
                                </div>
                                <div id="comment_comment">
                                    <template v-if="editingCommentId === c.id">
                                        <textarea
                                            v-model="editingCommentText"
                                            rows="3"
                                            maxlength="2000"
                                            class="comment_edit_textarea"
                                        ></textarea>

                                        <div class="comment_edit_actions">
                                            <button
                                                type="button"
                                                class="button"
                                                :disabled="updatingComment || !editingCommentText.trim()"
                                                @click="saveEditComment(c.id)"
                                            >
                                                Save
                                            </button>

                                            <button
                                                type="button"
                                                class="button button_cancel"
                                                :disabled="updatingComment"
                                                @click="cancelEditComment"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </template>

                                    <p v-else>{{ c.comment }}</p>
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
                <div v-if="commentsLastPage > 1" class="comments_pagination">
                    <button
                        type="button"
                        class="pagination_btn"
                        :disabled="commentsPage === 1 || loadingComments"
                        @click="loadComments(commentsPage - 1)"
                    >
                        &lt;
                    </button>

                    <span class="comments_pagination_info">
                        {{ commentsPage }} / {{ commentsLastPage }}
                    </span>

                    <button
                        type="button"
                        class="pagination_btn"
                        :disabled="commentsPage === commentsLastPage || loadingComments"
                        @click="loadComments(commentsPage + 1)"
                    >
                        &gt;
                    </button>
                </div>
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
            :single-button="confirmSingleButton"
            @ok="confirmOk && confirmOk()"
            @cancel="confirmCancel && confirmCancel()"
        />
    </main>
</template>
<script setup>
    import { ref, onMounted, onBeforeUnmount } from 'vue'
    import { useRoute } from 'vue-router'
    import axios from 'axios'
    import Multiselect from 'vue-multiselect'
    import 'vue-multiselect/dist/vue-multiselect.min.css'
    import ConfirmDialog from '../partials/ConfirmDialog.vue'

    onBeforeUnmount(() => {
        document.body.style.overflow = ''
    })

    const route = useRoute()

    const task = ref(null)
    const teams = ref([])
    const comments = ref([])
    const authUser = ref(null)

    const showAttachments = ref(false)
    const loadingComments = ref(false)
    const creating = ref(false)
    const updatingComment = ref(false)
    const isLoadingUsers = ref(false)

    const newComment = ref('')
    const searchResults = ref([])
    const inputQuery = ref('')
    const showAssignModal = ref(false)
    const candidateUser = ref(null)

    const showConfirm = ref(false)
    const confirmCfg = ref({ title: '', message: '', danger: false })
    const confirmSingleButton = ref(false)

    const editingCommentId = ref(null)
    const editingCommentText = ref('')

    const commentsPage = ref(1)
    const commentsLastPage = ref(1)

    const editingTitle = ref(false)
    const editingDescription = ref(false)
    const editingTitleText = ref('')
    const editingDescriptionText = ref('')

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

    const STATUS_OPTIONS = ['unassigned', 'new', 'pending', 'in_progress', 'blocked', 'for_review', 'completed', 'closed']
    const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical']

    const edit = ref({
        status: 'unassigned',
        team_id: null,
        priority: 'medium',
    })

    const showCloseModal = ref(false)
    const closureNote = ref('')
    const closingInProgress = ref(false)
    const closureNoteError = ref('')

    let confirmOk = null
    let confirmCancel = null

    function getExtension(name) {
        const parts = String(name).split('.')
        return parts.length > 1 ? parts.pop().toLowerCase() : ''
    }

    function isImage(name) {
        return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(getExtension(name))
    }

    function isZip(name) {
        return /\.zip$/i.test(name)
    }

    function thumbSrc(file) {
        if (isImage(file.name)) return file.url
        return ICONS[getExtension(file.name)] ?? ICONS.txt
    }

    function fullName(user) {
        return `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim()
    }

    function userLabel(user) {
        if (!user) return 'unassigned'

        const name = user.name ?? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
        return name || user.email || `#${user.id}`
    }

    function formatSize(bytes) {
        if (bytes == null) return ''

        const units = ['B', 'KB', 'MB', 'GB']
        let value = Number(bytes)
        let unitIndex = 0

        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024
            unitIndex++
        }

        return `${value.toFixed(value < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`
    }

    function syncEditFromTask() {
        edit.value.status = task.value?.status ?? 'unassigned'
        edit.value.team_id = task.value?.team?.id ?? null
        edit.value.priority = task.value?.priority ?? 'medium'
    }

    function applyStatusClass() {
        const el = document.getElementById('status')
        if (!el) return

        el.className = ''

        const status = (task.value?.status || '').trim().toLowerCase()

        el.classList.add(
            status === 'unassigned' ? 'status-unassigned' :
            status === 'new' ? 'status-new' :
            status === 'pending' ? 'status-pending' :
            status === 'in_progress' ? 'status-in_progress' :
            status === 'blocked' ? 'status-blocked' :
            status === 'for_review' ? 'status-for_review' :
            status === 'completed' ? 'status-completed' :
            status === 'closed' ? 'status-closed' :
            'status-default'
        )
    }

    function applyPriorityClass() {
        const el = document.getElementById('task_data_priority')
        if (!el) return

        el.className = ''

        const priority = (task.value?.priority || '').trim().toLowerCase()

        el.classList.add(
            priority === 'low' ? 'priority-low' :
            priority === 'medium' ? 'priority-medium' :
            priority === 'high' ? 'priority-high' :
            priority === 'critical' ? 'priority-critical' :
            'priority-default'
        )
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

    function startEditComment(comment) {
        editingCommentId.value = comment.id
        editingCommentText.value = comment.comment
    }

    function cancelEditComment() {
        editingCommentId.value = null
        editingCommentText.value = ''
    }

    function startEditTitle() {
        editingTitleText.value = task.value?.title ?? ''
        editingTitle.value = true
    }

    function cancelEditTitle() {
        editingTitle.value = false
        editingTitleText.value = ''
    }

    function startEditDescription() {
        editingDescriptionText.value = task.value?.description ?? ''
        editingDescription.value = true
    }

    function cancelEditDescription() {
        editingDescription.value = false
        editingDescriptionText.value = ''
    }

    function ask(message, title = 'Are you sure?', danger = false) {
        if (showConfirm.value) {
            confirmCancel?.()
            confirmOk = null
            confirmCancel = null
            showConfirm.value = false
        }

        confirmSingleButton.value = false
        confirmCfg.value = { title, message, danger }
        showConfirm.value = true

        return new Promise(resolve => {
            confirmOk = () => {
                showConfirm.value = false
                confirmSingleButton.value = false
                confirmOk = null
                confirmCancel = null
                resolve(true)
            }

            confirmCancel = () => {
                showConfirm.value = false
                confirmSingleButton.value = false
                confirmOk = null
                confirmCancel = null
                resolve(false)
            }
        })
    }

    async function searchUsers(query) {
        inputQuery.value = query

        const teamId = edit.value.team_id ?? task.value?.team?.id ?? null

        if (!query || !teamId) {
            searchResults.value = []
            return
        }

        isLoadingUsers.value = true

        try {
            const res = await axios.post('/users/search', { query, team_id: teamId })

            searchResults.value = (res.data || []).map(user => ({
                ...user,
                name: user.name ?? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
            }))
        } catch (err) {
            console.error('Error searching users:', err)
            searchResults.value = []
        } finally {
            isLoadingUsers.value = false
        }
    }

    function showWarning(message, title = 'Warning') {
        if (showConfirm.value) {
            confirmCancel?.()
            confirmOk = null
            confirmCancel = null
            showConfirm.value = false
        }

        confirmCfg.value = { title, message, danger: false }
        confirmSingleButton.value = true
        showConfirm.value = true

        confirmOk = () => {
            showConfirm.value = false
            confirmSingleButton.value = false
            confirmOk = null
            confirmCancel = null
        }

        confirmCancel = null
    }

    function openCloseModal() {
        closureNote.value = ''
        closureNoteError.value = ''
        showCloseModal.value = true
        document.body.style.overflow = 'hidden'
    }

    function closeCloseModal() {
        showCloseModal.value = false
        closureNote.value = ''
        closureNoteError.value = ''
        document.body.style.overflow = showAssignModal.value ? 'hidden' : ''
    }

    async function handleStatusChange() {
        const oldStatus = task.value?.status ?? 'unassigned'
        const newStatus = edit.value.status
        const hasAssignedUser = !!task.value?.assigned_to
        const currentPriority = task.value?.priority ?? 'medium'

        if (newStatus === oldStatus) return

        if (!hasAssignedUser && newStatus !== 'unassigned') {
            edit.value.status = oldStatus

            showWarning('Please assign the task to a user before changing the status.')
            return
        }

        const blockedStatuses = ['for_review', 'completed', 'closed']
        const blockedPriorities = ['high', 'critical']

        if (
            blockedStatuses.includes(newStatus) &&
            blockedPriorities.includes(currentPriority)
        ) {
            edit.value.status = oldStatus

            showWarning('Please lower the priority before moving the task to For Review, Completed or Closed.')
            return
        }

        if (newStatus === 'closed') {
            edit.value.status = oldStatus
            openCloseModal()
            return
        }

        await confirmAndUpdate('status', oldStatus, newStatus, {
            status: newStatus
        })
    }

    async function confirmCloseTask() {
        const note = closureNote.value.trim()

        if (note.length < 20) {
            closureNoteError.value = 'Closure note must be at least 20 characters.'
            return
        }

        closureNoteError.value = ''

        const ok = await ask('Are you sure?', 'Close task?')

        if (!ok) {
            return
        }

        closingInProgress.value = true

        try {
            await confirmAndUpdate('status', task.value?.status ?? 'unassigned', 'closed', {
                status: 'closed',
                closure_note: note
            })

            closeCloseModal()
        } catch (e) {
            console.error('Close task failed', e.response?.data || e.message)
        } finally {
            closingInProgress.value = false
        }
    }

    function onClosureNoteInput() {
        if (closureNoteError.value && closureNote.value.trim().length >= 20) {
            closureNoteError.value = ''
        }
    }

    async function confirmAndUpdate(kind, fromVal, toVal, payload) {
        const message =
            kind === 'status'
                ? `Change status from "${fromVal}" to "${toVal}"?`
                : kind === 'priority'
                    ? `Change priority from "${fromVal}" to "${toVal}"?`
                    : kind === 'team'
                        ? `Move task to team "${toVal}"?\nAssigned user will be cleared.`
                        : kind === 'title'
                            ? `Change title from "${fromVal}" to "${toVal}"?`
                            : kind === 'description'
                                ? 'Change description?'
                                : 'Apply changes?'

        const ok = await ask(message, 'Are you sure?')

        if (!ok) {
            syncEditFromTask()
            return
        }

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

    async function confirmAssign() {
        if (!candidateUser.value) return

        const toLabel = userLabel(candidateUser.value)
        const fromLabel = task.value?.assigned_to ? userLabel(task.value.assigned_to) : 'unassigned'
        const ok = await ask(`Assign task to "${toLabel}"?\n(Current: ${fromLabel})`, 'Are you sure?')

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

    async function saveTitle() {
        const newVal = editingTitleText.value.trim()
        const oldVal = task.value?.title ?? ''

        if (!newVal) return

        if (newVal === oldVal) {
            cancelEditTitle()
            return
        }

        try {
            await confirmAndUpdate('title', oldVal, newVal, { title: newVal })
            cancelEditTitle()
        } catch (e) {
            console.error(e)
        }
    }

    async function saveDescription() {
        const newVal = editingDescriptionText.value.trim()
        const oldVal = task.value?.description ?? ''

        if (!newVal) return

        if (newVal === oldVal) {
            cancelEditDescription()
            return
        }

        try {
            await confirmAndUpdate('description', oldVal, newVal, { description: newVal })
            cancelEditDescription()
        } catch (e) {
            console.error(e)
        }
    }

    async function saveEditComment(commentId) {
        if (!editingCommentText.value.trim()) return

        updatingComment.value = true

        try {
            const response = await axios.post(`/comments/${commentId}/change`, {
                mode: 'update',
                comment: editingCommentText.value.trim(),
            })

            const index = comments.value.findIndex(comment => comment.id === commentId)

            if (index !== -1) {
                comments.value[index] = response.data
            }

            cancelEditComment()
        } finally {
            updatingComment.value = false
        }
    }

    async function onTeamChanged() {
        const teamName = teams.value.find(team => team.id === edit.value.team_id)?.name ?? ''

        await confirmAndUpdate('team', task.value?.team?.name ?? '(none)', teamName, {
            team: edit.value.team_id,
            assigned_to: null,
        })

        searchResults.value = []
        inputQuery.value = ''
    }

    async function loadAuthUser() {
        const response = await fetch('/api/user', { credentials: 'include' })
        authUser.value = await response.json()
    }

    async function loadTask() {
        const { data } = await axios.get(`/task/${route.params.id}`)
        task.value = data
    }

    async function loadFormData() {
        const { data } = await axios.get('/tasks/form-data')
        teams.value = (data?.teams ?? []).map(team => ({
            id: team.id,
            name: team.name
        }))
    }

    async function loadComments(page = 1) {
        loadingComments.value = true

        try {
            const { data } = await axios.get('/comments', {
                params: {
                    task_id: route.params.id,
                    page
                }
            })

            comments.value = Array.isArray(data?.data) ? data.data : []
            commentsPage.value = data?.current_page ?? 1
            commentsLastPage.value = data?.last_page ?? 1
        } finally {
            loadingComments.value = false
        }
    }

    async function createComment() {
        if (!newComment.value.trim()) return

        creating.value = true

        try {
            await axios.post('/comments', {
                task_id: route.params.id,
                comment: newComment.value.trim()
            })

            newComment.value = ''
            await loadComments(1)
        } finally {
            creating.value = false
        }
    }

    async function react(comment, value) {
        const { data } = await axios.post(`/comments/${comment.id}/reaction`, { value })

        comment.likes_count = data.likes
        comment.dislikes_count = data.dislikes
        comment.my_reaction = comment.my_reaction === (value === 1) ? null : value === 1
    }

    onMounted(async () => {
        try {
            await loadAuthUser()
            await loadTask()
            await Promise.all([
                loadComments(),
                loadFormData(),
            ])

            syncEditFromTask()
            applyStatusClass()
            applyPriorityClass()
        } catch (e) {
            console.error('API error:', e.response?.status, e.response?.data || e.message)
        }
    })
</script>
<style>
    @import '../../assets/styles/task.css';

    #comment_meta_row {
        display: flex;
        align-items: center;
    }

    .comment_edit_btn,
    .inline_edit_btn {
        border: none;
        background: transparent;
        padding: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        transition: 0.2s ease;
    }

    .comment_edit_btn {
        color: #666;
        font-size: 9px;
    }

    .comment_edit_btn:hover,
    .inline_edit_btn:hover {
        transform: scale(1.08);
    }

    .comment_edit_btn:hover {
        color: #1f3fb7;
    }

    .comment_edit_textarea {
        margin: 0;
        width: 80%;
        min-height: 90px;
        resize: vertical;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 8px;
        outline: none;
        font: inherit;
    }

    .comment_edit_actions {
        display: flex;
    }

    .button_cancel {
        background: #777;
    }

    .comments_pagination {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-left: 20%;
    }

    .comments_pagination_info {
        font-weight: 600;
        min-width: 50px;
        text-align: center;
    }

    .pagination_btn {
        border: none;
        background: #2e2b83;
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: 0.2s ease;
    }

    .pagination_btn:hover {
        background: #1f1c5c;
    }

    .pagination_btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .title_with_edit {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .inline_edit_btn {
        color: #1f3fb7;
        font-size: 9px;
    }

    .inline_edit_block {
        display: flex;
        flex-direction: column;
    }

    .title_edit_block {
        align-items: center;
    }

    .title_edit_input {
        min-width: 420px;
        max-width: 600px;
        text-align: center;
        font-size: 42px;
        font-weight: 700;
        color: #3f51d8;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 8px 12px;
        outline: none;
    }

    .description_header {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .inline_edit_textarea {
        width: 100%;
        min-height: 120px;
        resize: vertical;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 8px;
        outline: none;
        font: inherit;
    }

    .inline_edit_actions {
        display: flex;
        gap: 10px;
    }

    .close_task_modal {
        width: 560px;
        max-width: calc(100vw - 40px);
    }

    .close_task_note {
        width: 100%;
        min-height: 140px;
        resize: vertical;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 8px;
        outline: none;
        font: inherit;
        box-sizing: border-box;
    }

    .close_task_hint {
        margin: 8px 0 0 0;
        font-size: 13px;
        color: #666;
    }

    .close_task_error {
        margin: 8px 0 0 0;
        font-size: 13px;
        color: #d11a2a;
    }

    .input_error {
        border: 1px solid #d11a2a;
    }
</style>