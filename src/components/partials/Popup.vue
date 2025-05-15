<template>
    <transition name="fade">
        <div v-if="visible" :class="['popup', typeClass]">
            {{ text }}
        </div>
    </transition>
</template>

<script setup>
    import { ref, computed, watch } from 'vue'

    const props = defineProps({
        text: String,
        type: { type: String, default: 'success' }
    })

    const visible = ref(true)

    watch(() => props.text, () => {
        visible.value = true
        setTimeout(() => (visible.value = false), 3000)
    })

    const typeClass = computed(() => {
        return props.type === 'error' ? 'bg-red-600' : 'bg-green-600'
    })
</script>