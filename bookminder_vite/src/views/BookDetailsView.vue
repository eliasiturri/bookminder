<template>
    <main>
        <DashboardTopNavigation :title="bookDetails ? bookDetails.title : 'Book Details'"/>
        <div class="main-constrainer main-max-width">

            <transition name="fade">
                <div v-if="copyToastVisible" class="copy-toast" role="status" aria-live="polite">
                    {{ t('info.link copied') }}
                </div>
            </transition>

            <div class="container" @click="openBookDetails">
                <div class="book-card">
                    <div class="cover">
                        <ErrorAwareImage 
                            :height="250" 
                            :width="166" 
                            :title="bookDetails ? bookDetails.title : ''" 
                            :author="authorsString" 
                            :description="''"
                            :doSrc="imgUrl"
                        />
                    </div>
                    <div class="title-container">
                        <div class="spacer"></div>
                        <div class="title-data">
                            <div class="title">
                                {{ bookDetails ? bookDetails.title : '' }}
                            </div>
                            <div class="subtitle">
                                <span class="pubdate">{{ pubdate }}</span>
                                <span class="authors">{{ authorsString }}</span>
                            </div>
                        </div>
                        <div class="actions">
                            <FontAwesomeIcon :icon="readIcon" @click="openBook" />
                            <div class="menu-wrapper">
                                <FontAwesomeIcon :icon="menuIcon" @click="toggleMenu" />
                                <ul class="kebab-menu" v-if="showMenu" @click.stop>
                                    <li @click="openBook">{{ t('book details.read now') }}</li>
                                    <li @click="copyLink">{{ t('book details.copy link') }}</li>
                                    <li @click="closeMenu">{{ t('book details.close menu') }}</li>
                                </ul>
                            </div>
                        </div>
                        
                    </div>
                    <div class="data-container">
                        <div class="spacer"></div>
                        <div class="title-data">
                            <div class="format flex-row  mt-1rem">
                                <label for="bookdetails-formats">
                                    <h2 class="mr-10">{{ t('book details.format') }}</h2>
                                </label>
                                <VueMultiselect id="bookdetails-formats" v-model="selectedFormat" :options="formats" label="name"  @select="formatChanged"/>
                            </div>
                            <h2 class="mr-10 mt-1rem">{{ t('book details.description') }}</h2>
                            <div class="description mt-10" v-safe-html="description">
                            </div>  
                            <h2 class="mt-20">{{ authorsObject.length == 1 ? t('book details.author') : t('book details.authors') }}</h2>
                            <HScrollable>
                                <LibraryCard v-for="el in authorsObject" cardType="author" :id="el.id.toString()" :name="el.name" orientation="vertical" :imgPath="el.cover_url" :basePath="el.base_path"/>
                            </HScrollable>
                        </div>  
                    </div>
                    
                    <div class="container-plugins" v-for="plugin in matchedPlugins">
                        <div class="title-data">
                            <div class="title">
                                Plugin {{ plugin.name }}
                            </div>
                        </div>
                        <div class="data-container">
                            <component :is="plugin.component" :data="dataForPlugins" />
                        </div>                              
                    </div>


                </div>            
            </div>
        </div>
    </main>
</template>

<script>

import { mapState } from 'pinia'
import { useLibrariesStore } from '../stores/libraries'

import { usePluginsStore } from '../stores/plugins';

import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'

import HScrollable from '../components/libraries/HScrollable.vue';
import LibraryCard from '@/components/libraries/LibraryCard.vue'
import ErrorAwareImage from '@/components/ErrorAwareImage.vue'

import VueMultiselect from '@/components/vue-multiselect'

import { useI18n } from 'vue-i18n';

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGlasses, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'

import { getImageUrl } from '@/utils/urlFn';
import { toastTTS } from '@/utils/tts';

import { defineAsyncComponent } from 'vue';

export default {
    name: 'BookDetailsView',
    data() {
        return {
            bookDetails: null,
            bookId: null,
            libraryId: null,
            coverPath: null,
            selectedFormat: null,
            showMenu: false,
            copyToastVisible: false,
            t: useI18n().t,
            librariesStore: useLibrariesStore(),
            readIcon: faGlasses,
            menuIcon: faEllipsisVertical,
            usePluginsStore: usePluginsStore()
        }
    },   
    props: {

    },
    watch: {

    },
    computed: {
        ...mapState(usePluginsStore, ['registeredPlugins']),
        matchedPlugins() {
            let plugins = [];
            for (let plugin of this.registeredPlugins) {
                console.log("plugin", plugin);
                for (let entrypoint of plugin.entrypoints) {
                    console.log("entrypoint", entrypoint);
                    if (entrypoint.position == 'book-details') {
                        let p = JSON.parse(JSON.stringify(plugin));
                        p.entrypoints = [];
                        p.component = defineAsyncComponent(() => import(`../plugins/${p.public_uuid}/${entrypoint.entrypoint}`));
                        plugins.push(p);
                    }
                }
            }
            return plugins;           
        },
        authorsObject() {
            return this.bookDetails ? this.bookDetails.authors : [];
        },
        authorsString() {
            let authors = this.bookDetails ? this.bookDetails.authors : [];
            return authors.map(author => author.name).join(", ");
        },
        formats() {
            return this.bookDetails ? this.bookDetails.formats : [];
        },
        pubdate() {
            let ts = this.selectedFormat ? this.selectedFormat.pubdate : "";
            let yearFromTs = new Date(ts).getFullYear();
            return yearFromTs;
        },
        description() {
            return this.bookDetails ? this.bookDetails.description : "";
        },
        imgUrl() {
            let path = this.bookDetails ? this.bookDetails.cover_url : '';
            console.log("path", path, getImageUrl(path));
            return getImageUrl(path);
        },
        dataForPlugins() {
            return {
                formats: this.formats,
                selectedFormat: this.selectedFormat,
                bookId: this.bookId,
                libraryId: this.libraryId,
                // Provide a callback for plugins to refresh the book details
                refreshBookDetails: this.refreshBookDetails,
            }
        },
        formatId() {
            return this.selectedFormat ? this.selectedFormat.id : null;
        }
    },
    methods: {
        formatChanged(format) {
            this.selectedFormat = format;
        },
        async refreshBookDetails() {
            try {
                // Re-fetch book details to get updated formats list
                const updatedBookDetails = await this.librariesStore.getBookDetails(this.bookId, this.libraryId);
                
                // Update local bookDetails with the returned data
                if (updatedBookDetails) {
                    this.bookDetails = updatedBookDetails;
                    
                    // If no format is selected or the selected format is no longer available, select the first one
                    if (this.bookDetails.formats && this.bookDetails.formats.length > 0) {
                        if (!this.selectedFormat || !this.bookDetails.formats.find(f => f.id === this.selectedFormat.id)) {
                            this.selectedFormat = this.bookDetails.formats[0];
                        }
                    }
                } else {
                    console.error("Failed to refresh book details: No data returned");
                }
            } catch (error) {
                console.error("Error refreshing book details:", error);
            }
        },
        openBook() {
            // Check if the selected format is EPUB
            if (!this.selectedFormat || this.selectedFormat.name.toUpperCase() !== 'EPUB') {
                toastTTS('error', 'Only EPUB format is supported for reading. Please select an EPUB format.');
                return;
            }
            this.$router.push({
                name: 'reader',
                params: { bookId: this.bookId, libraryId: this.libraryId, formatId: this.formatId, title: this.bookDetails.title },
                query: { returnTo: this.$route.fullPath }
            });
        },
        toggleMenu() {
            this.showMenu = !this.showMenu;
        },
        closeMenu() {
            this.showMenu = false;
        },
        copyLink() {
            try {
                let url = window.location.href;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url);
                } else {
                    // Fallback for insecure contexts or older browsers
                    const tempInput = document.createElement('input');
                    tempInput.style.position = 'fixed';
                    tempInput.style.opacity = '0';
                    tempInput.value = url;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                }
                this.closeMenu();
                this.showCopyToast();
            } catch (e) {
                console.error('Failed to copy link', e);
            }
            },
            outsideClickHandler(e) {
                // Close the menu if clicking outside of the menu wrapper
                const wrapper = this.$el.querySelector('.menu-wrapper');
                if (this.showMenu && wrapper && !wrapper.contains(e.target)) {
                    this.showMenu = false;
                }
            },
            showCopyToast() {
                this.copyToastVisible = true;
                clearTimeout(this._toastTimer);
                this._toastTimer = setTimeout(() => {
                    this.copyToastVisible = false;
                }, 2500);
        }
    },
    async mounted() {
        this.bookId = this.$route.params.bookId;
        this.libraryId = this.$route.params.libraryId;
        this.bookDetails = await this.librariesStore.getBookDetails(this.bookId, this.libraryId);
        this.selectedFormat = this.formats[0];


        await this.usePluginsStore.getRegisteredPlugins();

        // register outside click listener
        document.addEventListener('click', this.outsideClickHandler);
    },    
    beforeUnmount() {
        document.removeEventListener('click', this.outsideClickHandler);
    },

    components: {
        DashboardTopNavigation,
        HScrollable,
        LibraryCard,
    ErrorAwareImage,
        VueMultiselect,
        FontAwesomeIcon

    }
    
}

</script>

<style scoped>

@import '@/assets/css/containers.css';
@import '@/assets/css/paddings.css';

.main-constrainer {
    background-color: var(--topbar-bg-color);
}

.container {
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: center;
    margin-top: 4rem;
    width: 100%;
    margin-bottom: 4rem;
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
    background-color: var(--primary-bg-color);
    height: 6rem;    
    width: 100%;
}

.container-plugins {
    display: flex; 
    flex-direction: column;
    margin-top: 1.5rem;
}

.container-plugins .title-data {
    background-color: var(--primary-bg-color);
    height: 3rem;
    width: 100%;
}

.title-data {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: start;
    padding: 1rem;
    width: 100%;
}

.actions {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 100%;
    margin-right: 40px;
}

.actions svg {
    cursor: pointer;
    padding: 10px;
    font-size: 1.25rem;
}

.menu-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}
.kebab-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--primary-bg-color);
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    list-style: none;
    padding: 6px 0;
    margin: 4px 0 0 0;
    min-width: 160px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.kebab-menu li {
    padding: 8px 16px;
    cursor: pointer;
    font-size: 0.9rem;
    white-space: nowrap;
}
.kebab-menu li:hover {
    background: var(--secondary-bg-color, #f5f5f5);
}

.title-data .subtitle .authors {
    margin-left: 10px;
}

.data-container {
    display: flex;
    padding: 0rem;

}

.spacer {
    min-width: calc(2.5rem + 2.5rem + 250px);
}

.title {
    font-size: 1.5rem;
    font-weight: bold;
}

.mt-20 {
    margin-top: 20px;
}

.mr-5 {
    margin-right: 5px;
}
.mr-10 {
    margin-right: 10px;
}

/* Toast styles */
.copy-toast {
    position: fixed;
    top: 80px;
    right: 20px;
    background: var(--secondary-bg-color, #333);
    color: var(--primary-text-color, #fff);
    padding: 10px 16px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-size: 0.9rem;
    z-index: 2000;
    opacity: 0.95;
}
.fade-enter-active, .fade-leave-active { transition: opacity .3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>