<template>
    <main>
        <DashboardTopNavigation :title="t('nav.home')"/>
        <div class="main-constrainer main-max-width">
            <HScrollable internalRef="scrollable-libraries" ref="scrollable-libraries" :title="[t('home.my media')]" class="scrollable" @child-interface="getChildInterface">
                <LibraryCard v-for="library in myLibraries" cardType="library" :id="library.id.toString()" :libraryId="library.id.toString()" :name="library.name" :type="library.type" :imgPath="library.image_path" :basePath="library.base_path" tabindex="0" @focus="handleFocus($event, 'scrollable-libraries' )" />
            </HScrollable>  

            <HScrollable class="scrollable mt-2rem" internalRef="scrollable-reading" ref="scrollable-reading" :title="[t('home.continue reading')]" v-if="readingBooks && readingBooks.length > 0" @child-interface="getChildInterface">
                <LibraryCard v-for="book in readingBooks" cardType="book" :book="book" :id="book.id.toString()" :libraryId="book.library_id.toString()" :name="book.title" :author="book.author" orientation="vertical" :imgPath="book.cover_url" :basePath="book.base_path" tabindex="0" @focus="handleFocus($event, 'scrollable-reading' )" @openbook="openBook"/>
            </HScrollable>          

            <HScrollable class="scrollable mt-2rem" :internalRef="`scrollable-added-${getScrollableUuid(idx, true)}`" :ref="`scrollable-added-${getScrollableUuid(idx, false)}`" v-for="ra, idx in recentlyAdded" :title="[t('home.recently added in'), ra.library_name]" @child-interface="getChildInterface">
                <LibraryCard v-for="book in ra.books" cardType="book" :book="book" :name="book.title" :id="book.id.toString()" :libraryId="ra.library_id.toString()" :author="book.author" orientation="vertical" :imgPath="book.cover_url" :basePath="ra.base_path" tabindex="0" @focus="handleFocus($event, `scrollable-added-${getScrollableUuid(idx, false)}` )" @openbook="openBook"/>
            </HScrollable>   
        </div>  
    </main>
</template>

<script>

import { mapState } from 'pinia'
import { useLibrariesStore } from '../stores/libraries'

import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'

import HScrollable from '../components/libraries/HScrollable.vue';
import LibraryCard from '@/components/libraries/LibraryCard.vue'

import { v4 as uuidv4 } from 'uuid';
import { useI18n } from 'vue-i18n';
import { toastTTS } from '@/utils/tts';

export default {
    name: 'HomeView',
    data() {
        return {
            interfaces: {},
            scrollableUuids: [],
            t: useI18n().t,
            librariesStore: useLibrariesStore(),
        }
    },   
    watch: {

    },
    computed: {
        ...mapState(useLibrariesStore, ['myLibraries', 'allLibraries', 'recentlyAdded', 'reading']),
        typeSearchPlugins() {
            return this.registeredPlugins.filter(plugin => plugin.type == 'search');
        },
        readingBooks() {
            return this.reading.length > 0 ? this.reading[0].books : [];
        },
    },
    methods: {
        openBook(bookId, bookTitle, libraryId, formatId) {
            if (!formatId) {
                toastTTS('error', this.t('errors.no epub format available'));
                return;
            }
            this.$router.push({
                name: 'reader',
                params: { bookId: bookId, libraryId: libraryId.toString(), formatId: formatId, title: bookTitle },
                query: { returnTo: this.$route.fullPath }
            });
        },
        getChildInterface(containerName, interfac) {
            if (interfac) {
                this.interfaces[containerName] = interfac;
            }
        },
        getScrollableUuid(idx, generate) {
            if (generate) {
                let uuid = uuidv4();
                this.scrollableUuids.push(uuid);
                return uuid;
            }
            return this.scrollableUuids[idx];
        },
        handleFocus(event, containerName) {
            const container = Array.isArray(this.$refs[containerName])  ? this.$refs[containerName][0].$el : this.$refs[containerName].$el;
            const element = event.target;
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();

            if (elementRect.right > containerRect.right) {
                let childInterface = this.interfaces[containerName];
                childInterface.scrollLeftBy(elementRect.right - containerRect.right);
            } else if (elementRect.left < containerRect.left) {
                let childInterface = this.interfaces[containerName];
                childInterface.scrollRightBy(containerRect.left - elementRect.left);
            }
        }        
    },
    async mounted() {
        await this.librariesStore.getMyLibraries();
        await this.librariesStore.getRecentlyAdded();
        await this.librariesStore.getReading();
    },    

    components: {
        DashboardTopNavigation,
        HScrollable,
        LibraryCard
    }
    
}
</script>

<style scoped>

@import '@/assets/css/paddings.css';

.book-search-result {
    display: flex;
    margin-bottom: 1rem;
}

.action {
    background-color: #007bff;
    color: white;
    padding: 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    width: min-content;
}

</style>