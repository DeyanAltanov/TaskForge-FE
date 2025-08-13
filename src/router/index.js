import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import Welcome from '../components/Welcome.vue'
import Login from '../components/Login.vue'
import Register from '../components/Register.vue'
import Dashboard from '../components/Dashboard.vue'
import Profile from '../components/user/Profile.vue'
import Teams from '../components/team/AllTeams.vue'
import CreateTeam from '../components/team/CreateTeam.vue'
import EditTeam from '../components/team/EditTeam.vue'
import EditTeamMembers from '../components/team/EditTeamMembers.vue'
import CreateTask from '../components/task/CreateTask.vue'
import Task from '../components/task/Task.vue'
import AllTasks from '../components/task/AllTasks.vue'
import MyTasks from '../components/task/MyTasks.vue'

const publicRoutes = [
  { path: '/', name: 'welcome', component: Welcome },
  { path: '/login', name: 'login', component: Login },
  { path: '/register', name: 'register', component: Register },
]

const privateRoutes = [
  { path: '/dashboard', name: 'dashboard', component: Dashboard },
  { path: '/profile', name: 'profile', component: Profile },
  { path: '/all_teams', name: 'all_teams', component: Teams },
  { path: '/create_team', name: 'create_team', component: CreateTeam },
  { path: '/edit_team/:id', name: 'edit_team', component: EditTeam },
  { path: '/edit_team_members/:id', name: 'edit_team_members', component: EditTeamMembers },
  { path: '/task/:id', name: 'task', component: Task },
  { path: '/create_task', name: 'create_task', component: CreateTask },
  { path: '/all_tasks', name: 'all_tasks', component: AllTasks },
  { path: '/my_tasks', name: 'my_tasks', component: MyTasks },
].map(route => ({ ...route, meta: { requiresAuth: true } }))

const routes = [...publicRoutes, ...privateRoutes]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (!authStore.checked) return false

  const isAuthenticated = !!authStore.user

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }

  if (isAuthenticated && ['login', 'register', 'welcome'].includes(to.name)) {
    return { name: 'dashboard' }
  }

  return true
})

export default router