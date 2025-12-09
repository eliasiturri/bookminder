<template>
    <div id="search-plugin">
        <div class="search-box">
            <div class="search-box-row">
                <div class="input-row">
                    <label for="gut-title">Title</label>
                    <input id="gut-title" v-model="title" type="text" placeholder="Title" />
                </div>
            </div>
            <div class="search-box-row">
                <div class="input-row">
                    <label for="gut-author">Author</label>
                    <input id="gut-author" v-model="author" type="text" placeholder="Author" />
                </div>
                <div class="input-row">
                    <label for="gut-subject">Subject</label>
                    <input id="gut-subject" v-model="subject" type="text" placeholder="Subject" />
                </div>
                <div class="input-row">
                    <label for="gut-language">Language</label>
                    <input id="gut-language" v-model="language" type="text" placeholder="Language ISO Code (two-letters)" />
                </div>
            </div>        
            <div class="search-box-row">
                <button class="contrast-text" @click="search" :disabled="searching">
                    <span v-if="searching" class="spinner"></span>
                    <span v-else>Search in Project Gutenberg</span>
                </button>
            </div>            
        </div>

        <h2 class="results-header">
            <span>Results</span>
            <span>({{ total }})</span>
        </h2>

        <div class="errors-box"></div>

        <div v-if="results.length > 0" class="results-box" >
            
            <div v-for="result, idx in results" v-bind:key="idx" class="book-element card"> 
                <Cover :url="result.cover" class="cover-holder" />
                <div class="info">
                    <div class="top-holder">
                        <h3>{{ result.title }}</h3>
                        <p>{{ result.author }}</p>
                        <p>{{ result.subject }}</p>
                    </div>
                    <div class="extension-size-holder">
                        <span>{{ result.type }}</span>
                        <span>{{ result.size || "Unknown size" }}</span>
                        <button 
                            v-if="result.type === 'Text'"
                            class="add-to-library-btn"
                            @click.stop="fetchBook(result.id, result.title)"
                        >
                            {{ t('gutenberg.add to library') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="results-box">
            <p>No results</p>
        </div>
        <Paginator :current="current" :max="getMaxPages()" @page-switch="pageSwitch"/>
        <VueFinalModal
            v-model="bookModal"
            :teleport-to="'body'"
            class="library-selector-modal-container"
            content-class="library-selector-content"
            overlay-transition="vfm-fade"
            content-transition="vfm-fade"
            >
            <LibrarySelectorModal 
                :bookId="requestedBookId" 
                :bookTitle="requestedBookTitle"
                @close="close"
                @download-started="handleDownloadStarted"
            />
        </VueFinalModal>

    </div>
</template>

<script>

import { mapState } from 'pinia'
import { useGutenbergSearchStore } from '../stores/search'

import { VueFinalModal } from 'vue-final-modal'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'

import { useI18n } from 'vue-i18n';

import Cover from './Cover.vue'
import Paginator from './Paginator.vue'
import LibrarySelectorModal from './LibrarySelectorModal.vue'

import InputWithLabel from '@/components/input/InputWithLabel.vue'

export default {
    name: 'SearchComponent',
    setup() {
        const { t } = useI18n();
        return { t };
    },
    data() {
        return {
            title: '',
            language: '',
            author: '',
            subject: '',
            searchStore: useGutenbergSearchStore(),
            results: [],
            total: 0,
            current: 1,
            bookModal: false,
            requestedBookId: '',
            requestedBookTitle: '',
            pluginName: 'gutenberg',
            searching: false,
            icons: {
                faMagnifyingGlass: faMagnifyingGlass
            }
        }
    },   
    
    computed: {

    },
    methods: {
        async search() {
            this.current = 1;
            this.searching = true;
            console.log('searching', this.searchStore);

            try {
                let response = await this.searchStore.search({title: this.title, language: this.language, author: this.author, subject: this.subject});
                console.log(response);
                this.results = response.results;
                this.total = response.total;
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                this.searching = false;
            }
        },
        request(idx) {
            this.requestedBookIdx = idx;
            this.requestModal = true;
        },
        async fetchBook(id, title) {
            console.log("Opening download modal for book", id, title);
            this.requestedBookId = id;
            this.requestedBookTitle = title;
            this.bookModal = true;
        },
        handleDownloadStarted() {
            // Could refresh library list or show additional feedback here
            console.log('Download started for book', this.requestedBookId);
        },
        async pageSwitch(page) {
            console.log('page switch', page);
            let response = await this.searchStore.search({title: this.title, language: this.language, author: this.author, subject: this.subject}, page);
            this.results = response.results;
            this.total = response.total;
            this.current = page;
            this.scrollToTop();
        },
        scrollToTop() {
            window.scrollTo(0,0);
        },
        getMaxPages() {
            let total = parseInt(this.total);
            let max = Math.ceil(total / 10);
            return max;
        },
        close() {
            this.bookModal = false;
        }
    },
    async mounted() {

    },    
    components: {
        VueFinalModal,
        FontAwesomeIcon,
        Cover,
        Paginator,
        LibrarySelectorModal,
        InputWithLabel
        
    }
    
}

</script>

<style>

.vfm {
    display: flex;
    align-items: center;
    justify-content: center;
}

.vfm__container {
    display: flex;
    justify-content: center;
    align-items: center;
}

.library-selector-modal-container {
    display: flex;
    align-items: center;
    justify-content: center;
}

.library-selector-content {
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>

<style scoped>
@import '../assets/book.css';

#search-plugin {
    display: flex;
    flex-direction: column;
    height: 100%;    
    width: 100%;
    margin-top: 0.75rem !important;
}

.search-box {
    display: flex;
    flex-direction: column;
}

.search-box-row {
    display: flex;
    margin-bottom: 1rem;
    align-items: center;
}

.search-box button {
    padding: 0.5rem 1.5rem;
    border-radius: 5px;
    background-color: #439eff;
    color: white;
    cursor: pointer;
    border: none;
    font-size: 16px;
    height: 39px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.search-box button:disabled {
    background-color: #7ab8ff;
    cursor: not-allowed;
}

.spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

input {
    padding: 0.5rem;
    border-radius: 5px;
    border: 1px solid #e8e8e8;
    margin-right: 0.5rem;
    width: 100%;
    min-height: 40px;
    font-size: 14px;
}

.book-search-result {
    display: flex;
    margin-bottom: 1rem;
}

.results-header {
    margin-bottom: 0.35rem;
}

.results-header > span {
    margin-right: 0.5rem;
}

.results-box {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    flex-grow: 1;
    gap: 10px;
}

.book-element.card {
    background-color: var(--primary-bg-color);
}

.input-row {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.input-row:not(:last-child) {
    margin-right: 0.5rem;
}

.contrast-text {
    color: white;
    font-weight: 900;
}
</style>