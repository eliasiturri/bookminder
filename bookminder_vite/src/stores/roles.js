import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL : 'https://bookminder.io';

const API_URL = BASE_URL + '/roles';

import { toastTTS } from '@/utils/tts';

export const useRolesStore = defineStore('roles', {
    state: () => ({
        
    }),
    actions: {

        async getRoleNames() {
            let result = await axios.get(`${API_URL}/names`, 
                { withCredentials: true }
            );
            console.log("pinia axios login result: ", result);
            if (result.status === 200) {
                if (result.data.message) { toastTTS('info', result.data.message); }
                return result.data;
            }
        },
        async getUserRole(username) {
            console.log("username: ", username);
            let result = await axios.get(`${API_URL}/user-role`, 
                {
                    params: { username },
                    withCredentials: true
                }
            );
            console.log("pinia axios login result: ", result);
            if (result.status === 200) {
                if (result.data.message) { toastTTS('info', result.data.message); }
                return result.data;
            }
        },
        async getRoles() {
            let result = await axios.get(`${API_URL}/`, 
                { withCredentials: true }
            ).then((response) => {
                if (response.message) { toastTTS('info', response.message); }
                return response;
            }).catch((error) => {
                toastTTS('error', error.response.data.error);
                return error.response;
            });



            console.log("pinia axios login result: ", result);
            if (result.status === 200) {
                return result.data;
            }
        },
        async saveRoles(newRoles, editedRoles, deletedRoles) {
            let result = await axios.post(`${API_URL}/`, 
                {
                    newRoles: newRoles,
                    editedRoles: editedRoles,
                    deletedRoles: deletedRoles
                },
                {withCredentials: true}
            );
            console.log("pinia axios login result: ", result);
            if (result.status === 200) {
                if (result.data.message) { toastTTS('info', result.data.message); }
                return result.data;
            }
        },
        async saveDefaultRole(username, roleName) {
            let result = await axios.post(`${API_URL}/default`, 
                {
                    username: username,
                    roleName: roleName
                },
                {withCredentials: true}
            );
            console.log("pinia axios login result: ", result);
            if (result.status === 200) {
                if (result.data.message) { toastTTS('info', result.data.message); }
                return result.data;
            }
        }

    },
    getters: {

    },
    persist: true
    
    
})