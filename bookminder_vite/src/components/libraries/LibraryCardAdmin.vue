<template>
<div class="library-card-container">
    <div class="library-card" :class="orientation">
        <FontAwesomeIcon :icon="type == 'user' ? icons.user : icons.global" class="type-icon" />
    </div>
    <div class="extra-data">
        <div class="left">
            <div class="library-card-header">
                <span class="ellipsis">{{ displayName }}</span>
            </div>
            <div class="library-card-body">
                <span class="description-text">{{ displayDescription }}</span>
                <span class="book-count">{{ getFolderCount(library) }}</span>
            </div>
        </div>
        <div class="right">
            <div class="config-button">
                <font-awesome-icon :icon="icons.gearIcon" @click="openConfig()" @keyup.enter="openConfig()" tabindex="0"/>
            </div>
        </div>
    </div>
</div>
</template>

<script>

import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
import { faUser } from '@fortawesome/free-regular-svg-icons'
import { faGlobe } from '@fortawesome/free-solid-svg-icons'
import { faGear, faPowerOff } from '@fortawesome/free-solid-svg-icons'
import { getBackgroundImageUrl } from '@/utils/urlFn.js'

export default {
    name: 'LibraryCard',
    data() {
        return {
            icons: {
                user: faUser,
                global: faGlobe,
                gearIcon: faGear,
            }
        }
    },   
    props: {
        id: {
            type: String,
            default: ''
        },
        library: {
            type: Object
        },
        name: {
            type: String,
            default: ''
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
            default: 'global'
        },
        orientation: {
            type: String,
            default: 'horizontal'
        }
    },
    
    computed: {
        imgUrl() {
            // Library image_path sometimes comes with an 'assets/' prefix from backend admin queries
            // Normalize to a path relative to the assets root so our URL helper doesn't double-prefix
            let p = this.imgPath || '';
            p = p.replace(/^\/?assets\/+/, '');
            if (!p) {
                p = 'meta/placeholders/lib-placeholder.jpg';
            }
            return getBackgroundImageUrl(p);
        },
        displayName() {
            return this.library?.name || this.library?.library_name || '';
        },
        displayDescription() {
            return this.library?.description || this.library?.library_description || '';
        }

    },
    emits: ['open-config'],
    methods: {
        getFolderCount(library) {
            const count = typeof library?.book_count === 'number'
                ? library.book_count
                : 0;
            return count === 1 ? '1 book' : `${count} books`;
        },
        openConfig() {
            this.$emit('open-config', this.library);
        }
    },
    async mounted() {

    },    
    components: {
        FontAwesomeIcon
    }
    
}

</script>

<style>

</style>

<style scoped>

@import '@/assets/css/containers.css';

.library-card-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 1em;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.library-card {
    background-image: v-bind(imgUrl);
    background-color: #0e0f12; /* fallback base to ensure contrast if image has transparent/letterboxed areas */
    background-clip: content-box;
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: cover;
    border-start-start-radius: 0.2rem;
    border-start-end-radius: 0.2rem;
    border-end-start-radius: 0;
    border-end-end-radius: 0;
    position: relative;
}

/* darken overlay to increase contrast from page background regardless of the image */
.library-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-start-start-radius: 0.2rem;
    border-start-end-radius: 0.2rem;
    border-end-start-radius: 0;
    border-end-end-radius: 0;
    background: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.6) 0%,
        rgba(0, 0, 0, 0.6) 100%
    );
    pointer-events: none;
}

.library-card.horizontal {
    min-width: 342px;
    min-height: 192px;
    max-width: 400px;
}

.extra-data {
    min-width: 342px;
    max-width: 400px;
}

.library-card.vertical {
    min-width: 190px;
    min-height: 285px;
    max-width: 400px;
}

.type-icon {
    position: absolute;
    color: white;
    top: 0.6rem;
    right: 0.6rem;
    z-index: 1; /* ensure icon renders above overlay */
}

.extra-data {
    display: flex;
    align-items: center;
    width: 300px;
    background-color: var(--secondary-bg-color);
    border: 1px solid rgba(0,0,0,0.15); /* subtle edge to separate from page background */
    padding: 10px;
    border-start-start-radius: 0;
    border-start-end-radius: 0;
    border-end-start-radius: 0.2rem;
    border-end-end-radius: 0.2rem;
    min-height: 150px;
}

.extra-data .left {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 9;
    min-height: 130px;
}

.library-card-body {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex-grow: 1;
    width: 100%;
}

.description-text {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
    max-height: calc(1.4em * 3);
    margin-bottom: 0.5rem;
}

.book-count {
    margin-top: auto;
    font-weight: 500;
    color: var(--text-secondary, #666);
}

.extra-data .right,
.extra-data .right > div {
    display: flex;
    justify-content: center;
    margin: 0 5px;
}

.library-card-header {

    font-size: 1.3rem;
    font-weight: bold;
}

.config-button {
    margin-right: 1.5rem;
    font-size: 1.5rem;
    cursor: pointer;
}

</style>