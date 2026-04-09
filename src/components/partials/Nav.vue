<template>
    <nav id="nav">
        <router-link :to="authStore.user ? '/dashboard' : '/'">
            <img id='nav-logo' src="/nav.png" />
        </router-link>
        <div id="nav-menu">
            <router-link to="" class="nav-link">Statistics</router-link>
            <router-link to="" class="nav-link">FAQ</router-link>
        </div>

        <div v-if="authStore.user" class="nav-icons-container nav-right flex items-center gap-3">
            <button type="button" class="nav_chat_btn" @click="showChat = true">
                <i class="fa-solid fa-comments"></i>
                <span v-if="chatHasUnread" class="nav_chat_dot"></span>
            </button>
            <div class="relative" ref="dropdownWrapper">
                <button @click="toggleDropdown" id='nav_profile_img_btn' class="flex items-center gap-2 focus:outline-none">
                    <img v-show="authStore.user.profile_picture" :src="authStore.user.profile_picture" id="nav_profile_img" class="h-10 w-10 rounded-full object-cover" />
                </button>

                <div v-if="dropdownOpen" id="nav_dropdown" class="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-10">
                    <router-link to="/profile" class="nav_dropdown_submenu block px-4 py-2 hover:bg-gray-100">Profile</router-link>
                    <div @click="toggleTasks" class="nav_dropdown_submenu block px-4 py-2 hover:bg-gray-100" style="cursor: pointer;">
                        <span>{{ showTasks ? '&#9661;' : '▸' }}</span> Tasks
                    </div>
                        <div id="nav_toggle_tasks" style="z-index: 999;" v-if="showTasks">
                            <router-link to="/create_task" class="nav_dropdown_submenu_sub block px-6 py-2 hover:bg-gray-100"> - Create Task</router-link>
                            <router-link to="/my_tasks" class="nav_dropdown_submenu_sub block px-6 py-2 hover:bg-gray-100"> - My Tasks</router-link>
                            <router-link to="/all_tasks" class="nav_dropdown_submenu_sub block px-6 py-2 hover:bg-gray-100"> - All Tasks</router-link>
                        </div>
                        <div @click="toggleTeams" class="nav_dropdown_submenu block px-4 py-2 hover:bg-gray-100" style="cursor: pointer;">
                            <span>{{ showTeams ? '▾' : '▸' }}</span> Teams
                        </div>
                        <div id="nav_toggle_teams" v-if="showTeams">
                            <router-link to="/create_team" class="nav_dropdown_submenu_sub block px-6 py-2 hover:bg-gray-100"> - Create Team</router-link>
                            <router-link to="/all_teams" class="nav_dropdown_submenu_sub block px-6 py-2 hover:bg-gray-100"> - All Teams</router-link>
                            <router-link to="/my_teams" class="nav_dropdown_submenu_sub block px-6 py-2 hover:bg-gray-100"> - My Teams</router-link>
                        </div>
                    <router-link to="" @click.prevent="logout" class="nav_dropdown_submenu block px-4 py-2 hover:bg-gray-100">Logout</router-link>
                </div>
            </div>
        </div>

        <div class="nav-links" v-else>
            <router-link to="/login" class="nav-link">Login</router-link>
            <router-link to="/register" class="nav-link">Register</router-link>
        </div>

        <ChatDrawer
            v-model="showChat"
            @unread="chatHasUnread = $event"
            @open-thread="emit('open-thread', $event)"
        />
    </nav>
</template>

<script setup>
    import axios from 'axios'
    import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
    import { useAuthStore } from '../../stores/auth'
    import { useRouter } from 'vue-router'
    import ChatDrawer from './ChatDrawer.vue'

    const showChat = ref(false)
    const chatHasUnread = ref(false)
    const emit = defineEmits(['open-thread'])

    const authStore = useAuthStore()
    const router = useRouter()

    const dropdownOpen = ref(false)
    const dropdownWrapper = ref(null)
    const showTasks = ref(false)
    const showTeams = ref(false)

    watch(() => authStore.user, () => {
        dropdownOpen.value = false
    })

    const toggleDropdown = () => {
        dropdownOpen.value = !dropdownOpen.value
    }

    const handleClickOutside = (event) => {
        if (dropdownWrapper.value && !dropdownWrapper.value.contains(event.target)) {
            dropdownOpen.value = false
            showTasks.value = false
            showTeams.value = false
        }
    }

    function toggleTasks() {
        showTasks.value = !showTasks.value
    }

    function toggleTeams() {
        showTeams.value = !showTeams.value
    }

    onMounted(() => {
        document.addEventListener('click', handleClickOutside)
    })

    onBeforeUnmount(() => {
        document.removeEventListener('click', handleClickOutside)
    })

    const logout = async () => {
        try {
            await axios.post('/logout')
        } catch (error) {
            console.error('Logout failed: ', error)
        } finally {
            authStore.clearUser()
            router.push({ name: 'welcome' })
        }
    }
</script>
<style>
    .nav_chat_btn {
        position: relative;
        width: 42px;
        height: 42px;
        border-radius: 9999px;
        border: 1px solid #e5e7eb;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 42px;
        cursor: pointer;
    }

    .nav_chat_btn i { 
        font-size: 18px;
        color: #211c84;
    }

    .nav_chat_dot {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 10px;
        height: 10px;
        border-radius: 9999px;
        background: #e11;
    }

    .nav-icons-container {
        display: flex;
        align-items: center;
        gap: 20px;
    }
</style>