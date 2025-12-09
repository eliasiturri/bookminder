<template>
    <main :class="!loaded ? 'invisible' : ''">
        <ReaderToolbar @visibility="(val) => showingMenu = val" :loaded="loaded" :title="title" :tocVisible="tocVisible" @goNext="goNext" @goPrev="goPrev" @menu="toggleMenu"></ReaderToolbar>
        <div class="reader-container">
            <div class="toc" v-if="tocVisible">
                <TOC @closeBook="closeBook" :isParent="true" :toc="toc" :title="title" :author="author" :coverBlob="cover" @goToFromToc="goToFromToc"/>
            </div>
            <foliate-view ref="ereader-view"></foliate-view>
        </div>
        <ReaderFooter :show="loaded && showingMenu" :progress="progressPercent"></ReaderFooter>
    </main>
    <main v-if="!loaded" class="flex-column" >
        <ReaderToolbar :title="title" dummy @goNext="goNext" @goPrev="goPrev"></ReaderToolbar>
        <div class="placeholder flex-row">
            <div class="placeholder-column">
                <PlaceholderText :lines="1" :margin-bottom="20" alignment="center"  width="50" :height="80" animated></PlaceholderText>
                <PlaceholderText :lines="1" :fill="true":reduceTotalHeightIn="120" width="random" :minWidthPercent="70" :height="20" animated></PlaceholderText>
            </div>
            <div class="placeholder-column">
                <PlaceholderText :lines="1" :fill="true" :reduceTotalHeightIn="20" width="random" :minWidthPercent="70" :height="20" animated></PlaceholderText>
            </div>
        </div>
        <ReaderFooter :show="loaded" :progress="progressPercent"></ReaderFooter>
    </main>
</template>

<script>

import { mapState } from 'pinia'
import { useLibrariesStore } from '../stores/libraries'

import ReaderToolbar from '@/components/reader/ReaderToolbar.vue'
import ReaderFooter from '@/components/reader/ReaderFooter.vue'

import TOC from '@/components/reader/TOC.vue'
import PlaceholderText from '@/components/placeholders/PlaceholderText.vue'

import '@/assets/libs/foliate-js/view.js'

import { useI18n } from 'vue-i18n';
import { toastTTS } from '@/utils/tts';

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default {
    name: 'ReaderView',
    data() {
        return {
            showingMenu: false,
            title: "",
            tocVisible: false,
            toc: null,
            cover: null,
            author: "",
            loaded: false,
            view: null,
            t: useI18n().t,
            librariesStore: useLibrariesStore(),
            progressPercent: 0
        }
    },   
    watch: {

    },
    computed: {

    },
    methods: {
        async saveLocation() {
            let cfi = await this.view.lastLocation.cfi;
            await this.librariesStore.setProgress(this.$route.params.bookId, cfi.toString());
        },
        async goNext() {
            console.log("goNext");
            await this.view.goRight();
            let progress = await this.view.resolveNavigation(this.view.lastLocation);
            this.printProgress(progress.index, progress.anchor);
            this.saveLocation();
        },
        async goPrev() {
            console.log("goPrev");
            await this.view.goLeft();
            let progress = await this.view.resolveNavigation(this.view.lastLocation);
            this.printProgress(progress.index, progress.anchor);
            this.saveLocation();    
        },
        async goToFromToc(href) {
            console.log("goToFromToc", href);
            await this.view.goTo(href);
            const progress = await this.view.resolveNavigation(this.view.lastLocation);
            this.printProgress(progress.index, progress.anchor);
            this.saveLocation();
        },
        toggleMenu() {
            this.tocVisible = !this.tocVisible;
        },
        getAuthor() {
            let author = this.view.book.metadata?.author;
            if (typeof author === 'object') {
                return author[0];
            } else {
                return author;
            }
        },
        closeBook() {
            // Prefer returning to the originating route if provided
            const returnTo = this.$route.query && this.$route.query.returnTo;
            if (returnTo && typeof returnTo === 'string') {
                this.$router.replace(returnTo);
                return;
            }
            // Fallback: go back if possible, else go Home
            if (window.history.length > 1) {
                this.$router.go(-1);
            } else {
                this.$router.replace({ name: 'home' });
            }
        },
        printProgress(index, anchor) {
            if (isNaN(index) || isNaN(anchor)) { return; }
            console.log("index", index);
            console.log("anchor", anchor);
            let sectionFractions = this.view.getSectionFractions();
            console.log("sectionFractions", sectionFractions);
            console.log((sectionFractions[index] * 100) + anchor);
            let t = (sectionFractions[index] * 100) + anchor;
            if (t > 100) { t = 100; }
            if (t < 0) { t = 0; }
            let progress = (sectionFractions[index] * 100) + (sectionFractions[index] * anchor);
            this.progressPercent = Number((t).toFixed(3));
        },
        handleKeyDown(event) {
            // Prevent navigation if user is selecting/copying text or using input elements
            if (window.getSelection()?.toString().length > 0) return;
            if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
            
            // Space or ArrowRight: next page
            if (event.key === ' ' && !event.shiftKey) {
                event.preventDefault();
                this.goNext();
            }
            // ArrowRight: next page
            else if (event.key === 'ArrowRight') {
                event.preventDefault();
                this.goNext();
            }
            // Shift+Space or ArrowLeft: previous page
            else if ((event.key === ' ' && event.shiftKey) || event.key === 'ArrowLeft') {
                event.preventDefault();
                this.goPrev();
            }
        },
        handleReaderClick(event) {
            // Don't navigate if user is selecting text or right-clicking
            if (window.getSelection()?.toString().length > 0) return;
            if (event.button !== 0) return; // Only handle left click
            
            const readerView = this.$refs['ereader-view'];
            if (!readerView) return;
            
            const rect = readerView.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const halfWidth = rect.width / 2;
            
            // Click on left half: previous page
            if (clickX < halfWidth) {
                this.goPrev();
            }
            // Click on right half: next page
            else {
                this.goNext();
            }
        }
    },
    async mounted() {

        this.title = this.$route.params.title;
        // get params from the url: libraryId, bookId
        let bookId = this.$route.params.bookId;
        let libraryId = this.$route.params.libraryId;
        let formatId = this.$route.params.formatId;

        const bookProgressData = await this.librariesStore.getBookUrl(libraryId, bookId, formatId);
        console.log("bookProgressData", bookProgressData);
        const bookUrl = bookProgressData.url || '';
        let bookProgress = bookProgressData.progress || 0;

        // Backend now returns absolute /assets/... URLs, use directly
        this._bookUrl = `${VITE_BACKEND_URL}${bookUrl}`;
        console.log('Final book URL', this._bookUrl);

        let view = this.$refs['ereader-view'];
        this.view = view;



        try {
            await this.view.open(this._bookUrl);
        } catch (e) {
            console.error('Error opening book URL', this._bookUrl, e);
            
            // Show user-friendly error message
            let errorMsg = this.t('errors.book loading failed');
            if (e.message && e.message.includes('Content-Length')) {
                errorMsg = this.t('errors.book too large or connection interrupted');
            } else if (e.message && (e.message.includes('network') || e.message.includes('fetch'))) {
                errorMsg = this.t('errors.network error loading book');
            }
            toastTTS('error', errorMsg);
            
            return; // abort further init if cannot open
        }

        await this.view.init({
            lastLocation: bookProgress
        });
        
        this.toc = await this.view.book.toc;
        this.author = this.getAuthor();

        Promise.resolve(this.view.book.getCover?.())?.then(blob =>{
        console.log("blob", blob);
            blob ? this.cover = blob : null})




        //await this.view.goTo(0);
        this.loaded = true;

        /*setTimeout(() => {
            this.loaded = true;
        }, 4000);*/

        setTimeout(async () => {
            let progress = await this.view.resolveNavigation(this.view.lastLocation);
            this.printProgress(progress.index, progress.anchor);
        }, 300);

        // Add keyboard navigation
        window.addEventListener('keydown', this.handleKeyDown);
        
        // Add click navigation on the reader view
        const readerView = this.$refs['ereader-view'];
        if (readerView) {
            readerView.addEventListener('click', this.handleReaderClick);
        }
    },
    beforeUnmount() {
        // Clean up event listeners
        window.removeEventListener('keydown', this.handleKeyDown);
        
        const readerView = this.$refs['ereader-view'];
        if (readerView) {
            readerView.removeEventListener('click', this.handleReaderClick);
        }
    },    

    components: {
        ReaderToolbar,
        ReaderFooter,
        TOC,
        PlaceholderText
    }
    
}

</script>

<style scoped>

@import '@/assets/css/containers.css';

#app {
    max-height: 100vh;
}

main {
    background-color: transparent;
    max-height: 100%;
    overflow: hidden;
}

.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;


}

.placeholder-column {
    display: flex;
    flex-direction: column;
    padding: 10px;
    height: 100%;
    width: 100%;
    max-height: 85%;
    max-width: 40%;
}

.placeholder-column:not(:last-child) {
    margin-right: 20px;
}

.invisible {
    display: none;
}

.reader-container {
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;
    
}

.toc {
    width: 300px;
    height: 100%;
    max-height: calc(100vh - 62px - 37px);
    overflow-y: scroll;
    margin: 10px;
    
    color: black;
}


foliate-view {
    width: 100%;
    height: 100%;
    display: block;
}

        
:root {
    --active-bg: rgba(0, 0, 0, .05);
}
@supports (color-scheme: light dark) {
    @media (prefers-color-scheme: dark) {
        :root {
            --active-bg: rgba(255, 255, 255, .1);
        }
    }
}
html {
    height: 100%;
}
body {
    margin: 0 auto;
    height: 100%;
    font: menu;
    font-family: system-ui, sans-serif;
}
#drop-target {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    visibility: hidden;
}
#drop-target h1 {
    font-weight: 900;
}
#file-button {
    font: inherit;
    background: none;
    border: 0;
    padding: 0;
    text-decoration: underline;
    cursor: pointer;
}
.icon {
    display: block;
    fill: none;
    stroke: currentcolor;
    stroke-width: 2px;
}
.empty-state-icon {
    margin: auto;
}
.toolbar {
    box-sizing: border-box;
    position: absolute;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 48px;
    padding: 6px;
    transition: opacity 250ms ease;
    visibility: hidden;
}
.toolbar button {
    padding: 3px;
    border-radius: 6px;
    background: none;
    border: 0;
    color: GrayText;
}
.toolbar button:hover {
    background: rgba(0, 0, 0, .1);
    color: currentcolor;
}
#header-bar {
    top: 0;
}
#nav-bar {
    bottom: 0;
}
#progress-slider {
    flex-grow: 1;
    margin: 0 12px;
    visibility: hidden;
}
#side-bar {
    visibility: hidden;
    box-sizing: border-box;
    position: absolute;
    z-index: 2;
    top: 0;
    left: 0;
    height: 100%;
    width: 320px;
    transform: translateX(-320px);
    display: flex;
    flex-direction: column;
    background: Canvas;
    color: CanvasText;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, .2), 0 0 40px rgba(0, 0, 0, .2);
    transition: visibility 0s linear 300ms, transform 300ms ease;
}
#side-bar.show {
    visibility: visible;
    transform: translateX(0);
    transition-delay: 0s;
}
#dimming-overlay {
    visibility: hidden;
    position: fixed;
    z-index: 2;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, .2);
    opacity: 0;
    transition: visibility 0s linear 300ms, opacity 300ms ease;
}
#dimming-overlay.show {
    visibility: visible;
    opacity: 1;
    transition-delay: 0s;
}
#side-bar-header {
    padding: 1rem;
    display: flex;
    border-bottom: 1px solid rgba(0, 0, 0, .1);
    align-items: center;
}
#side-bar-cover {
    height: 10vh;
    min-height: 60px;
    max-height: 180px;
    border-radius: 3px;
    border: 0;
    background: lightgray;
    box-shadow: 0 0 1px rgba(0, 0, 0, .1), 0 0 16px rgba(0, 0, 0, .1);
    margin-inline-end: 1rem;
}
#side-bar-cover:not([src]) {
    display: none;
}
#side-bar-title {
    margin: .5rem 0;
    font-size: inherit;
}
#side-bar-author {
    margin: .5rem 0;
    font-size: small;
    color: GrayText;
}
#toc-view {
    padding: .5rem;
    overflow-y: scroll;
}
#toc-view li, #toc-view ol {
    margin: 0;
    padding: 0;
    list-style: none;
}
#toc-view a, #toc-view span {
    display: block;
    border-radius: 6px;
    padding: 8px;
    margin: 2px 0;
}
#toc-view a {
    color: CanvasText;
    text-decoration: none;
}
#toc-view a:hover {
    background: var(--active-bg);
}
#toc-view span {
    color: GrayText;
}
#toc-view svg {
    margin-inline-start: -24px;
    padding-inline-start: 5px;
    padding-inline-end: 6px;
    fill: CanvasText;
    cursor: default;
    transition: transform .2s ease;
    opacity: .5;
}
#toc-view svg:hover {
    opacity: 1;
}
#toc-view [aria-current] {
    font-weight: bold;
    background: var(--active-bg);
}
#toc-view [aria-expanded="false"] svg {
    transform: rotate(-90deg);
}
#toc-view [aria-expanded="false"] + [role="group"] {
    display: none;
}
.menu-container {
    position: relative;
}
.menu, .menu ul {
    list-style: none;
    padding: 0;
    margin: 0;
}
.menu {
    visibility: hidden;
    position: absolute;
    right: 0;
    background: Canvas;
    color: CanvasText;
    border-radius: 6px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, .2), 0 0 16px rgba(0, 0, 0, .1);
    padding: 6px;
    cursor: default;
}
.menu.show {
    visibility: visible;
}
.menu li {
    padding: 6px 12px;
    padding-left: 24px;
    border-radius: 6px;
}
.menu li:hover {
    background: var(--active-bg);
}
.menu li[aria-checked="true"] {
    background-position: center left;
    background-repeat: no-repeat;
    background-image: url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%223%22%2F%3E%3C%2Fsvg%3E');
}
.popover {
    background: Canvas;
    color: CanvasText;
    border-radius: 6px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, .2), 0 0 16px rgba(0, 0, 0, .1), 0 0 32px rgba(0, 0, 0, .1);
}
.popover-arrow-down {
    fill: Canvas;
    filter: drop-shadow(0 -1px 0 rgba(0, 0, 0, .2));
}
.popover-arrow-up {
    fill: Canvas;
    filter: drop-shadow(0 1px 0 rgba(0, 0, 0, .2));
}
</style>