<template>
    <main>
        <DashboardTopNavigation :title="libraryType == 'global' ? t('nav.head.global libraries') : t('nav.head.user libraries')"/>
        <div class="main-constrainer main-max-width">

            <div class="content-container">
                <div class="button-row mb-1rem flex-wrap">
                    <Button :text="t('buttons.scan all libraries')" :icon="'faLinesLeaning'" iconPosition="left" ></Button>
                    <Button :text="t('buttons.add library')" :icon="'faPlus'" iconPosition="left" @clicked="addLibrary()"></Button>
                    <Button :text="t('buttons.help')" :icon="'faQuestion'" iconPosition="left" ></Button>
                </div>

                <div class="libraries-container">
                    <LibraryCardAdmin v-for="library in libraries" :library="library" :name="library.name" :imgPath="library.image_path" :type="libraryType" @open-config="openLibrary(library)" />
                </div>
            </div>
            <VueFinalModal
                v-model="showConfigModal"
                :teleport-to="'body'"
                class="flex justify-center items-center"
                :content-class="`modal-content p-4 bg-white rounded-lg space-y-2 ${fullyAccessibleClass}`"
                overlay-transition="vfm-fade"
                content-transition="vfm-fade"
                >
                <NewLibrary :data="selectedLibraryData" :libraryType="libraryType" @close="showConfigModal = false" @updated="fetchLibraries"/>
            </VueFinalModal>
        </div>            
    </main>
</template>

<script>

import { useLibrariesStore } from '@/stores/libraries'

import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'
import InputWithLabel from '@/components/input/InputWithLabel.vue'
import Button from '@/components/actions/Button.vue'

import LibraryCardAdmin from '@/components/libraries/LibraryCardAdmin.vue'

import NewLibrary from '@/components/libraries/NewLibrary.vue'

import { VueFinalModal } from 'vue-final-modal'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGear, faPowerOff } from '@fortawesome/free-solid-svg-icons'
import { mapState } from 'pinia'

import { useI18n } from 'vue-i18n'

export default {
    name: 'AdminLibrariesView',
    data() {
        return {
            libraries: [],
            libraryType: null,
            username: 'user',
            password: 'password',
            //librariesStore: useLibrariesStore(),
            placeholders: {
                username: 'Enter your username',
                password: 'Enter your password'
            },
            showConfigModal: false,
            selectedLibraryData: null,
            
            store: useLibrariesStore(),
            t: useI18n().t,
        }
    },   
    
    computed: {
        fullyAccessible() {
            return this.$route.meta.accessible == true;
        },
        fullyAccessibleClass() {
            return this.$route.meta.accessible == true ? 'full-page' : '';
        },
    },
    watch: {
        '$route.params.libraryType': {
            handler: function (val) {
                this.libraryType = val;
                if (this.libraryType == 'global') {
                    this.store.getGlobalLibraries(null, true).then((data) => {
                        this.libraries = data;
                    });
                } else {
                    this.store.getUserLibraries(null, true).then((data) => {
                        this.libraries = data;
                    });
                }
            },
            immediate: true
        }
    },
    methods: {
        addLibrary() {
            this.selectedLibraryData = null;
             this.showConfigModal = true;
        },

        openLibrary(library) {
           let temp = JSON.parse(JSON.stringify(library));
           temp['type'] = this.libraryType;
           // Normalize field names: backend returns different names for global vs user libraries
           temp.uuid = temp.uuid || library.uuid;
           temp.name = temp.name || library.library_name;
           temp.description = temp.description || library.library_description;
           const folders = Array.isArray(temp.folders) ? temp.folders : [];
           temp.folders = folders.map(f => ({
                path: f,
                isNew: false,
                removed: false,
            }));
           this.selectedLibraryData = temp;
           this.showConfigModal = true;
        },
        openConfig(library) {
            this.selectedLibraryData = library;
            this.showConfigModal = true;
        },
        fetchLibraries() {
            if (this.libraryType == 'global') {
                this.store.getGlobalLibraries(null, true).then((data) => {
                    this.libraries = data;
                });
            } else {
                this.store.getUserLibraries(null, true).then((data) => {
                    this.libraries = data;
                });
            }
        }
    },
    async mounted() {


        // get the libraryType param from the route
        this.libraryType = this.$route.params.libraryType;
        if (this.libraryType == 'global') {
            this.libraries = await this.store.getGlobalLibraries(null, true);
        } else {
            this.libraries = await this.store.getUserLibraries(null, true);
        }
    },    
    components: {
        InputWithLabel,
        DashboardTopNavigation,
        Button,
        VueFinalModal,
        NewLibrary,
        FontAwesomeIcon,
        LibraryCardAdmin
    }
    
}

</script>

<style scoped>

@import '@/assets/css/containers.css';
@import '@/assets/css/inputs.css';
@import '@/assets/css/buttons.css';
@import '@/assets/css/paddings.css';

.libraries-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.library-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 300px;
    background-color: white;
    border-radius: 10px;
    margin: 10px;
    padding: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
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