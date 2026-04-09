<template>
    <div v-if="modelValue" class="cw_root" :class="[{ minimized }, `cw_root_${windowIndex}`]" @click="minimized ? onRestore() : null">
        <header class="cw_header">
            <div class="cw_title" @click="onRestore">
                <span v-if="otherUserName">{{ otherUserName }}</span>
                <span v-else>Chat</span>
            </div>

            <div class="cw_actions">
                <button type="button" class="cw_icon" @click.stop="onMinimize">—</button>
                <button type="button" class="cw_icon" @click.stop="onClose">×</button>
            </div>
        </header>

        <div v-if="!minimized" class="cw_body">
            <div class="cw_messages" ref="msgScroll">
                <div v-for="m in messages" :key="m.id" class="cw_msg" :class="{ mine: m.sender_id === meId }">
                    <div v-if="m.image_url" class="cw_msg_image_wrap">
                        <img :src="m.image_url" alt="Chat image" class="cw_msg_image" />
                    </div>

                    <div v-if="m.body" class="cw_msg_body">{{ m.body }}</div>

                    <div class="cw_msg_meta">
                        <span>{{ fmtTime(m.created_at) }}</span>
                        <span v-if="m.sender_id === meId">
                            <span v-if="m.seen_at">seen</span>
                            <span v-else-if="m.delivered_at">delivered</span>
                            <span v-else>sent</span>
                        </span>
                    </div>
                </div>
            </div>

            <div v-if="pastedImage" class="cw_preview_wrap">
                <div class="cw_preview_card">
                    <img :src="pastedImage.preview" alt="Pasted image" class="cw_preview_img" />
                    <button type="button" class="cw_preview_remove" @click="removePastedImage">×</button>
                </div>
            </div>

            <form class="cw_input" @submit.prevent="sendMessage">
                <button type="button" class="cw_btn_icon" @click.stop="triggerFile" title="Attach">
                    <i class="fa-solid fa-paperclip"></i>
                </button>

                <input ref="fileInput" type="file" class="cw_file" accept="image/*" @change="onFilePicked"/>

                <button type="button" class="cw_btn_icon" @click.stop="onEmoji" title="Emoji">
                    <i class="fa-regular fa-face-smile"></i>
                </button>

                <input v-model="draft" type="text" placeholder="Message…" class="cw_input_box" @paste="handlePaste"/>

                <button type="button" class="cw_btn_icon" @click.stop="onAddPeople" title="Add people">
                    <i class="fa-solid fa-user-plus"></i>
                </button>

                <button type="submit" class="cw_send" :disabled="!draft.trim() && !pastedImage?.file">Send</button>
            </form>
        </div>
    </div>
</template>

<script setup>
    import axios from 'axios'
    import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
    import { useAuthStore } from '../../stores/auth'

    const props = defineProps({
        modelValue: {
            type: Boolean,
            default: false
        },
        conversationId: {
            type: [Number, String],
            default: null
        },
        otherUser: {
            type: Object,
            default: null
        },
        minimized: {
            type: Boolean,
            default: false
        },
        windowIndex: {
            type: Number,
            default: 0
        }
    })

    const emit = defineEmits(['update:modelValue', 'minimize', 'restore'])
    const authStore = useAuthStore()
    const meId = computed(() => authStore.user?.id ?? null)
    const messages = ref([])
    const draft = ref('')
    const msgScroll = ref(null)
    const fileInput = ref(null)
    const pastedImage = ref(null)

    let pollMessagesTimer = null
    let lastMessageId = 0

    const otherUserName = computed(() => {
        const u = props.otherUser
        if (!u) return ''
        const n = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
        return n || u.name || ''
    })

    function onClose() {
        emit('update:modelValue', false)
    }

    function onMinimize() {
        emit('minimize')
    }

    function onRestore() {
        if (props.minimized) emit('restore')
    }

    function stopPolling() {
        if (pollMessagesTimer) clearInterval(pollMessagesTimer)
        pollMessagesTimer = null
    }

    async function markSeen() {
        if (!props.conversationId) return

        try {
            await axios.post(`/chat/conversations/${props.conversationId}/seen`)
        } catch (e) {}
    }

    async function fetchMessages() {
        if (!props.conversationId) return

        const url = lastMessageId
            ? `/chat/conversations/${props.conversationId}/messages?after_id=${lastMessageId}`
            : `/chat/conversations/${props.conversationId}/messages`

        const { data } = await axios.get(url)
        const arr = Array.isArray(data?.messages) ? data.messages : []

        if (arr.length) {
            messages.value = lastMessageId ? messages.value.concat(arr) : arr
            lastMessageId = messages.value[messages.value.length - 1]?.id ?? lastMessageId
            await nextTick()
            scrollToBottom()
        }
    }

    function scrollToBottom() {
        const el = msgScroll.value
        if (!el) return
        el.scrollTop = el.scrollHeight
    }

    function handlePaste(event) {
        try {
            const items = event.clipboardData?.items

            if (!items || !items.length) {
                return
            }

            for (const item of items) {
                if (!item.type.startsWith('image/')) {
                    continue
                }

                const file = item.getAsFile()

                if (!file) {
                    continue
                }

                event.preventDefault()

                if (pastedImage.value?.preview) {
                    URL.revokeObjectURL(pastedImage.value.preview)
                }

                pastedImage.value = {
                    file,
                    preview: URL.createObjectURL(file),
                    name: file.name || 'pasted-image.png'
                }

                return
            }
        } catch (e) {
            console.error('Paste image error:', e)
        }
    }

    function removePastedImage() {
        try {
            if (pastedImage.value?.preview) {
                URL.revokeObjectURL(pastedImage.value.preview)
            }

            pastedImage.value = null
        } catch (e) {
            console.error('Remove pasted image error:', e)
        }
    }

    async function sendMessage() {
        try {
            const body = draft.value.trim()

            if (!props.conversationId) return
            if (!body && !pastedImage.value?.file) return

            const formData = new FormData()
            formData.append('body', body)

            if (pastedImage.value?.file) {
                formData.append('image', pastedImage.value.file)
            }

            draft.value = ''

            await axios.post(
                `/chat/conversations/${props.conversationId}/messages`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            )

            removePastedImage()

            await fetchMessages()
            await markSeen()
        } catch (e) {
            console.error('Send message error:', e)
        }
    }

    function startPolling() {
        stopPolling()

        pollMessagesTimer = setInterval(async () => {
            try {
                await fetchMessages()
            } catch (e) {}
        }, 2000)
    }

    function onAddPeople() {
        alert('Add people: TODO')
    }

    function triggerFile() {
        fileInput.value?.click()
    }

    function onFilePicked(e) {
        try {
            const f = e.target.files?.[0]

            if (!f) return

            if (!f.type?.startsWith('image/')) {
                alert('Only images are allowed for now.')
                e.target.value = ''
                return
            }

            if (pastedImage.value?.preview) {
                URL.revokeObjectURL(pastedImage.value.preview)
            }

            pastedImage.value = {
                file: f,
                preview: URL.createObjectURL(f),
                name: f.name
            }

            e.target.value = ''
        } catch (err) {
            console.error('File pick error:', err)
            e.target.value = ''
        }
    }

    function onEmoji() {
        alert('Emoji: TODO')
    }

    function fmtTime(v) {
        try {
            return new Date(v).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (e) {
            return ''
        }
    }

    watch(
        () => [props.modelValue, props.conversationId],
        async ([open, cid]) => {
            stopPolling()
            messages.value = []
            draft.value = ''
            removePastedImage()
            lastMessageId = 0

            if (!open || !cid) return

            await fetchMessages()
            await markSeen()
            startPolling()
        },
        {
            immediate: true
        }
    )

    onBeforeUnmount(() => {
        stopPolling()
        removePastedImage()
    })
</script>

<style scoped>
    .cw_root {
        position: fixed;
        right: 20%;
        bottom: 18px;
        width: 400px;
        height: 520px;
        background: #fff;
        border: 1px solid #e7e7e7;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,.12);
        display: flex;
        flex-direction: column;
        z-index: 9996;
        overflow: hidden;
    }

    .cw_root_1 {
        right: 42%;
    }

    :global(body.chat-drawer-open) .cw_root {
        right: calc(18px + 360px + 14px);
    }

    .cw_root.minimized {
        height: 52px;
    }

    .cw_header {
        height: 52px;
        display:flex;
        align-items:center;
        justify-content: space-between;
        padding: 0 12px;
        border-bottom: 1px solid #eee;
        background: #fff;
    }

    .cw_title {
        font-weight: 700;
        cursor: pointer;
        user-select: none;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 260px;
    }

    .cw_actions {
        display:flex;
        gap: 8px;
    }

    .cw_icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid #ddd;
        background: #fff;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
    }

    .cw_body {
        flex:1;
        display:flex;
        flex-direction: column;
        min-height: 0;
    }

    .cw_toolbtn {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        border: 1px solid #ddd;
        background: #fff;
        cursor:pointer;
    }

    .cw_file {
        display:none;
    }

    .cw_btn_icon {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        border: 1px solid #ddd;
        background: #fff;
        cursor: pointer;
        display:flex;
        align-items:center;
        justify-content:center;
    }

    .cw_btn_icon:hover {
        background:#f6f6f6;
    }

    .cw_messages {
        flex:1;
        overflow:auto;
        padding: 12px;
        display:flex;
        flex-direction: column;
        gap: 8px;
    }

    .cw_msg {
        max-width: 85%;
        padding: 10px 12px;
        border-radius: 12px;
        background: #f1f1f1;
        align-self: flex-start;
    }

    .cw_msg.mine {
        background: #dfe7ff;
        align-self: flex-end;
    }

    .cw_msg_body {
        white-space: pre-wrap;
        word-break: break-word;
    }

    .cw_msg_image_wrap {
        margin-bottom: 8px;
    }

    .cw_msg_image {
        display: block;
        max-width: 220px;
        max-height: 240px;
        border-radius: 10px;
    }

    .cw_msg_meta {
        display:flex;
        gap: 8px;
        justify-content: flex-end;
        font-size: 11px;
        opacity:.7;
        margin-top: 4px;
    }

    .cw_preview_wrap {
        padding: 10px 12px 0 12px;
        border-top: 1px solid #eee;
    }

    .cw_preview_card {
        position: relative;
        display: inline-block;
        max-width: 180px;
        border: 1px solid #ddd;
        border-radius: 12px;
        overflow: hidden;
        background: #fff;
    }

    .cw_preview_img {
        display: block;
        max-width: 100%;
        max-height: 160px;
        object-fit: cover;
    }

    .cw_preview_remove {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 24px;
        height: 24px;
        border: 0;
        border-radius: 50%;
        background: rgba(0,0,0,.65);
        color: #fff;
        cursor: pointer;
        line-height: 1;
    }

    .cw_input {
        display:flex;
        gap: 8px;
        padding: 10px 12px;
        border-top: 1px solid #eee;
        flex-direction: row;
    }

    .cw_input_box {
        flex:1;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 10px;
    }

    .cw_send {
        padding: 10px 12px;
        border: 0;
        border-radius: 10px;
        background: #2b4cff;
        color: #fff;
        cursor:pointer;
    }

    .cw_send:disabled {
        opacity:.5;
        cursor:not-allowed;
    }
</style>