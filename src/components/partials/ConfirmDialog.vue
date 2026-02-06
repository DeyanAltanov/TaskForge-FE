<template>
    <teleport to="body">
      <div v-if="modelValue" class="modal_overlay" @click.self="onCancel" role="dialog" aria-modal="true">
        <div class="modal_card">
          <h3 class="modal_title">{{ title }}</h3>
          <p class="modal_msg" v-if="message">{{ message }}</p>

          <div class="modal_actions">
            <button type="button" class="button" @click="onCancel">{{ cancelText }}</button>
            <button type="button" class="button primary" :class="{ danger }" @click="onOk">{{ okText }}</button>
          </div>
        </div>
      </div>
    </teleport>
  </template>
  
  <script setup>
  import { onMounted, onBeforeUnmount } from 'vue'

    const props = defineProps({
        modelValue: { type: Boolean, default: false },
        title:      { type: String,  default: 'Are you sure?' },
        message:    { type: String,  default: '' },
        okText:     { type: String,  default: 'OK' },
        cancelText: { type: String,  default: 'Cancel' },
        danger:     { type: Boolean, default: false },
    })

    const emit = defineEmits(['update:modelValue', 'ok', 'cancel'])

    function onOk() { 
        emit('ok');     
        emit('update:modelValue', false); 
    }

    function onCancel() { 
        emit('cancel'); 
        emit('update:modelValue', false);
    }

    function onEsc(e) { 
        if (e.key === 'Escape' && props.modelValue) onCancel() 
    }

    onMounted(() => window.addEventListener('keydown', onEsc))
    onBeforeUnmount(() => window.removeEventListener('keydown', onEsc))
  </script>