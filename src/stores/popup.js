import { reactive } from 'vue'

const popup = reactive({
    text: '',
    type: 'success',
})

function show(text, type = 'success') {
    popup.text = text
    popup.type = type
}

export function usePopup() {
    return { popup, show }
}