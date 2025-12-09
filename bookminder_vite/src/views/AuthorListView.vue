<template>
    <main>
        <DashboardTopNavigation :title="t('nav.head.all authors')"/>
        <div class="main-constrainer main-max-width">

            <FilterComponent :placeholder="t('placeholders.filter by author name')" :value="filterText" @filter="filter" class="filter-input filter-container-margin-bottom-lg"/>
            <div class="grid-container">
                <LibraryCard v-for="el in filteredAuthors" cardType="author" :id="el.id.toString()" :name="el.name" orientation="vertical" :imgPath="el.cover_url" :basePath="el.base_path" :tabindex="getTabIndex()" />
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

export default {
    name: 'AuthorListView',
    data() {
        return {
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
        filteredAuthors() {
            let authors = this.librariesStore.allAuthors ? this.librariesStore.allAuthors : [];
            return authors.filter(el => {
                if (!el.id) return false;
                let name = el.name ? el.name.toLowerCase() : '';
                return name.includes(this.filterText.toLowerCase());
            });
        },
    },
    methods: {
        getTabIndex() {
            this.lastTabIndex += 1;
            return this.lastTabIndex;
        },
        filter(value) {
            this.filterText = value;
        },
    },
    async mounted() {
        this.lastTabIndex = 1000;
        await this.librariesStore.getAllAuthors();
        
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
    flex-wrap: wrap;
    gap: 2rem;
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