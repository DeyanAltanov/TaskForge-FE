<template>
    <nav id="nav">
        <router-link :to="authStore.user ? '/dashboard' : '/'">
            <img id='nav-logo' src="/nav.png" />
        </router-link>

        <div v-if="authStore.user" class="relative" ref="dropdownWrapper">
            <button @click="toggleDropdown" id='nav_profile_img_btn' class="flex items-center gap-2 focus:outline-none">
                <img v-show="authStore.user.profile_picture" :src="authStore.user.profile_picture" id="nav_profile_img" class="h-10 w-10 rounded-full object-cover" />
            </button>

            <div v-if="dropdownOpen" id="nav_dropdown" class="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-10">
                <router-link to="/profile" class="nav_dropdown_submenu block px-4 py-2 hover:bg-gray-100">Profile</router-link>
                <div @click="toggleTasks" class="nav_dropdown_submenu block px-4 py-2 hover:bg-gray-100" style="cursor: pointer;">
                    <span v-html="showTasks ? '&#9661;' : '&#9654;'"></span> Tasks
                </div>
                    <div id="nav_toggle_tasks" v-if="showTasks">
                        <router-link to="/create_task" class="nav_dropdown_submenu_sub block px-6 py-2 hover:bg-gray-100"> - Create Task</router-link>
                        <router-link to="" class="nav_dropdown_submenu_sub block px-6 py-2 hover:bg-gray-100"> - My Tasks</router-link>
                        <router-link to="/all_tasks" class="nav_dropdown_submenu_sub block px-6 py-2 hover:bg-gray-100"> - All Tasks</router-link>
                    </div>
                    <div @click="toggleTeams" class="nav_dropdown_submenu block px-4 py-2 hover:bg-gray-100" style="cursor: pointer;">
                        <span v-html="showTeams ? '&#9661;' : '&#9654;'"></span> Teams
                    </div>
                    <div id="nav_toggle_teams" v-if="showTeams">
                        <router-link to="/create_team" class="nav_dropdown_submenu_sub block px-6 py-2 hover:bg-gray-100"> - Create Team</router-link>
                        <router-link to="/all_teams" class="nav_dropdown_submenu_sub block px-6 py-2 hover:bg-gray-100"> - All Teams</router-link>
                        <router-link to="" class="nav_dropdown_submenu_sub block px-6 py-2 hover:bg-gray-100"> - My Teams</router-link>
                    </div>
                <router-link to="" @click.prevent="logout" class="nav_dropdown_submenu block px-4 py-2 hover:bg-gray-100">Logout</router-link>
            </div>
        </div>

        <div class="nav-links" v-else>
            <router-link to="/login" class="nav-link">Login</router-link>
            <router-link to="/register" class="nav-link">Register</router-link>
        </div>
    </nav>
</template>

<script setup>
    import axios from 'axios'
    import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
    import { useAuthStore } from '../../stores/auth'
    import { useRouter } from 'vue-router'

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
            console.error('Logout failed:', error)
        } finally {
            authStore.clearUser()
            router.push({ name: 'welcome' })
        }
    }
</script>