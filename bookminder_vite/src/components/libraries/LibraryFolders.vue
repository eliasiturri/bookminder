<template>

<div class="folders-config-container">
    <div class="flex-row flex-align-center">    
        <h2 v-if="!fullyAccessible">Folders</h2>
        <h1 v-else>Folders</h1>
        <FontAwesomeIcon :icon="addCircle" @click="addNewFolder" class="add-icon" />
    </div>

    <div class="scroll-container">
        <div v-for="folder in libraryData.folders">
            <div class="folder-row" v-if="!folder.removed">
                <span class="name">{{ folder.path }}</span>
                <span class="remove-folder-button" @click="removeFolder(folder.path)">
                    <FontAwesomeIcon :icon="closeIcon" />
                </span>
            </div>
        </div>
    </div>

    <VueFinalModal
        v-model="showBrowser"
        :teleport-to="'body'"
        class="flex justify-center items-center"
        :content-class="`modal-content p-4 bg-white rounded-lg space-y-2 ${fullyAccessibleClass}`"
        overlay-transition="vfm-fade"
        content-transition="vfm-fade"
        >
        <FolderBrowser @close="showBrowser = false" :libraryType="libraryType" @select="selectFolder"/>
    </VueFinalModal>

</div>

</template>

<script>

import { mapState } from 'pinia'

import { VueFinalModal } from 'vue-final-modal'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCirclePlus, faFloppyDisk, faListUl, faClose } from '@fortawesome/free-solid-svg-icons'

import InputWithLabel from '@/components/input/InputWithLabel.vue'
import { useLibrariesStore } from '@/stores/libraries'

import FolderBrowser from '@/components/libraries/FolderBrowser.vue'

export default {
    name: 'LibraryFolders',
    data() {
        return {

            libraryData: {
                name: '',
                description: '',
                url: '',
                type: 'other',
                configEntryPoint: null,
                folders: []
            },
            saveIcon: faFloppyDisk,
            closeIcon: faClose,
            addCircle: faCirclePlus,
            configData: {
                host: "",
                port: "",
                username: "",
                password: "",
            },  
            tabs: [
                {
                    name: 'Email Server Configuration',
                },
                {
                    name: 'Email List',
                }
            ],   
            selectedTabIdx: 0,
            store: useLibrariesStore(),
            showBrowser: false
        }
    },   
    props: {
        data: {
            type: Object,
            default: null
        },
        libraryType: {
            type: String,
            default: null
        },
    },
    
    computed: {
        headerName() {
            return this.libraryData.name.length > 0 ? this.libraryData.name : this.headerText;
        }

    },
    emits: ['close', 'folders-changed'],
    methods: {
        addNewFolder() {
            console.log('add new folder');
            this.showBrowser = true;
        },
        selectFolder(path) {
            console.log('selected folder', path);
            this.libraryData.folders.push({
                path: path,
                isNew: true,
                removed: false
            });
            this.$emit('folders-changed', this.libraryData.folders);
            this.showBrowser = false;
        },      
        removeFolder(path) {
            console.log('remove folder', path);
            for (let i = 0; i < this.libraryData.folders.length; i++) {
                if (this.libraryData.folders[i].path == path) {
                    this.libraryData.folders[i].removed = true;
                    break;
                }
            }
            this.$emit('folders-changed', this.libraryData.folders);
        },    
        saveData() {
            console.log('save data');
            this.store.saveData("e71581bb-6fc7-472e-896a-d974bc9b3c04", this.data);
        },
        colorPicked(color, idx) {
            console.log('color picked', color, idx);
            this.data[idx].color = color;
        },
        selectTab(idx) {
            console.log("received emit with index: ", idx)
            this.selectedTabIdx = idx;
        },
        fullyAccessible() {
            return this.$route.meta.accessible == true;
        },
        fullyAccessibleClass() {
            return this.$route.meta.accessible == true ? 'full-page' : '';
        },
        closeConfig() {
            this.$emit('close');
        }
    },
    async mounted() {
        if (this.data == null) {
            return;
        }
        this.libraryData = this.data;
    },    
    components: {
        FontAwesomeIcon,
        InputWithLabel,
        FolderBrowser,
        VueFinalModal
    }
    
}

</script>

<style>

.vfm {
    display: flex;
    align-items: center;
    justify-content: center;
}

.vfm__container {
    display: flex;
    justify-content: center;
    align-items: center;
    
}

.modal-content {
    width: 600px;
    height: 600px;
    background-color: white;
}

.full-page {
    width: 100%;
    height: 100%;
    background-color: white;

}
</style>

<style scoped>
@import '@/assets/css/inputs.css';
@import '@/assets/css/buttons.css';
@import '@/assets/css/paddings.css';
@import '@/assets/css/containers.css';
@import '@/assets/css/accessibility.css';

.folders-config-container {
    display: flex;
    flex-direction: column;    
    height: 100%;
}

.row {
    display: flex;
    align-items: center;
    width: 100%;
    margin-bottom: 1rem;
}

.button-row span {
    margin-left: 0.5rem;
}

.button-margin-bottom {
    margin-bottom: 0.4rem;
}

.add-icon {
    margin-left: 0.6rem;
    cursor: pointer;
    font-size: 1.6rem;
}

.folder-row {
    display: flex;
    justify-content: space-between;
    cursor: pointer;
    padding: 0.5rem;
    border-bottom: 1px solid #ccc;
}

.folder-row:hover {
    background-color: #f0f0f0;
}    


.remove-folder-button {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: pointer;
    color: red;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid red;
}

.remove-folder-button:hover {
    background-color: red;
    color: white;
}

.scroll-container {
    overflow-y: auto !important;
    max-height: 100% !important;
}
</style>