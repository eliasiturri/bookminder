import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL : 'https://bookminder.io';

const API_URL = BASE_URL + '/plugins';

export const useCalibreStore = defineStore('calibreStore', {
    state: () => ({
        outputFormats: [
            {
                name: 'MOBI',
                value: 'mobi'
            },
            {
                name: 'EPUB',
                value: 'epub'
            },
            {
                name: 'PDF',
                value: 'pdf'
            },
            {
                name: 'AZW3',
                value: 'azw3'
            },
            {
                name: 'DOCX',
                value: 'docx'
            },
            {
                name: 'TXT',
                value: 'txt'
            }
        ],

    }),
    actions: {         
        async convert(input_file, output_format, bookId, libraryId) {
            try {
                let result = await axios.post(`${API_URL}/action`, {
                    publicUuid: "985f95c0-fe2d-4213-8240-6b3799569cca",
                    payload: {
                        input_file: input_file,
                        output_format: output_format,
                        book_id: bookId,
                        library_id: libraryId,
                        url: "/convert",
                    }
                }, {
                    withCredentials: true
                });
                console.log("pinia axios send result: ", result);
                if (result.status === 200) {
                    console.log("result.data: ", result.data);
                    return result.data;
                }
                return { error: 'Conversion request failed' };
            } catch (error) {
                console.error("Conversion error:", error);
                return { error: error.response?.data?.error || 'Conversion request failed' };
            }
        }
    },
    getters: {
        
    }
    
    
})