<template>
<div class="browser-container">
    <div class="flex-row flex-align-center">    
        <h2 v-if="!fullyAccessible">Folder Browser</h2>
        <h1 v-else>Folder Browser</h1>
    </div>

    <div class="selected-folder flex-column">
        <div class="label">Selected Folder</div>
        <div class="content scroll-container-h">{{ usedPath }}</div>
    </div>

    <div class="scroll-container browser-box">
        <div class="folder row" v-for="folder in computedFolders" @click="folderClick(folder)">
            <span class="name">{{ folder.name }} {{ folder.name == '..' ? goUpPath : '' }}</span>
            <span v-if="folder.hasSubfolders != null" class="has-children" :class="folder.hasSubfolders ? 'blue' : 'orange'">{{ folder.hasSubfolders ? 'has subfolders' : 'final' }}</span>
        </div>
    </div>

    <div tabindex="0" class="button-row full-width-button button-margin-bottom flex-justify-center flex-align-center" @click="select">
        <FontAwesomeIcon :icon="saveIcon" />
        <span>Select this path</span>
    </div>     
    <div tabindex="0" class="button-row full-width-button button-margin-bottom flex-justify-center flex-align-center" @click="newFolder">
        <FontAwesomeIcon :icon="saveIcon" />
        <span>Create new folder</span>
    </div>       
    <div tabindex="0" class="button-row full-width-button flex-justify-center flex-align-center" @click="close">
        <FontAwesomeIcon :icon="closeIcon" />
        <span>Close without selecting</span>
    </div>       
</div>

        <VueFinalModal
            v-model="newFolderModal"
            :teleport-to="'body'"
            class="new-folder-modal flex justify-center items-center"
            :content-class="`modal-content p-4 bg-white rounded-lg space-y-2 ${fullyAccessibleClass}`"
            overlay-transition="vfm-fade"
            content-transition="vfm-fade"
            >
            <h1>Create a new folder</h1>
            <input-with-label class="mt-20" @input="(value) => newFolderName = value" :value="newFolderName" label="Folder Name" placeholder="Type a name for your new folder" :showClearIcon="true" orientation="vertical" showLabel="force" />
            <div class="button-row mt-20 full-width-button flex-justify-center flex-align-center" @click="close">
                <FontAwesomeIcon :icon="closeIcon" />
                <span tabindex="0" @click="newFolder">Create folder</span>
            </div> 
        </VueFinalModal>

</template>

<script>

import { mapState } from 'pinia'

import { VueFinalModal } from 'vue-final-modal'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faPlus, faCirclePlus, faFloppyDisk, faListUl, faClose } from '@fortawesome/free-solid-svg-icons'

import InputWithLabel from '@/components/input/InputWithLabel.vue'
import { useLibrariesStore } from '@/stores/libraries'

export default {
    name: 'FolderBrowser',
    data() {
        return {
            folders: [],
            usedPath: '/',
            pathStack: [],
            newFolderName: '',
            newFolderModal: false,
            store: useLibrariesStore()
        }
    },   
    props: {
        path: {
            type: String,
            default: '',
            required: false
        },
        libraryType: {
            type: String,
            default: null
        }
    },
    
    computed: {
        computedFolders() {
            if (this.pathStack.length == 0) {
                return this.folders;
            } else {
                let tempFolders = JSON.parse(JSON.stringify(this.folders));
                tempFolders.unshift({name: '..', hasSubfolders: null, relativePath: this.usedPath});
                return tempFolders;
            }
        },
        goUpPath() {
            return this.pathStack.length > 1 ? this.pathStack[this.pathStack.length - 2] : '';
        }
    },
    emits: ['close', 'select'],
    methods: {
        async folderClick(folder) {
            console.log("folder clicked", folder);
            if (folder.name == '..') {
                
                // if the stack len is greater than 1, remove two elements, else remove one
                if (this.pathStack.length > 1) {
                    this.pathStack.pop();
                    this.pathStack.pop();
                } else {
                    this.pathStack.pop();
                }

                this.folders = await this.store.getFolders(this.libraryType, this.goUpPath);
                this.usedPath = this.getUsedPath(this.goUpPath, false, false);
                return;
            }

            if (folder.hasSubfolders) {
                this.usedPath = this.getUsedPath(folder.relativePath, true, true);
                this.folders = await this.store.getFolders(this.libraryType, this.usedPath);

                return;
            } 
            this.usedPath = this.getUsedPath(folder.relativePath);
            
        },
        getUsedPath(path, hasSubfolders, addToStack = true) {
            if (addToStack && hasSubfolders) {
                this.pathStack.push(path);
            }
            return this.pathJoin(this.pathStack) == '' ? '/' : this.pathJoin(this.pathStack);
        },
        pathJoin(parts){
            var separator = '/';
            var replace   = new RegExp(separator+'{1,}', 'g');
            return parts.join(separator).replace(replace, separator);
        },
        select() {
            this.$emit('select', this.usedPath);
        },
        async newFolder() {
            if (!this.newFolderModal) {
                this.newFolderName = '';
                this.newFolderModal = true;
                return;
            }
            this.folders = await this.store.newFolder(this.libraryType, this.usedPath, this.newFolderName);
            this.folders = await this.store.getFolders(this.libraryType, this.path);
            this.newFolderModal = false;
        },
        close() {
            this.$emit('close');
        }
    },
    async mounted() {
        this.folders = await this.store.getFolders(this.libraryType, this.path);
        this.usedPath = this.getUsedPath(this.path);
    },    
    components: {
        FontAwesomeIcon,
        InputWithLabel,
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

.new-folder-modal .vfm__content{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    height: min-content;
}
</style>

<style scoped>
@import '@/assets/css/inputs.css';
@import '@/assets/css/buttons.css';
@import '@/assets/css/paddings.css';
@import '@/assets/css/containers.css';
@import '@/assets/css/accessibility.css';



.browser-container {
    display: flex;
    flex-direction: column;    
    height: 100%;
    padding: 2rem;
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

.selected-folder .content {
    font-size: 1.2rem;
    font-weight: bold;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 0.5rem;
    background-color: azure;
}

.browser-box {
    font-size: 1.2rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 0.5rem;
    background-color: azure;
}

.browser-box .folder {
    cursor: pointer;
    padding: 0.5rem;
    border-bottom: 1px solid #ccc;
}

.browser-box .folder:hover {
    background-color: #f0f0f0;
}

.browser-box .folder .has-children {
    margin-left: 1rem;
    font-size: 12px;
    border: 1px solid;
    border-radius: 5px;    
    padding: 0.2rem;
}

.blue {
    color: white;
    background-color: blue;
}

.orange {
    color: white;
    background-color: orange;
}

.mt-20 {
    margin-top: 10px;
}


</style>