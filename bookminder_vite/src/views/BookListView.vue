<template>
    <main>
        <DashboardTopNavigation :title="getTitle()"/>
        <div class="main-constrainer main-max-width">

            <FilterComponent :placeholder="getFilterPlaceholder()" :value="filterText" @filter="filter" class="filter-input filter-container-margin-bottom-lg"/>
            <div class="grid-container">
                <LibraryCard v-for="book in filteredBooks" orientation="vertical" :book="book" :id="book.book_id.toString()" :name="book.title" :author="book.author" :imgPath="book.cover_url" :basePath="book.base_path" @openbook="openBook"/>
            </div>
        </div>

    </main>
</template>

<script>

import { mapState } from 'pinia'
import { useLibrariesStore } from '../stores/libraries'

import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'
import FilterComponent from '@/components/FilterComponent.vue'
import LibraryCard from '@/components/libraries/LibraryCard.vue'

import VueMultiselect from '@/components/vue-multiselect'

import { useI18n } from 'vue-i18n';
import { toastTTS } from '@/utils/tts';

export default {
    name: 'BookListView',
    data() {
        return {
            referrerType: null,
            libraryId: null,
            libraryName: null,
            bookDetails: null,
            bookId: null,
            libraryId: null,
            coverPath: null,
            selectedFormat: null,
            t: useI18n().t,
            librariesStore: useLibrariesStore(),
            filterText: '',
        }
    },   
    props: {

    },
    watch: {

    },
    computed: {
        filteredBooks() {
            let books = [];

            if (this.referrerType == 'author') {
                books = this.librariesStore.allBooks ? this.librariesStore.allBooks : [];
                
                return books.filter(book => {
                    return book.author.toLowerCase().includes(this.libraryName.toLowerCase()) &&
                    book.author_ids.includes(parseInt(this.libraryId));
                });
            } else if (this.libraryId) {
                books = this.librariesStore.booksLibraries[this.libraryId.toString()] ? this.librariesStore.booksLibraries[this.libraryId.toString()]['books'] : [];
            } else {
                books = this.librariesStore.allBooks ? this.librariesStore.allBooks : [];
            }
            return books.filter(book => book.title.toLowerCase().includes(this.filterText.toLowerCase()) || book.author.toLowerCase().includes(this.filterText.toLowerCase()));
            
        },


    },
    methods: {
        filter(value) {
            this.filterText = value;
        },
        getTitle() {
            if (this.referrerType == 'author') {
                return `${this.t('nav.head.books by')} ${this.libraryName}`;
            } else if (this.libraryId) {
                return `${this.t('nav.head.all books in')} ${this.libraryName}`;
            } else {
                return this.t('nav.head.all books');
            }
        },
        getFilterPlaceholder() {
            if (this.referrerType == 'author') {
                return this.t('placeholders.filter by book title');
            } else {
                return this.t('placeholders.filter by book title or author');
            }
        },    
        openBook(bookId, bookTitle, libraryId, formatId) {
            console.log(bookId, bookTitle, libraryId, formatId);
            // Fallback libraryId: route param when not provided
            if (!libraryId) {
                libraryId = this.libraryId || this.$route.params.libraryId;
            }
            if (!libraryId) {
                toastTTS('error', 'Missing library id for reader');
                return;
            }
            if (!formatId) {
                toastTTS('error', this.t('errors.no epub format available'));
                return;
            }
            this.$router.push({
                name: 'reader',
                params: { bookId: bookId, libraryId: String(libraryId), formatId: formatId, title: bookTitle },
                query: { returnTo: this.$route.fullPath }
            });
        }        
    },
    async mounted() {
        if (this.$route.path.startsWith('/books-by-author')) {
            this.referrerType = 'author';
            this.libraryId = this.$route.params.authorId;
            this.libraryName = this.$route.params.authorName;
            await this.librariesStore.getAllBooks();
        } else {
            this.referrerType = 'library';
            this.libraryId = this.$route.params.libraryId;
            this.libraryName = this.$route.params.libraryName;
            this.libraryId && this.librariesStore.booksLibraries[this.libraryId] ? this.librariesStore.booksLibraries[this.libraryId].lastTimestamp = null : null;
            this.libraryId != undefined ?  await this.librariesStore.getAllBooks(this.libraryId) : await this.librariesStore.getAllBooks();
        }
    },    

    components: {
        DashboardTopNavigation,
        FilterComponent,
        LibraryCard,
        VueMultiselect

    }
    
}

</script>


<style scoped>

@import '@/assets/css/containers.css';
@import '@/assets/css/paddings.css';

.container {
    display: flex;
    justify-content: start;
    align-items: center;
    margin-top: 4rem;
    width: 100%;
}

.book-card {
    position: relative;
    width: 100%;
}

.cover {
    position: absolute;
    top: 0;
    left: 2.5rem;
}

.cover img {
    max-width: 250px;
}

.title-container {
    display: flex;
    margin-top: 1.5rem;
    background-color: var(--topbar-bg-color);
    height: 6rem;    
}

.title-data {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: start;
    padding: 1rem;
}

.title-data .subtitle .authors {
    margin-left: 10px;
}

.data-container {
    display: flex;
    padding: 1rem;

}

.spacer {
    min-width: calc(2.5rem + 2.5rem + 250px);
}

.book-card .title-container .title {
    font-size: 1.5rem;
    font-weight: bold;
}

</style>