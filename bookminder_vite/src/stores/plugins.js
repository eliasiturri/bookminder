import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL : 'https://bookminder.io';

const API_URL = BASE_URL + '/plugins';

export const usePluginsStore = defineStore('plugins', {
    state: () => ({
        registeredPlugins: [],
        pluginLocations: {
            requestActions: ['e71581bb-6fc7-472e-896a-d974bc9b3c04'],
        },
        repositories: [],
        allData: {
            repositories: [],
        },
    }),
    actions: {
        async getRegisteredPlugins() {
            console.log("API URL: ", API_URL);
            let result = await axios.get(`${API_URL}/all`);
            console.log("pinia axios getRegisterdPlugins result: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                this.registeredPlugins = result.data;
            }
        },
        async getRepositories() {
            let result = await axios.get(`${API_URL}/repositories`);
            console.log("pinia axios getRepositories result: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                this.repositories = result.data.repositories;
            }
        },
        async getAllData() {
            let result = await axios.get(`${API_URL}/allData`);
            console.log("pinia axios getAllData result: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                //this.allData = result.data;
                this.allData.repositories = result.data.repositories;
            }
        },
        async getSettings(publicUuid) {
            let result = await axios.get(`${API_URL}/settings`, {
                params: {
                    publicUuid: publicUuid
                }
            });
            console.log("pinia axios getSettings result: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                return result.data;
            }
        },
        async setSettings(pluginPublicUuid, settings) {
            let result = await axios.post(`${API_URL}/settings`, {
                publicUuid: publicUuid,
                settings: settings
            });
            console.log("pinia axios setSettings result: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                return result.data;
            }
        }
    },
    getters: {
        
    },
    persist: true
    
    
})