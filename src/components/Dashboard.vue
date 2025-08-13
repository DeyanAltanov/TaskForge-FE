<template>
    <main>
        <div>
            <h1 class="page_title">Dashboard</h1>
        </div>
    </main>
</template>
<script>
    import { onMounted } from 'vue'
    import axios from 'axios'

    onMounted(async () => {
        try {
            await axios.get('/dashboard')
        } catch (error) {
            console.error('Failed to load dashboard data: ', error)
        }
    })
</script>