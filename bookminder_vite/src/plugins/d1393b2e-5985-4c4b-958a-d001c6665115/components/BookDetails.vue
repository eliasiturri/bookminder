<template>
    <div class="modal">
        <h1>
            <span>Book Details</span>
            <font-awesome-icon class="fa-icon pointer" :icon="icons.faXmark" @click="close"/>
        </h1>
        <div v-if="loading == true" class="book-details spinner">
            <GridLoader
            :loading="loading"
            :color="'#439eff'"
            :size="'30px'" />
        </div>
        <div v-else class="book-details">
            <div class="book-holder"> 
                <Cover :url="coverUrl" class="cover-holder" />
                <div class="info">
                    <div class="top-holder">
                        <h3>{{ book.title }}</h3>
                        <p>{{ book.author }}</p>
                        <p>{{ book.subject }}</p>
                    </div>
                    <div class="extension-size-holder">
                        <span>{{ book.type }}</span>
                        <span>{{ book.size }}</span>
                    </div>
                </div>
            </div>
            <RequestsComponent :data="book" :customData="customData" ref="requests"/>
            <div class="button-container">
                <button class="request-button" @click="request()">Request</button>
            </div>
        </div>
    </div>
</template>

<script>

import { mapState } from 'pinia'
import { useGutenbergSearchStore } from '../stores/search'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

import Cover from './Cover.vue'

import { GridLoader } from "vue3-spinner";

import RequestsComponent from '@/components/RequestsComponent.vue'

export default {
    name: 'BookDetails',
    data() {
        return {
            searchStore: useGutenbergSearchStore(),
            loading: true,
            book: {},
            bookForReq: {},
            icons: {
                faXmark: faXmark
            },
            customData: {
                source: '',
                plugin: ''
            }
        }
    },   
    props: {
        bookId: {
            type: String,
            required: true
        },
        coverUrl: {
            type: String,
            required: false
        }
    },    
    computed: {

    },
    watch: {
        bookId: async function() {
            this.loading = true;
            await this.fetchBookInfo();
            this.loading = false;
        },
        book: function() {
            this.formatBookForReq();
        }
    },
    emits: ['close'],
    methods: {
        async fetchBookInfo() {
            let response = await this.searchStore.fetch_book_info(this.bookId);
            console.log(response);
            this.book = response;
        },
        formatBookForReq() {
            let tmp = this.book;    
            tmp['title'] = this.book.name;
            if (tmp.authors.length >= 1) {
                tmp['author'] = this.book.authors[0].author;
            }
            this.bookForReq = tmp;
        },
        close() {
            this.$emit('close');
        },
        async request() {
            await this.$refs.requests.request();
            this.close();
            let response = await this.searchStore.download_book(this.pluginName, this.bookId, this.customData.source);
        },
        createRandomSAlphanumericourcePath(length) {
            let path = '';
            let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            for (let i = 0; i < length; i++) {
                path += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return path;
        }
    },
    async mounted() {
        await this.fetchBookInfo();
        this.loading = false;
        this.customData.source = this.createRandomSAlphanumericourcePath(64);
        this.customData.plugin = 'a84a949d-4b73-4099-aacb-8341b4da17ba';
    },    
    components: {
        Cover,
        GridLoader,
        FontAwesomeIcon,
        RequestsComponent
    }
    
}

</script>

<style>

</style>

<style scoped>
@import '../assets/book.css';

.modal {
    display: flex;
    flex-direction: column;
    height: 100%;    
    width: 100%;
}

.modal .spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

h1 {
    padding-left: 15px;
    padding-right: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #3b3b3b;
    color: white;
}

.pointer {
    cursor: pointer;
}

.button-container {
    display: flex;
    justify-content: center;
    margin-top: 10px;
}

.button-container button {
    background-color: #007bff;
    color: white;
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: 0px;
    cursor: pointer;
    width: min-content;
}

.book-details {
    overflow: auto;
    height: 100%;
}
</style>