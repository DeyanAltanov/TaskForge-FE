<template>
  <div v-if="authStore.checked" class="layout">
    <Nav @open-thread="openThread" />

    <main class="content">
      <router-view />
    </main>

    <div v-if="hiddenChatWindows.length" class="chat_bubbles_stack">
      <div v-for="win in hiddenChatWindows" :key="win.id" class="chat_bubble_wrap">
        <button type="button" class="chat_bubble_btn" @click="restoreChatWindow(win.id)">
          <img
            v-if="win.otherUser?.profile_picture"
            :src="win.otherUser.profile_picture"
            class="chat_bubble_avatar"
            alt=""
          >
          <div v-else class="chat_bubble_fallback">
            {{ getInitials(win.otherUser) }}
          </div>
        </button>

        <div class="chat_bubble_tooltip">
          {{ win.otherUser?.first_name }} {{ win.otherUser?.last_name }}
        </div>

        <button type="button" class="chat_bubble_close" @click.stop="closeChatWindow(win.id)">×</button>
      </div>
    </div>

    <ChatWindow
      v-for="(win, index) in visibleChatWindows"
      :key="win.id"
      :model-value="true"
      :conversation-id="win.conversationId"
      :other-user="win.otherUser"
      :minimized="win.minimized"
      :window-index="index"
      @update:modelValue="val => { if (!val) closeChatWindow(win.id) }"
      @minimize="minimizeChatWindow(win.id)"
      @restore="restoreChatWindow(win.id)"
    />

    <Footer />
  </div>

  <Popup v-if="popup.text" :text="popup.text" :type="popup.type" />
</template>

<script setup>
  import { onMounted, ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from './stores/auth'
  import { usePopup } from './stores/popup'
  import Nav from './components/partials/Nav.vue'
  import Popup from './components/partials/Popup.vue'
  import Footer from './components/partials/Footer.vue'
  import ChatWindow from './components/partials/ChatWindow.vue'

  const authStore = useAuthStore()
  const router = useRouter()
  const { popup } = usePopup()

  const chatWindows = ref([])
  let chatWindowSeq = 0

  const visibleChatWindows = computed(() => {
    return chatWindows.value.slice(-2)
  })

  const hiddenChatWindows = computed(() => {
    return chatWindows.value.slice(0, -2)
  })

  function openThread(payload) {
    if (!payload?.conversation_id) return

    const existingIndex = chatWindows.value.findIndex(
      w => String(w.conversationId) === String(payload.conversation_id)
    )

    if (existingIndex !== -1) {
      const existing = chatWindows.value[existingIndex]
      existing.otherUser = payload.other_user ?? existing.otherUser
      existing.minimized = false

      chatWindows.value.splice(existingIndex, 1)
      chatWindows.value.push(existing)
      return
    }

    chatWindows.value.push({
      id: ++chatWindowSeq,
      conversationId: payload.conversation_id,
      otherUser: payload.other_user ?? null,
      minimized: false
    })
  }

  function closeChatWindow(id) {
    chatWindows.value = chatWindows.value.filter(w => w.id !== id)
  }

  function minimizeChatWindow(id) {
    const win = chatWindows.value.find(w => w.id === id)
    if (!win) return
    win.minimized = true
  }

  function restoreChatWindow(id) {
    const index = chatWindows.value.findIndex(w => w.id === id)
    if (index === -1) return

    const win = chatWindows.value[index]
    win.minimized = false

    chatWindows.value.splice(index, 1)
    chatWindows.value.push(win)
  }

  function getInitials(user) {
    if (!user) return '?'

    const first = user.first_name?.[0] ?? ''
    const last = user.last_name?.[0] ?? ''

    const val = `${first}${last}`.trim()
    return val || '?'
  }

  onMounted(() => {
    window.addEventListener('navigate', (event) => {
      router.push(event.detail)
    })
  })
</script>

<style scoped>
  .chat_bubbles_stack {
    position: fixed;
    right: 16%;
    bottom: 24px;
    display: flex;
    flex-direction: column-reverse;
    gap: 10px;
    z-index: 9997;
  }

  .chat_bubble_wrap {
    position: relative;
    width: 56px;
    height: 56px;
  }

  .chat_bubble_btn {
    width: 56px;
    height: 56px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    padding: 0;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0, 0, 0, .18);
    overflow: hidden;
  }

  .chat_bubble_avatar,
  .chat_bubble_fallback {
    width: 56px;
    height: 56px;
    border-radius: 50%;
  }

  .chat_bubble_avatar {
    object-fit: cover;
    display: block;
  }

  .chat_bubble_fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2b2b2b;
    color: #fff;
    font-weight: 700;
  }

  .chat_bubble_close {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 20px;
    height: 20px;
    border: 0;
    border-radius: 50%;
    background: #222;
    color: #fff;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .chat_bubble_tooltip {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: #222;
    color: #fff;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 12px;
    line-height: 1.2;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity .18s ease;
    z-index: 9999;
  }

  .chat_bubble_wrap:hover .chat_bubble_tooltip {
    opacity: 1;
  }
</style>