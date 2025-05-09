<template>
    <div>
        <h1 class="page_title">My Profile</h1>
    </div>
    <section id="profile_card">
        <div id ="profile_structure">
            <img v-show="authStore.user.profile_picture" :src="authStore.user.profile_picture" id="profile_card_img" />
            <div id="profile_card_user_details">
                <p id="profile_name" class="label">{{ authStore.user.first_name }} {{ authStore.user.last_name }}</p>
                <div id="profile_card_pge">
                    <p class="info">
                        <span class="label">Email:&nbsp;&nbsp;</span>{{ authStore.user.email }}
                    </p>
                    <p class="info">
                        <span class="label">Phone:&nbsp;&nbsp;</span>{{ authStore.user.phone }}
                    </p>
                    <p class="info">
                        <span class="label">Gender:&nbsp;&nbsp;</span>{{ authStore.user.gender }}
                    </p>
                </div>
            </div>
        </div>
        <div id="profile_card_buttons">
            <button @click="" class="button block w-full text-left px-4 py-2 hover:bg-gray-100">Edit Profile</button>
        </div>
    </section>
</template>
<script setup>
    import { useAuthStore } from '../../stores/auth'

    const authStore = useAuthStore()
</script>