import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL : 'https://bookminder.io';

const API_URL = BASE_URL + '/requests';
//const API_URL = 'http://localhost:3000/requests';

export const useRequestsStore = defineStore('requests', {
    state: () => ({
        destinationFolders: [],
        namingPatterns: [],
        requestsPage: []
    }),
    actions: {
        async getDestinationFolders() {
            let result = await axios.get(`${API_URL}/destinationFolders`);
            console.log("pinia axios getDestinationFolders result: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                this.destinationFolders = result.data.destinationFolders;
            }
        },       
        async getNamingPatterns() {
            let result = await axios.get(`${API_URL}/namingPatterns`);
            console.log("pinia axios getNamingPatters result: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                this.namingPatterns = result.data.namingPatterns;
            }
        },     
        async saveRequest(plugin, source, filename, operations, coverUrl, title) {
            let result = await axios.post(`${API_URL}/saveRequest`, {
                plugin: plugin,
                source: source,
                filename: filename,
                operations: operations,
                coverUrl: coverUrl,
                title: title
            });
            console.log("pinia axios saveRequest result: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
            }
        },
        async getRequests(display, page) {
            let result = await axios.get(`${API_URL}/all`, {
                params: {
                    display: display,
                    page: page
                }
            });
            console.log("pinia axios getRequests result: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                this.requestsPage = result.data.requests;
            }
        },
    },
    getters: {
        
    },
    persist: true
    
    
})