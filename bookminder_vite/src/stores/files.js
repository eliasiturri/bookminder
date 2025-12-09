import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL : 'https://bookminder.io';
const API_URL = BASE_URL + '/files';

export const useFilesStore = defineStore('files', {
    state: () => ({

    }),
    actions: {
        async uploadFiles(libraryId, files, callback) {

            console.log("Upload request:", {
                libraryId,
                fileCount: files.length
            });

            for (let i = 0; i < files.length; i++) {

                let uuid = uuidv4();
                let file = files[i];

                const formData = new FormData();
                formData.append('files', file);
                
                let jsonParams = JSON.stringify({
                    libraryId: libraryId,
                    uuid: uuid
                });

                let response = await axios.post(API_URL + '/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'params': jsonParams
                    },
                    withCredentials: true
                });

                callback();
                
            }
            return true;
        }
    },
    getters: {

    },
    persist: true
    
    
})