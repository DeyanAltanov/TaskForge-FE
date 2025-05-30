import { reactive } from 'vue'

const popup = reactive({
    text: '',
    type: 'success',
})

let timeout = null

function show(text, type = 'success', duration = 2000) {
    popup.text = text
    popup.type = type

    if (timeout) clearTimeout(timeout)

    setTimeout(() => {
        popup.text = ''
        timeout = null
    }, duration)
}

export function usePopup() {
    return { popup, show }
}