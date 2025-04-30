<template>
    <div>
        <h1>Dashboard</h1>
    </div>
</template>
<script>
    import { onMounted } from 'vue'
    import axios from 'axios'

    onMounted(async () => {
        try {
            const response = await axios.get('/dashboard')
        } catch (error) {
            console.error('Failed to load dashboard data:', error)
        }
    })
</script>