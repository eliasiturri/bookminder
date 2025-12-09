<template>
    <div class="content-container" v-if="ready">
        <div class="main-container books discover-block">
            <H2More class="discover-header" :header="'Specific stuff'" :showAction="false" :iconMarginTop="3"/>
            <div class="discover-book-block">
                    <ErrorAwareImage  v-for="(book, idx) in recommendationsByCategory[plugin][categoryType][category]" v-bind:key="book" 
                        :minimal="true"
                        :directUrl="false"
                        :hasCover="true"
                        :height="264"
                        :width="176"
                        :doSrc="book.cover_url"
                        :title="book.title"
                        :author="book.author"
                        :description="book.description"
                        :isOutside="true"
                        :isRead="book.is_read" 
                        :isLiked="book.is_liked"
                        :selectedAction="book.selectedAction"
                        @action-click="actionClick($event, book)"
                    />
            </div>
        </div>
    </div>
</template>

<script>

import { mapState } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import { useGoodreadsStore } from '../stores/goodreads'
import { defineAsyncComponent } from 'vue'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons'

import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'
import ErrorAwareImage from '@/components/ErrorAwareImage.vue'

import H2More from '@/components/navigation/H2More.vue'

import VueMultiselect from '@/components/vue-multiselect'
import { formatDistanceToNow } from 'date-fns'

export default {
    name: 'DiscoverByCategoryView',
    data() {
        return {
            goodreadsStore: useGoodreadsStore(),
            icons: {
                faCirclePlus: faCirclePlus
            },
            plugin: "",
            categoryType: "",
            category: "",
            ready: false

        }
    },   
    
    computed: {
        ...mapState(useGoodreadsStore, ['recommendationsByCategory']),
    },
    methods: {
        actionClick(key, book) {
            console.log(book);
            console.log(key);
            book.selectedAction = key;
            this.changeBookStatus(book, key);
        },
        async changeBookStatus(book, status) {
            let provider_url = "https://www.goodreads.com";
            await this.goodreadsStore.changeBookStatus(book.title, book.author, book.cover_url, book.description, book.link, book.rating, book.rating_count, status, provider_url);
        },
        async updateExistingStatus() {
            let urls = [];
            for (let book of this.recommendationsByCategory[this.plugin][this.categoryType][this.category]) {
                urls.push(book.link);
            }
            let existing = await this.goodreadsStore.getExistingStatusBatch(urls);

           existing.forEach((blob) => {
               this.recommendationsByCategory[this.plugin][this.categoryType][this.category].find((book) => {
                   if (book.link == blob.url) {

                       book.selectedAction = blob.status;
                   }
               });
           });
        }

    },
    async mounted() {
        this.plugin = this.$route.params.plugin;
        this.categoryType = this.$route.params.categoryType;
        this.category = this.$route.params.category;
        console.log("route params:", this.$route.params);

        //await this.updateExistingStatus();

        try {
            if (this.recommendationsByCategory[this.plugin][this.categoryType][this.category].length > 0) {
                this.ready = true;
            }
        } catch {
            console.log("no data exists in the the store");
        }

        
        await this.goodreadsStore.getRecommendationsByCategory(this.plugin, this.categoryType, this.category);
        await this.updateExistingStatus();

        // TODO: remove this
        /*if (this.recommendationsByCategory[this.plugin][this.categoryType][this.category].length > 3) {
            this.recommendationsByCategory[this.plugin][this.categoryType][this.category][0]['selectedAction'] = 'want-to';
            this.recommendationsByCategory[this.plugin][this.categoryType][this.category][1]['selectedAction'] = 'reading';
            this.recommendationsByCategory[this.plugin][this.categoryType][this.category][2]['selectedAction'] = 'read';
            this.recommendationsByCategory[this.plugin][this.categoryType][this.category][3]['selectedAction'] = null;
        }*/
        this.ready = true;


        
    },    
    components: {
        VueMultiselect,
        DashboardTopNavigation,
        FontAwesomeIcon,
        ErrorAwareImage,
        H2More
    }
    
}

</script>

<style scoped>
.content-container {
    width: 100%;
    padding: 1rem;
}

.discover-header {
    margin-bottom: 0.4rem;
}

.content-container .discover-block:not(:last-child) {
    margin-bottom: 1.5rem;
}

.discover-book-block {
    display: flex;
    flex-flow: row wrap;
}

.discover-book-block .book-card {
    margin-bottom: 1rem;
}

.discover-book-block .book-card:not(:last-child) {
    margin-right: 1rem;
}
</style>