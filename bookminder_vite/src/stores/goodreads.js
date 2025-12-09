import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import axios from 'axios';

//const BASE_URL = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL : 'http://localhost:5015';
const BASE_URL = 'http://localhost:5015';

const API_URL = BASE_URL + '';
//const API_URL = 'http://localhost:3000/plugins';

export const useGoodreadsStore = defineStore('goodreads', {
    state: () => { return {
        recommendations: [], 
        recommendationsByCategory: {},
    }},
    actions: {
        async getRecommendations() {
            let result = await axios.get(`${API_URL}/recommendations`);
            console.log("pinia axios getRegisterdPlugins result: ", result);
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                this.recommendations = result.data;
            }
        },
        async getRecommendationsByCategory(plugin, categoryType, category) {
            let result = await axios.get(`${API_URL}/recommendations/${categoryType}/${category}`);
            if (result.status === 200) {
                console.log("result.data: ", result.data);

                if (!this.recommendationsByCategory[plugin]) { this.recommendationsByCategory[plugin] = {}; console.log("THIS IS HAPPENING") }
                if (!this.recommendationsByCategory[plugin][categoryType]) { this.recommendationsByCategory[plugin][categoryType] = {}; console.log("THIS IS HAPPENING") }
                if (!this.recommendationsByCategory[plugin][categoryType][category]) { this.recommendationsByCategory[plugin][categoryType][category] = [];console.log("THIS IS HAPPENING") }


                this.recommendationsByCategory[plugin][categoryType][category] = result.data;
            }
        },
        async changeBookStatus(title, author, cover_url, description, link, rating, rating_count, status_value, provider_url) {
            let result = await axios.post(`http://localhost:3000/goodreads/changeBookStatus`, {
                title: title,
                author: author,
                cover_url: cover_url,
                description: description,
                link: link,
                rating: rating,
                rating_count: rating_count,
                status_value: status_value,
                provider_url: provider_url
            });
            if (result.status === 200) {
                console.log("result.data: ", result.data);
            }
        },
        async getExistingStatusBatch(urls) {
            let result = await axios.post(`http://localhost:3000/goodreads/getExistingStatusBatch`, {
                urls: urls
            });
            if (result.status === 200) {
                console.log("result.data: ", result.data);
                return result.data;
            }
        },

    },
    getters: {
        
    },
    persist: true,
    
    
})