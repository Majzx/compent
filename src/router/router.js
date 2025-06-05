// src/router/index.js
import Vue from 'vue'
import VueRouter from 'vue-router'
import AIChat from '../components/Cheat.vue'

Vue.use(VueRouter)

const routes = [
    {
        path: '/chat',
        name: 'AIChat',
        component: AIChat
    }
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

export default router