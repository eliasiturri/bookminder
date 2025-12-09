<template>
    <div class="flex-column sticky" v-if="isParent">
        <div class="book-info-container" >
            <img v-if="coverImage" class="cover-image" :src="coverImage" :alt="t('alts.book cover')" />
            <ErrorAwareImage v-else
                :minimal="true"
                :width="60"
                :height="90"
                :title="title"
                :author="author"
                :doSrc="null"
                :showTitle="false"
            />
            <div class="book-info">
                <span class="title">{{ title }}</span>
                <span class="author">{{ author }}</span>
            </div>
        </div>
        <div class="close-container">
            <div class="close pointer action-button" @click="closeBook">
                <FontAwesomeIcon class="icon" :icon="icons.close" @click.stop="closeBook" />
                <span>{{ t('reader.close book') }}</span>
            </div>
        </div>
    </div>
    <div class="toc-element" v-for="(el, idx) in editableToc">
        <div class="title-container" @click="menuClick(idx)">
            <span class="chevron"><FontAwesomeIcon :icon="pickIcon(idx)" @click="goTo(el.href)"/></span>
            <span class="title">{{ el.label }}</span>
        </div>
        <div class="subitems" v-if="el.subitems && el.showSubitems">
            <TOC :toc="el.subitems" @goToFromToc="goTo" />
        </div>
    </div>
    
</template>

<script>

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faChevronRight, faChevronDown, faXmark } from '@fortawesome/free-solid-svg-icons'
import { faBookmark } from '@fortawesome/free-regular-svg-icons'

import { useI18n } from 'vue-i18n'

export default {
    name: 'TOC',
    data() {
        return {
            editableToc: [],
            icons: {
                right: faChevronRight,
                down: faChevronDown,
                bookmark: faBookmark,
                close: faXmark
            },
            t: useI18n().t,
        }
    },   
    props: {
        isParent: {
            type: Boolean,
            default: false
        },
        toc: {
            type: Object,
            default: {}
        },
        coverBlob: {
            type: Blob,
            default: null
        },
        title: {
            type: String,
            default: ""
        },
        author: {
            type: String,
            default: ""
        }
    },
    computed: {
        coverImage() {
            if (!this.coverBlob) return null;
            return URL.createObjectURL(this.coverBlob);
        }
        
    },
    watch: {
        toc() {
            this.editableToc = this.toc;
        }

    },
    methods: {
        pickIcon(idx) {
            if (this.editableToc[idx].showSubitems) {
                return this.icons.down;
            } else if (this.editableToc[idx].subitems) {
                return this.icons.right;
            } else {
                return this.icons.bookmark;
            }
        },
        showSubitems(idx) {
            console.log(this.editableToc)
            console.log("showSubitems", idx);
            if (!this.editableToc[idx].showSubitems) { this.editableToc[idx].showSubitems = true; return; }
            this.editableToc[idx].showSubitems = !this.editableToc[idx].showSubitems;
        },
        goTo(href) {
            console.log("goTo", href);
            this.$emit('goToFromToc', href);
        },
        menuClick(idx) {
            if (this.editableToc[idx].subitems) {
                this.showSubitems(idx);
            } else {
                this.goTo(this.editableToc[idx].href);
            }
        },
        closeBook() {
            this.$emit('closeBook');
        }
    },
    async mounted() {
        this.editableToc = this.toc;
    },   
    emits: ['goToFromToc', 'closeBook'], 
    components: {
        FontAwesomeIcon,
        ErrorAwareImage: () => import('@/components/ErrorAwareImage.vue'),
    }
    
}

</script>

<style scoped>
.cover-image {
    max-width: 60px;
    margin-right: 5px;
}
.title-container {
    display: flex;
    flex-direction: row;
    align-items: start;
    justify-content: start;
    padding: 5px;
}

.title-container .chevron {
    margin-right: 5px;
}

.book-info-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: start;
    padding: 5px;
}

.book-info {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: start;
    margin-left: 5px;
}

.book-info .title {
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.2;
}

.book-info .author {
    font-size: 0.8rem;
}

.close-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 5px;
}

.close {
    display: flex;
    padding: 5px;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    border-radius: 15px;
    cursor: pointer;
    width: 100%;
    padding: 5px 20px;
}

.close .icon {
    margin-right: 5px;
}

.sticky {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: white;
}
</style>