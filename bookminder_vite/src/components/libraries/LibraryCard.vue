<template>
<div class="library-card-container" @click="openBookDetails" @keyup.enter="openBookDetails">
    <div class="library-card">
        <div class="library-cover" :style="libraryCoverStyle" :class="[orientation, mobileScaleClass]">
            <FontAwesomeIcon v-if="cardType == 'library' || orientation == 'horizontal'" :icon="type == 'user' ? icons.user : icons.global" class="type-icon" />
            <!-- Author cards with loading placeholder -->
            <ErrorAwareAuthorImage 
                v-if="cardType == 'author'" 
                :doSrc="imgUrl" 
                :altText="altText"
                :width="coverWidth"
                :height="coverHeight"
            />
            <!-- Book cards use ErrorAwareImage to render a smart faux-cover when image fails -->
            <ErrorAwareImage 
              v-else-if="cardType == 'book'"
                            :minimal="true"
              :height="coverHeight"
              :width="coverWidth"
              :title="name"
              :author="author || ''"
              :description="''"
              :doSrc="imgUrl"
              :isOutside="true"
            />
            <!-- Library cards with loading placeholder -->
            <ErrorAwareLibraryImage 
                v-else
                :doSrc="imgUrl" 
                :altText="altText"
                :width="coverWidth"
                :height="coverHeight"
            />
            <div class="open-book-overlay-container" v-if="orientation != 'horizontal' && cardType != 'author'" >
                <div class="open-book-overlay" @click.stop="openBook">
                    <FontAwesomeIcon :icon="icons.play" />
                </div>
            </div>
        </div>


        <div class="library-name">
            {{ name }}
        </div>
        <div class="library-author" :class="authorAccessibleClass" v-if="author">
            {{ author }}
        </div>
    </div>
</div>
</template>

<script>

import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
import { faUser } from '@fortawesome/free-regular-svg-icons'
import { faGlobe, faCirclePlay, faGlasses } from '@fortawesome/free-solid-svg-icons'

import { getBackgroundImageUrl, getImageUrl } from '@/utils/urlFn.js'
import ErrorAwareImage from '@/components/ErrorAwareImage.vue'
import ErrorAwareAuthorImage from '@/components/ErrorAwareAuthorImage.vue'
import ErrorAwareLibraryImage from '@/components/ErrorAwareLibraryImage.vue'

import { useI18n } from 'vue-i18n';

import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

export default {
    name: 'LibraryCard',
    data() {
        return {
            icons: {
                user: faUser,
                global: faGlobe,
                play: faGlasses
            },
            t: useI18n().t
        }
    },   
    props: {
        cardType: {
            type: String,
            default: 'book'
        },
        id: {
            type: String,
            default: ''
        },
        libraryId: {
            type: String,
            default: ''
        },
        formatId: {
            type: Number,
            default: 0
        },
        name: {
            type: String,
            default: ''
        },
        author: {
            type: String,
            default: null
        },
        imgPath: {
            type: String,
            default: ''
        },
        basePath: {
            type: String,
            default: null
        },
        type: {
            type: String,
            default: 'user'
        },
        orientation: {
            type: String,
            default: 'horizontal'
        },
        book: {
            type: Object,
            default: null
        }
    },
    
    computed: {
        ...mapState(useSettingsStore, ['settings']),
        imgUrl() {
            return getImageUrl(this.imgPath);
        },
        coverWidth() {
            // Match existing CSS sizes: vertical = 190x285, horizontal = 342x190
            if (this.orientation === 'horizontal') return 342;
            return this.mobileScaleClass ? 180 : 190;
        },
        coverHeight() {
            if (this.orientation === 'horizontal') return 190;
            return this.mobileScaleClass ? 270 : 285;
        },
        libraryCoverStyle() {
            return {
                //backgroundImage: this.imgUrl + '!important'
            }
        },
        altText() {
            if (this.cardType == 'author') {
                let label = `${this.t('alts.author picture')} ${this.t('alts.for')} ${this.name}`;
                return label.length > 100 ? label.substring(0, 97) + '...' : label;
            } else if (this.orientation == 'horizontal') {
                let label = `${this.t('alts.library cover')} ${this.t('alts.for')} ${this.name}`;
                return label.length > 100 ? label.substring(0, 97) + '...' : label;
            } else {
                let label = `${this.t('alts.book cover')} ${this.t('alts.for')} ${this.name}`;
                return label.length > 100 ? label.substring(0, 97) + '...' : label;
            }
        },
        authorAccessibleClass() {

            let color = this.settings && this.settings.accessibility ? this.settings.accessibility.contrastAccessible ? this.secondaryColor : 'black' : 'black';
            let fontStyle = this.settings && this.settings.accessibility ? this.settings.accessibility.contrastAccessible ? 'italic' : 'normal' : 'normal';
            return {
                color: color,
                fontStyle: fontStyle
            }
        },
        mobileScaleClass() {
            return screen.width < 768 ? 'mobile-scale' : '';
        }
    },
    emits: ['openbook'],
    methods: {
        openBook() {
            console.log('open book', this.book);
            // Resolve library id: prefer explicit prop, fallback to book.library_id
            const libId = (this.libraryId != null && this.libraryId !== '') ? this.libraryId : (this.book ? this.book.library_id : null);
            console.log('Resolved library ID:', libId, 'from prop:', this.libraryId, 'from book:', this.book?.library_id);
            // Prefer EPUB format; if unknown, fallback to id 1 (EPUB in demo DB)
            let fmtId = null;
            if (this.book && Array.isArray(this.book.formats) && this.book.formats.length) {
                const epub = this.book.formats.find(f => {
                    try { return f && typeof f === 'object' && f.name && String(f.name).toLowerCase() === 'epub'; }
                    catch (_) { return false; }
                });
                if (epub && 'id' in epub) {
                    fmtId = epub.id;
                } else {
                    const idOne = this.book.formats.find(f => f && typeof f === 'object' && f.id === 1);
                    if (idOne) fmtId = idOne.id;
                }
            } else {
                // No formats provided in payload (Home recently-added). Use id 1 as pragmatic default.
                fmtId = 1;
            }
            const libIdStr = libId != null ? String(libId) : '';
            this.$emit('openbook', (this.book.book_id || this.id), this.book.title || this.name, libIdStr, fmtId);
        },
        openBookDetails() {

            let libId = null;
            this.libraryId ? libId = this.libraryId : libId = this.book ? this.book.library_id : null;
            let formatId = 0;

            if (this.cardType == 'author') {
                this.$router.push({ name: 'books-by-author', params: { authorId: this.id, authorName: this.name } });
            } else if (this.cardType == 'library') {
                this.$router.push({ name: 'books', params: { libraryId: libId, libraryName: this.name } });
            } else {
                this.$router.push({ name: 'book', params: { libraryId: libId, bookId: this.id, formatId: formatId, title: this.name } });
            }            
        }
    },
    async mounted() {

    },    
    components: {
        FontAwesomeIcon,
        ErrorAwareImage,
        ErrorAwareAuthorImage,
        ErrorAwareLibraryImage
    }
    
}

</script>

<style>

</style>

<style scoped>

.library-card-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: start;
    width: auto;
}

.library-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
}

.library-name {
    font-size: 1rem;
    margin-top: 0.2rem;
    text-align: center;
    max-width: 200px;
    height: 100%;
    text-overflow: ellipsis;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.1;
}

.library-author {
    font-size: 0.8rem;
    margin-top: 0.2rem;
    text-align: center;
    max-width: 200px;
    line-height: 1.1;
}

.library-cover {
    position: relative;
    /*background-image: v-bind(imgUrl);*/
    background-clip: content-box;
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: cover;
    border-radius: .2em;
}

.library-cover.horizontal,
.library-cover.horizontal img {
    min-width: 342px;
    min-height: 190px;
    max-height: 190px;
    max-width: 342px;
    object-fit: cover;
}

.library-cover.vertical,
.library-cover.vertical img {
    width: 190px;
    height: 285px;
    max-height: 285px;
    max-width: 190px;
    object-fit: cover;
}

.library-card .vertical.mobile-scale,
.library-card .vertical.mobile-scale img {
    width: 180px;
    height: 270px;
    object-fit: cover;
}

.library-cover.horizontal:hover {
    cursor: pointer;
    filter: opacity(0.6);

    
}

.type-icon {
    position: absolute;
    color: white;
    top: 0.6rem;
    right: 0.6rem;
    z-index: 10;
}

.open-book-overlay-container {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    width: 100%;
    height: 100%;
    font-size: 3rem;
    z-index: 100;
    top: 0;
    backdrop-filter: blur(10px);
}

.library-cover:not(:hover) .open-book-overlay-container {
    visibility: hidden;
    opacity: 0;
    
}

.open-book-overlay-container {
    opacity: 1;
    
    transition: opacity 1s, backdrop-filter 0.25s;
}

.open-book-overlay {
    display: flex;
    align-items: center;
    justify-content: center;    
    width: 50%;
    height: auto;
    aspect-ratio: 1/1;
    border-radius: 50%;
    cursor: pointer;
    border: 1px solid white;
    opacity: 1;
    transition: opacity 1s;    
    background-color: rgba(0, 0, 0, 0.7);
    
}

.library-card-container:focus-visible {
    outline: 5px solid var(--focus-ring-color);
    outline-offset: 3px;
    margin-top: 8px;
    margin-bottom: 8px;
}
.library-card-container:first-child:focus-visible {
    margin-left: 8px;
}
.library-card-container:last-child:focus-visible {
    margin-right: 8px;
}
</style>