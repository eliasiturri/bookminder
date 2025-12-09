import { defineStore } from 'pinia'

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL : 'https://bookminder.io';
const API_URL = BASE_URL + '/auth';


export const useAuthStore = defineStore('auth', {
    state: () => ({
        username: '',
        role: 'admin',
        role_actions: [],
        roles: [],
        avatar: null,
    }),
    actions: {
        async login(username, password) {
            try {
                let result = await axios.post(`${API_URL}/login`, {
                        username: username,
                        password: password
                    },
                    {withCredentials: true}
                );
                if (result.status === 200) {
                    this.username = username;
                    this.role_actions = result.data.role_actions;
                    this.roles = result.data.roles;
                    return true;
                }
                return false;
            } catch (error) {
                // Handle 401 or other errors
                return false;
            }
        },
        async reloadRoles() {
            let result = await axios.post(`${API_URL}/reload-roles`, {
                },
                {withCredentials: true}
            );
            if (result.status === 200) {
                this.role_actions = JSON.parse(result.data.role_actions);
                this.roles = JSON.parse(result.data.roles);
                return true;
            }
            return false;
        },
        async changePassword(password) {
            try {
                let result = await axios.post(`${API_URL}/change-password`, {
                        password: password
                    },
                    {withCredentials: true}
                );
                if (result.status === 200) {
                    return { success: true, message: result.data.message };
                }
                return { success: false, error: result.data.error };
            } catch (error) {
                return { success: false, error: error.response?.data?.error || 'Error changing password' };
            }
        },
        async uploadAvatar(avatarBase64) {
            try {
                let result = await axios.post(`${API_URL}/upload-avatar`, {
                        avatarBase64: avatarBase64
                    },
                    {withCredentials: true}
                );
                if (result.status === 200) {
                    this.avatar = result.data.avatar;
                    return { success: true, message: result.data.message };
                }
                return { success: false, error: result.data.error };
            } catch (error) {
                // Check for payload too large error
                if (error.response?.status === 413) {
                    return { success: false, error: 'Image is too large. Please use a smaller image (max 10MB).' };
                }
                return { success: false, error: error.response?.data?.error || 'Error uploading avatar' };
            }
        },
        async getAvatar() {
            try {
                let result = await axios.get(`${API_URL}/avatar`, {withCredentials: true});
                if (result.status === 200 && result.data.avatar) {
                    this.avatar = result.data.avatar;
                    return result.data.avatar;
                }
                return null;
            } catch (error) {
                console.log("Error getting avatar:", error);
                return null;
            }
        },
        async logout() {
            let result = await axios.get(`${API_URL}/logout`, {withCredentials: true});
            if (result.status === 200) {
                // Clear user-specific state
                this.username = '';
                this.role_actions = [];
                this.roles = [];
                this.avatar = null;
                
                for (let cookieName of ['token', 'connect.sid']) {
                    let cookie = this.getCookie(cookieName);
                    console.log("cookie is", cookie);
                    if (cookie) { this.deleteCookie(cookieName); }
                }
            }
        },
        getCookie(name) {
            const cookies = document.cookie.split(';');
            console.log(cookies)
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + '=')) {
                    return cookie.substring(name.length + 1);
                }
            }
            return null;
        },
        deleteCookie(name) {
            const domain = location.hostname;
            const path = '/';
            console.log("deleting cookie", name, domain);
            document.cookie = `${name}=; Max-Age=0; path=${path}; domain=${domain};`;
            document.cookie = `${name}=; Max-Age=0; path=${path};`; // try without domain
        }
    },
    getters: {

    },
    persist: true
})