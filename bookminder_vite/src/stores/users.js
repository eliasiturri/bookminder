import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL : 'https://bookminder.io';

const API_URL = BASE_URL + '/users';
const TOKEN_URL = BASE_URL + '/token';

import { toast } from 'vue3-toastify';

import { useSettingsStore } from './settings';

import { toastTTS } from '@/utils/tts';

export const useUsersStore = defineStore('users', {

    state: () => ({
        globalLibraries: [],
        settings: {},
        autoClose: useSettingsStore().errorAccessibility.closeToastAfter,
    }),
    actions: {

        async fetchSettings() {
            let result = await axios.get(`${API_URL}/settings`, { withCredentials: true });
            if (result.status === 200) {
                this.settings = result.data;
            }
        },

        async reloadSession(username) {
            let result = await axios.post(`${API_URL}/reload-session`, {
                username,
            }, { withCredentials: true }).then((response) => {
                if (response.data && response.data.message) { 
                    return response.data; 
                }
                return response.data;
            }).catch((error) => {
                toastTTS('error', error.response?.data?.error || 'Error reloading session');
                return error.response?.data;
            });
            return result;
        },

        async getUsers() {
            let result = await axios.get(`${API_URL}/`, { withCredentials: true });
            if (result.status === 200) {
                return result.data;
            }
        },
        async createUser(username) {

            let result = await axios.post(`${API_URL}/`, {
                username,
            }, { withCredentials: true }).then((response) => {
                return response;
            }).catch((error) => {
                toastTTS('error', error.response.data.error);
                return error.response;
            });
            return result.data;
        },
        async createUserFromToken(token, password) {

            let result = await axios.post(`${TOKEN_URL}/from-token`, {
                token,
                password,
            }, { withCredentials: true }).then((response) => {
                return response;
            }).catch((error) => {
                toastTTS('error', error.response.data.error);
                return error.response;
            });
            return result.data;
        },        
        async getUserAccessUrl(username) {
            let result = await axios.post(`${API_URL}/access-url`, {
                username,
            }, { withCredentials: true }).then((response) => {
                return response;
            }).catch((error) => {
                toastTTS('error', error.response.data.error);

                return error.response;
            });
            return result.data;
        },
        async verifyUserAccessToken(access_token) {
            let result = await axios.post(`${TOKEN_URL}/verify-access-token`, {
                token: access_token,
            }, { withCredentials: true }).then((response) => {
                return response;
            }).catch((error) => {
                return error.response;
            });
            return result.data;
        }


    },
    getters: {

    },
    persist: true
    
    
})