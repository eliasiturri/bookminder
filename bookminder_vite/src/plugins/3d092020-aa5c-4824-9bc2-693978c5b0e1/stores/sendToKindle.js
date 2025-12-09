import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL : 'https://bookminder.io';

const API_URL = BASE_URL + '/plugins';

import { toastTTS } from '@/utils/tts';


export const useSendToKindleStore = defineStore('sendToKindleStore', {
    state: () => ({
        xdestinations: [
            {
                name: 'Kindle',
                value: 'kindle',
                email: 'kindle_email'
            },
            {
                name: 'PocketBook',
                value: 'pocketbook',
                email: 'pocketbook_email'
            },
            {
                name: 'Kobo',
                value: 'kobo',
                email: 'kobo_email'
            },
            {
                name: 'Tolino',
                value: 'tolino',
                email: 'tolino_email'
            },
            {
                name: 'Onyx Boox',
                value: 'onyx',
                email: 'onyx_email'
            },
            {
                name: 'Sony',
                value: 'sony',
                email: 'sony_email'
            }
        ],
        xconfigData: {
            host: "smtp.mail.yahoo.com",
            port: "465",
            username: "cestgarcia@yahoo.es",
            password: "iulgtwxgftubmqfz",
        },  
        destinations: [],
        configData: {
            host: "",
            port: "",
            username: "",
            password: "",
        },
        destination: {
            name: "",
            value: "",
            email: ""
        },
        settings: {}

    }),
    actions: {
        async getData(pluginId) {
            console.log("SendToKindle: getData() called");
            let result = await axios.get(`${API_URL}/settings`, {
                params: {
                    publicUuid: "3d092020-aa5c-4824-9bc2-693978c5b0e1"
                },
                withCredentials: true
            });
            console.log("SendToKindle: GET /settings response:", result);
            if (result.status === 200) {
                console.log("SendToKindle: result.data: ", result.data);
                if (result.data) {
                    let data = JSON.parse(result.data);
                    console.log("SendToKindle: Parsed data:", data);
                    this.configData = data.configData;
                    this.destinations = data.destinations;
                    console.log("SendToKindle: Store updated - configData:", this.configData, "destinations:", this.destinations);
                } else {
                    console.log("SendToKindle: No data returned from server (null)");
                }
            }
        },    
        async saveData() {
            console.log("SendToKindle: saveData() called");
            console.log("SendToKindle: Saving configData:", this.configData);
            console.log("SendToKindle: Saving destinations:", this.destinations);
            let result = await axios.post(`${API_URL}/settings`, {
                publicUuid: "3d092020-aa5c-4824-9bc2-693978c5b0e1",
                data: {
                    configData: this.configData,
                    destinations: this.destinations
                }
            }, {
                withCredentials: true
            });
            console.log("SendToKindle: POST /settings response:", result);
            if (result.status === 200) {
                console.log("SendToKindle: Save successful, result.data:", result.data);
                return result.data;
            }
        }             ,
        async sendToKindle(path, email) {
            let result = await axios.post(`${API_URL}/action`, {

                publicUuid: "3d092020-aa5c-4824-9bc2-693978c5b0e1",
                payload: {
                    path: path,
                    url: "/send",
                    email: email
                }
            }, {
                withCredentials: true
            });
            console.log("pinia axios send result: ", result);
            if (result.status === 200) {

                if (result.data.error) {
                    toastTTS('error', result.data.error);
                    return result.data;
                } else {
                    let msg = result.data.message  ? result.data.message : "El libro debería llegar a tu Kindle en breve";
                    toastTTS('info', msg);
                    return result.data;
                }
            }
        }
    },
    getters: {
        
    }
    
    
})