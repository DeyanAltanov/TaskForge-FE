import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        checked: false,
    }),
    actions: {
        async fetchUser() {
            try {
                const response = await axios.get('/user')
                this.user = response.data
                localStorage.setItem('user', JSON.stringify(this.user))
            } catch (error) {
                this.user = null
                localStorage.removeItem('user')
            } finally {
                this.checked = true
            }
        },
        setUser(user) {
            this.user = user
            localStorage.setItem('user', JSON.stringify(user))
        },
        clearUser() {
            this.user = null
            localStorage.removeItem('user')
        }
    },
})