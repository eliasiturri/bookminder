import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://bookminder.io';

const API_URL = BASE_URL + '';
//const API_URL = 'http://localhost:3000';

export const useSearchStore = defineStore('search', {
    state: () => ({
        
    }),
    actions: {
        async search(plugin, query) {
            let result = await axios.get(`${API_URL}/search`, {
                params: {
                    plugin: plugin,
                    params: params
                }
            });
            console.log("pinia axios search result: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                return result.data;
            }
        },     
        async fetch_book_info(plugin, idx) {
            let result = await axios.get(`${API_URL}/fetch_book_info`, {
                params: {
                    plugin: plugin,
                    idx: idx
                }
            });
            console.log("pinia axios fetch result: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                return result.data;
            }
        },             
    },
    getters: {
        
    },
    persist: true
    
    
})