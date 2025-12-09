<template>
    <div id="settings">
        <label for="username">Username</label>
        <input type="text" id="username" v-model="user.username">
        <label for="password">Password</label>
        <input type="password" id="password" v-model="user.password">
        <label for="host">SMTP Host</label>
        <input type="text" id="host" v-model="user.smtp.host">
        <label for="port">SMTP Port</label>
        <input type="text" id="port" v-model="user.smtp.port">
        <label for="secure">SMTP Secure</label>
        <input type="text" id="secure" v-model="user.smtp.secure">
    </div>
</template>

<script>

import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useSendToKindleStore } from 'e71581bb-6fc7-472e-896a-d974bc9b3c04/stores/sendToKindle'

export default {
    name: 'Settings',
    data() {
        return {
            query: 'against intellectual monopoly',
            authStore: useAuthStore(),
            sendToKindleStore: useSendToKindleStore(),
            user: {
                username: '',
                password: '',
                smtp: {
                    host: '',
                    port: '',
                    secure: '',
                }
            },
        }
    },

    
    computed: {
        ...mapState(useAuthStore, ['authStore']),
        ...mapState(useSendToKindleStore, ['destinations'])
    },
    methods: {

    },
    async mounted() {

    },    
    components: {
        
    }
    
}

</script>

<style>

</style>

<style scoped>
</style>