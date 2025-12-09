<template>
    <main>    
        <DashboardTopNavigation :title="t('nav.head.upload')"/>
        <div class="main-constrainer main-max-width">

            <div class="container" v-if="view == 'select'">
                <h1>{{ t('nav.head.select a library') }}</h1>
                <div class="flex-row library-selects filter-container-margin-bottom-lg">
                    <div class="flex-col">

                        <label for="library-select">{{ t('formLabels.select a library') }}</label>
                        <VueMultiselect id="library-select" v-model="selectedLibrary" :options="myLibraries" :allowEmpty="false" label="name" :placeholder="t('formLabels.select a library')" />
                    </div>
                    <div class="flex-col" v-if="false">
                        <label for="folder-select">{{ t('formLabels.select a library') }}</label>                    
                        <VueMultiselect id="folder-select" v-model="selectedPath" :disabled="!selectedLibrary" :allowEmpty="false"  :options="selectedLibrary ? selectedLibrary.paths : []" :placeholder="t('formLabels.select a library')" />
                    </div>
                </div>
                <FileUploader :type="whatIdx == 0 ? 'files' : 'directories'" :isEnabled="!!selectedLibrary" @dropDone="dropDone"/>
            </div>

            <div class="container" v-else-if="view == 'review'">
                <h1>{{ t('nav.head.file list') }}</h1>
                <div class="grid-container">

                    <div class="file" v-for="file, idx in files">
                        {{file.name}} - {{bytesToMegabytes(file.size)}}Mb - {{ idx >= lastUploaded ? `${t('status.waiting')}` : `${t('status.done')}` }}
                    </div>
                </div>
                <div class="buttons-container">
                    <Button :text="t('buttons.upload files')" class="button" icon="faUpload" tabindex="1000" @clicked="upload()" />
                </div>
            </div>
        </div>
    </main>
</template>

<script>
import { mapState } from 'pinia'
import { useUsersStore } from '@/stores/users'
import { useLibrariesStore } from '@/stores/libraries'
import { useFilesStore } from '@/stores/files'

import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'

import Button from '@/components/actions/Button.vue'
import TabHeaderComponent from '@/components/TabHeaderComponent.vue'

import NewLibrary from '@/components/libraries/NewLibrary.vue'

import LibraryAccess from '@/components/users/LibraryAccess.vue'

import { VueFinalModal } from 'vue-final-modal'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import VueMultiselect from 'vue-multiselect'

import { useI18n } from 'vue-i18n'

import FileUploader from '@/components/utils/FileUploader.vue'

import { v4 as uuidv4 } from 'uuid'
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

import { toastTTS } from '@/utils/tts'

export default {
    name: 'UploadView',
    data() {
        return {
            view: 'select',
            whatIdx: 0,
            selectedLibrary: null,
            selectedPath: null,
            files: [],
            lastUploaded: -1,
            whatTabs: [
                {
                    name: 'files',
                    text: 'Files'
                },
                {
                    name: 'directories',
                    text: 'Directories'
                }
            ],
            usersStore: useUsersStore(),
            librariesStore: useLibrariesStore(),
            filesStore: useFilesStore(),
            t: useI18n().t,
            i18n: useI18n(),
        }
    },   
    watch: {
        selectedUser: {
            handler: function (val) {
                if (val) {
                    this.fetchData();
                }
            },
            deep: true
        },
        selectedLibrary: {
            handler: function (val) {
                if (val) {
                    // Use the library name as the path, not a subfolder
                    this.selectedPath = '';
                } else {
                    this.selectedPath = null;
                }
            },
            deep: true
        }
    },
    
    computed: {
        ...mapState(useLibrariesStore, ['myLibraries']),
        avatarPath() {
            if (Object.keys(this.settings).length === 0) {
                return new URL('@/assets/images/placeholders/avatar.png', import.meta.url).href;
            } else {
                if (this.settings.setting_value.avatar_path) {
                    return new URL(this.settings.setting_value.avatar_path, import.meta.url).href;
                } else if (this.settings.setting_fallback_value.avatar_path) {
                    return new URL(this.settings.setting_fallback_value.avatar_path, import.meta.url).href;
                }
                else {
                    return new URL('@/assets/images/placeholders/avatar.png', import.meta.url).href;
                }
            }
        },
        fullyAccessible() {
            return this.$route.meta.accessible == true;
        },
        fullyAccessibleClass() {
            return this.$route.meta.accessible == true ? 'full-page' : '';
        },
    },
    methods: {
        selectTab(idx) {
            this.selectedTabIdx = idx;
        },
        addUser() {
            this.$router.push({ name: 'admin-add-user' });
        },
        changeAccess(where, library_name) {
            let affectedGlobalLibraryIndex = this.globalLibraries.findIndex(library => library.library_name == library_name);

            if (where == 'see') {
                this.globalLibraries[affectedGlobalLibraryIndex].see_enabled = this.globalLibraries[affectedGlobalLibraryIndex].see_enabled == 1 ? 0 : 1;
            } else if (where == 'delete') {
                this.globalLibraries[affectedGlobalLibraryIndex].delete_enabled = this.globalLibraries[affectedGlobalLibraryIndex].delete_enabled == 1 ? 0 : 1;
            }
            this.checkForChanges();
        },
        async saveGlobalLibrariesChanges() {
            let changedLibraries = [];
            this.globalLibraries.forEach(library => {
                if (JSON.stringify(library) != JSON.stringify(this.initialGlobalLibraries.find(l => l.library_name == library.library_name))) {
                    changedLibraries.push(library);
                }
            });
            await this.librariesStore.saveGlobalLibrariesAccess(this.selectedUser.username, changedLibraries);
            this.fetchData();
        },
        checkForChanges() {
            let changed = JSON.stringify(this.globalLibraries) != JSON.stringify(this.initialGlobalLibraries);
            this.thereAreGlobalLibrariesChanges = changed;
        },
        async fetchData() {
            //this.userLibraries = await this.store.getUserLibraries(this.selectedUser.username);
            let result = await this.librariesStore.getGlobalLibraries(this.selectedUser.username);
            this.initialGlobalLibraries = JSON.parse(JSON.stringify(result));
            this.globalLibraries = result;
            this.checkForChanges();
        },
        async dropDone(files) {
            if (this.selectedLibrary == null) {
                toastTTS('error', this.t('nav.head.select a library'));
                return;
            }

            this.files = files;
            this.view = 'review';
        },
        async upload() {
            
            if (!this.selectedLibrary) {
                toastTTS('error', 'Please select a library');
                return;
            }

            const self = this;
            const callback = function() {

                self.lastUploaded++;
            }
            await this.filesStore.uploadFiles(this.selectedLibrary.id, this.files, callback);
            this.$router.push({ name: 'home' });
        },
        bytesToMegabytes(bytes) {
            try {
                bytes = parseInt(bytes);
                return (bytes / 1024 / 1024).toFixed(2).toString();
            } catch (e) {
                return "?";
            }

        }
    },
    async mounted() {
        await this.librariesStore.getMyLibraries();
    },    
    components: {
        DashboardTopNavigation,
        TabHeaderComponent,
        Button,
        VueFinalModal,
        NewLibrary,
        FontAwesomeIcon,
        VueMultiselect,
        LibraryAccess,
        FileUploader,
    }
    
}

</script>

<style>
body {
    max-height: 100vh;
}
</style>

<style scoped>

@import '@/assets/css/containers.css';
@import '@/assets/css/inputs.css';
@import '@/assets/css/buttons.css';
@import '@/assets/css/paddings.css';
@import '@/assets/css/multiselect.css';

.container {
    max-height: 100%;
    display: flex;
    flex-direction: column;    
    width: 100%;
    height: 100%;
}

.library-selects {
    flex-flow: nowrap;
    gap: 1rem;
}


.library-selects .flex-col {
    width: 100%;
    min-width: 400px;
}

.profile-header-container {
    display: flex;
    flex-direction: row;
}

.profile-header-left,
.profile-header-right {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 20px;
}
.profile-header-right {
    align-items: start;
    justify-content: center;
}

.drop-zone-container {
    max-height: 70vh;
}

div.file {
    max-width: 400px;
    overflow-wrap: break-word;
    padding: 0.5rem;
    background-color: var(--secondary-bg-color);
    border-radius: 5px;
}

.buttons-container {
    display: flex;
    align-items: end;
    justify-content: center;
    margin-top: 2rem;
    height: 100%;
}

.buttons-container .button {
    max-width: 300px;
}

.main-constrainer,
.grid-container {
    flex: 1;
}

.grid-container {
    /*overflow-y: auto;*/
}

.main-constrainer {
    max-height: -webkit-fill-available;
}
</style>