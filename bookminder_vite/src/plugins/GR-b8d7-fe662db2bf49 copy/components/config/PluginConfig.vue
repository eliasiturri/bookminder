<template>
    <div class="content-container">
        <div class="main-container books discover-block" v-for="block in recommendations">
            <H2More @click="goToPerGenreRecommendations('goodreads', block.categoryType, block.category)" class="discover-header" :header="recommendationHeader(block.categoryType, block.categoryName)" :showAction="true" :iconMarginTop="3"/>
            <div class="discover-book-block">
                    <ErrorAwareImage  v-for="(book, idx) in block.data" v-bind:key="book" 
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
    name: 'DiscoverView',
    data() {
        return {
            goodreadsStore: useGoodreadsStore(),
            icons: {
                faCirclePlus: faCirclePlus
            }

        }
    },   
    
    computed: {
        ...mapState(useGoodreadsStore, ['recommendations']),
    },
    methods: {
        recommendationHeader(categoryType, categoryName) {
            let result = "Recommendations ";
            result += categoryType == "genre" ? "in " : "";
            result += categoryType == "genre" ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1) : categoryName;
            return result;
        },
        goToPerGenreRecommendations(plugin, categoryType, category) {
            this.$router.push({ name: 'discoverByCategory', params: { plugin: plugin, categoryType: categoryType, category: category } });
        }
    },
    async mounted() {
        await this.goodreadsStore.getRecommendations();
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

<style>
</style>

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