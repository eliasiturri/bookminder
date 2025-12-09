import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL : 'https://bookminder.io';

const API_URL = BASE_URL + '/plugins';

export const useGutenbergSearchStore = defineStore('searchGutenberg', {
    state: () => ({
        
    }),
    actions: {
        async search(query, page) {
            let result = await axios.post(`${API_URL}/action`, {

                publicUuid: 'd1393b2e-5985-4c4b-958a-d001c6665115',
                payload: {
                    url: '/search',
                    params: {
                        title: query.title,
                        author: query.author,
                        subject: query.subject,
                        language: query.language,
                        page: page
                    }                    
                }
            });
            console.log("pinia axios search result: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                return result.data;
            }
        },     
        async fetch_book_info(plugin, id) {
            let result = await axios.get(`${API_URL}/fetch_book_info`, {
                params: {
                    plugin: plugin,
                    bookId: id
                }
            });
            console.log("pinia axios fetch result: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                return result.data;
            }
        },    
        async download_book(plugin, id, path) {
            let result = await axios.get(`${API_URL}/download_book`, {
                params: {
                    plugin: plugin,
                    bookId: id,
                    destPath: path
                }
            });
            console.log("pinia axios download book: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                return result.data;
            }
        },                     
    },
    getters: {
        
    }
    
    
})