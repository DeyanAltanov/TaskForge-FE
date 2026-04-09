<template>
    <teleport to="body">
       <aside v-if="modelValue" class="chat_drawer" role="dialog" aria-modal="false">
          <header class="chat_header">
             <div class="chat_title">Chats</div>
             <button type="button" class="chat_close" @click="close">×</button>
          </header>
          <div class="chat_search">
             <div class="chat_search_row">
                <input
                   v-model="searchQuery"
                   type="text"
                   class="chat_search_input"
                   placeholder="Search people…"
                   @input="onSearchInput"
                   >
                <button type="button" class="chat_add_btn" @click="openGroupChat">+</button>
             </div>
          </div>
          <section v-if="searchQuery.trim().length" class="chat_section">
             <div class="chat_section_title">Search results</div>
             <div class="chat_list">
                <button
                   v-for="u in searchResults"
                   :key="u.id"
                   type="button"
                   class="chat_row"
                   @click="openDm(u)"
                   >
                   <div class="avatar_wrap">
                      <img :src="u.profile_picture" class="avatar" alt="">
                      <span class="status_dot" :class="{ on: u.is_online }"></span>
                   </div>
                   <div class="row_mid">
                      <div class="row_name">{{ u.name }}</div>
                      <div class="row_sub">{{ u.is_online ? 'online' : 'offline' }}</div>
                   </div>
                </button>
             </div>
          </section>
          <section v-else class="chat_section chat_section_list">
             <div class="chat_list">
                <button
                   v-for="row in mergedList"
                   :key="row.key"
                   type="button"
                   class="chat_row"
                   @click="row.kind === 'online' ? openDm(row.user) : openConversation(row.conversation)"
                   >
                   <div class="avatar_wrap">
                      <img :src="row.avatar" class="avatar" alt="">
                      <span class="status_dot" :class="{ on: row.is_online }"></span>
                   </div>
                   <div class="row_mid">
                      <div class="row_name">{{ row.display_name }}</div>
                      <div class="row_sub">{{ row.preview }}</div>
                   </div>
                   <div class="row_right">
                      <span v-if="row.unread_count > 0" class="unread_badge">{{ row.unread_count }}</span>
                   </div>
                </button>
             </div>
          </section>
       </aside>
    </teleport>
 </template>

<script setup>
    import axios from 'axios'
    import { ref, computed, watch, onBeforeUnmount } from 'vue'
    import { useAuthStore } from '../../stores/auth'

    const props = defineProps({
        modelValue: { type: Boolean, default: false },
    })

    const emit = defineEmits(['update:modelValue', 'unread', 'open-thread'])
    const authStore = useAuthStore()
    const meId = computed(() => authStore.user?.id ?? null)
    const searchQuery = ref('')
    const searchResults = ref([])
    const onlineUsers = ref([])
    const conversations = ref([])

    let pollOnlineTimer = null
    let pollConversationsTimer = null
    let searchTimer = null

    function close() {
        emit('update:modelValue', false)
    }

    function openGroupChat() {
        alert('Group chat handler.')
    }

    function isUserOnline(userId) {
        if (!userId) return false
        return onlineUsers.value.some(u => String(u.id) === String(userId))
    }

    function computeHasUnread() {
        return conversations.value.some(c => (c.unread_count ?? 0) > 0)
    }

    const mergedList = computed(() => {
        const online = (onlineUsers.value || []).map(u => {
            const display = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || (u.name ?? 'Unknown')
                return {
                key: `u:${u.id}`,
                kind: 'online',
                user: u,
                conversation: null,
                display_name: display,
                preview: 'online',
                is_online: true,
                unread_count: 0,
                avatar: u.profile_picture || ''
            }
        })

        const convs = (conversations.value || []).map(c => {
            const other = c.other_user ?? null
            const display = other ? `${other.first_name ?? ''} ${other.last_name ?? ''}`.trim() : 'Unknown'
            const isOn = other?.id ? isUserOnline(other.id) : false
            return {
                key: `c:${c.id}`,
                kind: 'conversation',
                user: null,
                conversation: c,
                display_name: display,
                preview: c.last_message?.body ?? '',
                is_online: isOn,
                unread_count: Number(c.unread_count ?? 0),
                avatar: other?.profile_picture || '',
                sort_ts: Date.parse(c.updated_at ?? '') || 0,
                other_id: other?.id ?? null
            }
        })

        const onlineIds = new Set(online.map(x => String(x.user?.id)))
        const convsNoDup = convs.filter(x => !x.other_id || !onlineIds.has(String(x.other_id)))

        online.sort((a, b) => a.display_name.localeCompare(b.display_name))
        convsNoDup.sort((a, b) => (b.sort_ts - a.sort_ts))

        return online.concat(convsNoDup).map(x => ({
            key: x.key,
            kind: x.kind,
            user: x.user,
            conversation: x.conversation,
            display_name: x.display_name,
            preview: x.preview,
            is_online: x.is_online,
            unread_count: x.unread_count,
            avatar: x.avatar,
        }))
    })

    async function loadOnline() {
        if (!meId.value) return
        const { data } = await axios.get('/online/my-teams')
        onlineUsers.value = Array.isArray(data?.online) ? data.online : []
    }

    async function loadConversations() {
        if (!meId.value) return
        const { data } = await axios.get('/chat/conversations')
        conversations.value = Array.isArray(data?.conversations) ? data.conversations : []
        emit('unread', computeHasUnread())
    }

    function onSearchInput() {
        if (searchTimer) clearTimeout(searchTimer)

        const q = searchQuery.value.trim()
        if (!q.length) {
            searchResults.value = []
            return
        }

        searchTimer = setTimeout(searchUsers, 250)
    }

    async function searchUsers() {
        const q = searchQuery.value.trim()
        if (!q.length) return

        const { data } = await axios.post('/users/search', { query: q })
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.users) ? data.users : [])

        searchResults.value = arr.map(u => ({
            ...u,
            name: u.name ?? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
            is_online: isUserOnline(u.id),
        }))
    }

    async function openDm(u) {
        if (!u?.id) return
        if (meId.value && String(u.id) === String(meId.value)) return

        const { data } = await axios.post('/chat/dm', { user_id: u.id })
        const cid = data?.conversation_id
        if (!cid) return

        await loadConversations()

        emit('open-thread', {
            conversation_id: cid,
            other_user: u,
        })

        searchQuery.value = ''
        searchResults.value = []
    }

    function openConversation(c) {
        if (!c?.id) return
        emit('open-thread', {
            conversation_id: c.id,
            other_user: c.other_user ?? null,
        })
    }

    function startOnlinePolling() {
        if (pollOnlineTimer) clearInterval(pollOnlineTimer)
        pollOnlineTimer = setInterval(async () => {
            try {
            await axios.post('/online/ping')
            await loadOnline()
            } catch (e) {}
        }, 15000)
    }

    function startConversationsPolling() {
        if (pollConversationsTimer) clearInterval(pollConversationsTimer)
        pollConversationsTimer = setInterval(async () => {
            try {
            await loadConversations()
            } catch (e) {}
        }, 5000)
    }

    function stopAllPolling() {
        if (pollOnlineTimer) clearInterval(pollOnlineTimer)
        if (pollConversationsTimer) clearInterval(pollConversationsTimer)
        pollOnlineTimer = null
        pollConversationsTimer = null
    }

    watch(() => props.modelValue, async (v) => {
        if (v) {
            document.body.classList.add('chat-drawer-open')

            try { 
                await axios.post('/online/ping') 
            } catch (e) {}
            await Promise.all([loadOnline(), loadConversations()])
            startOnlinePolling()
            startConversationsPolling()
        } else {
            document.body.classList.remove('chat-drawer-open')
            stopAllPolling()
            searchQuery.value = ''
            searchResults.value = []
        }
    })

    onBeforeUnmount(() => {
        document.body.classList.remove('chat-drawer-open')
        stopAllPolling()
    })
</script>

<style scoped>
    .chat_drawer{
        position: fixed;
        top: 0;
        right: 0;
        width: 19vw;
        min-width: 320px;
        max-width: 420px;
        height: 100vh;
        background: #fff;
        display: flex;
        flex-direction: column;
        z-index: 9999;
        border-left: 1px solid #e5e5e5;
        box-shadow: -4px 0 18px rgba(0,0,0,.06);
    }

    .chat_header{
        display:flex;
        align-items:center;
        justify-content: space-between;
        padding: 14px 14px;
        border-bottom: 1px solid #eee;
    }

    .chat_title{
        font-weight: 700;
    }

    .chat_close{
        font-size: 26px;
        line-height: 1;
        border: 0;
        background: transparent;
        cursor: pointer;
    }

    .chat_search{
        padding: 12px 14px;
        border-bottom: 1px solid #eee;
    }

    .chat_search_row{
        display:flex;
        align-items:center;
        gap: 10px;
    }

    .chat_search_input{
        flex: 1;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 10px;
        width: auto;
    }

    .chat_add_btn{
        width: 42px;
        height: 42px;
        border: 1px solid #ddd;
        border-radius: 10px;
        background: #fff;
        cursor: pointer;
        font-size: 22px;
        line-height: 1;
    }

    .chat_add_btn:hover{
        background: #f6f6f6;
    }

    .chat_section{
        padding: 10px 0;
        border-bottom: 1px solid #eee;
        align-items: normal;
    }

    .chat_section_list{
        border-bottom: 0;
    }

    .chat_section_title{
        font-size: 12px;
        font-weight: 700;
        padding: 0 14px 8px;
    }

    .chat_list{
        display: flex;
        flex-direction: column;
    }

    .chat_row{
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border: 0;
        background: transparent;
        text-align: left;
        cursor: pointer;
    }

    .chat_row:hover{
        background: #f6f6f6;
    }

    .avatar_wrap{
        position: relative;
        width: 42px;
        height: 42px;
        flex: 0 0 42px;
    }

    .avatar{
        width: 42px;
        height: 42px;
        border-radius: 50%;
        object-fit: cover;
    }

    .status_dot{
        position: absolute;
        bottom: 2px;
        left: 2px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #d33;
        border: 2px solid #fff;
    }

    .status_dot.on{
        background: #2fbf4a;
    }

    .row_mid{
        flex: 1;
        min-width: 0;
    }

    .row_name{
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .row_sub{
        font-size: 12px;
        opacity: .7;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .row_right{
        display: flex;
        align-items: center;
    }

    .unread_badge{
        min-width: 22px;
        height: 22px;
        border-radius: 11px;
        background: #e11;
        color: #fff;
        font-size: 12px;
        display:flex;
        align-items:center;
        justify-content:center;
        padding: 0 6px;
    }
</style>