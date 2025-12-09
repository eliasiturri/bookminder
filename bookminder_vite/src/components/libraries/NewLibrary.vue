<template>

<div class="component-config-container">


    <div v-if="libraryData.uuid">
        <h2 v-if="!fullyAccessible">Editing library '{{ libraryData.name }}'</h2>
        <h1 v-else>Editing library '{{ libraryData.name }}'</h1>
    </div>
    <div v-else>
        <h2 v-if="!fullyAccessible">Add new library</h2>
        <h1 v-else>Add new library</h1>
    </div>

    <div class="new-library-config">
        <div class="row">
            <InputWithLabel @input="(value) => libraryData.name = value" label="Display Name" placeholder="Type a name for your library" :value="libraryData.name" :showClearIcon="true" orientation="vertical" showLabel="force" />
        </div>
        <div class="row">
            <InputWithLabel @input="(value) => libraryData.description = value" label="Short Description" placeholder="Type a short description for your library" :value="libraryData.description" :showClearIcon="true" orientation="vertical" showLabel="force" />
        </div>
        <div class="row">
            <label>Cover Image</label>
            <input type="file" accept="image/*" @change="onCoverSelected" />
        </div>
        <div class="row">
            <label>Library Type</label>
            <VueMultiselect v-model="selectedLibraryType" label="name" :disabled="lockSelectedLibraryType" :options="libaryTypes" :show-labels="false" @input="value => selectedLibraryType = value" />
        </div>
    </div>

    <!--LibraryFolders v-if="selectedLibraryType" @foldersChanged="foldersChanged" :libraryType="selectedLibraryType.value" :data="data"/-->
    <div class="button-column">
        <div class="button-row full-width-button button-margin-bottom flex-justify-center flex-align-center" @click="saveData()">
            <FontAwesomeIcon :icon="icons.saveIcon" />
            <span>Save changes</span>
        </div>     

        <div v-if="libraryData.uuid" class="button-row full-width-button button-margin-bottom flex-justify-center flex-align-center" @click="deleteLibrary()">
            <FontAwesomeIcon :icon="icons.trash" />
            <span>Delete library</span>
        </div>     

        <div class="button-row full-width-button flex-justify-center flex-align-center" @click="closeConfig()">
            <FontAwesomeIcon :icon="icons.closeIcon" />
            <span>Close</span>
        </div>     
    </div>   
</div>

</template>

<script>

import { mapState } from 'pinia'

import { VueFinalModal } from 'vue-final-modal'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faPlus, faFloppyDisk, faListUl, faClose, faTrash } from '@fortawesome/free-solid-svg-icons'

import InputWithLabel from '@/components/input/InputWithLabel.vue'
import { useLibrariesStore } from '@/stores/libraries'

import VueMultiselect from '@/components/vue-multiselect'

import LibraryFolders from '@/components/libraries/LibraryFolders.vue'

import { toast } from "vue3-toastify";


export default {
    name: 'NewLibrary',
    data() {
        return {
            coverFile: null,
            selectedLibraryType: null,
            lockSelectedLibraryType: false,
            libaryTypes: [
                { name: 'Global Library', id: 1, value: 'global' },
                { name: 'User Library', id: 2, value: 'user' }
            ],
            libraryData: {
                uuid: null,
                name: '',
                description: '',
                folders: [],
                type: 'user'
            },
            icons: {
                addCircle: faPlus,
                saveIcon: faFloppyDisk,
                closeIcon: faClose,
                trash: faTrash,
            },
            store: useLibrariesStore()
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
        data: {
            handler: function(val) {
                if (val != null) {
                    console.log("val is", val);
                    this.libraryData.uuid = val.uuid;
                    this.libraryData.name = val.name;
                    this.libraryData.description = val.description;
                    this.libraryData.folders = val.folders;
                    this.libraryData.type = val.type;
                }
            },
            deep: true
        },
        libraryType: {
            handler: function(val) {
                if (val) {
                    this.selectedLibraryType = this.libaryTypes.find((type) => type.value === val);
                    this.lockSelectedLibraryType = true;
                }
            },
            immediate: true
        }

    },
    emits: ['close', 'updated'],
    methods: {
        foldersChanged(folders) {
            this.libraryData.folders = folders;
        },
        onCoverSelected(e) {
            const files = e.target.files;
            this.coverFile = files && files[0] ? files[0] : null;
        },
        async saveData() {
            let libraryType = this.selectedLibraryType ? this.selectedLibraryType.value : null;
            if (!libraryType) {
                toast.error("Please select a library type");
                return;
            }
            if (this.libraryData.uuid != null) {
                await this.store.editLibrary(null, libraryType, this.libraryData.uuid, this.libraryData.name, this.libraryData.description, this.libraryData.folders);
                if (this.coverFile) {
                    await this.store.uploadLibraryCover(this.libraryData.uuid, this.coverFile);
                }
            } else {
                const resp = await this.store.saveLibrary(null, libraryType, this.libraryData.name, this.libraryData.description, this.libraryData.folders);
                // If backend returns uuid, optionally upload cover
                if (resp && resp.uuid && this.coverFile) {
                    await this.store.uploadLibraryCover(resp.uuid, this.coverFile);
                }
            }        
            this.$emit('updated');
            this.$emit('close');
        },
        async deleteLibrary() {
            await this.store.deleteGlobalLibrary(null, this.data.uuid);
            this.$emit('updated');
            this.$emit('close');
        },
        closeConfig() {
            this.$emit('close');
        }
    },
    async mounted() {
        // If libraryType prop is provided, pre-select and lock it
        if (this.libraryType) {
            this.selectedLibraryType = this.libaryTypes.find((type) => type.value === this.libraryType);
            this.lockSelectedLibraryType = true;
        }
        
        if (this.data != null) {
            this.libraryData.uuid = this.data.uuid;
            this.libraryData.name = this.data.name;
            this.libraryData.description = this.data.description;
            this.libraryData.folders = this.data.folders;
            this.libraryData.type = this.data.type;
            
            // If libraryType prop wasn't provided, use the data type
            if (!this.libraryType) {
                this.selectedLibraryType = this.libaryTypes.find((type) => type.value == this.data.type);
                this.lockSelectedLibraryType = true;
            }
        }
        console.log("this.data", this.data);
    },    
    components: {
        FontAwesomeIcon,
        InputWithLabel,
        LibraryFolders,
        VueMultiselect
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

.component-config-container {
    display: flex;
    flex-direction: column;    
    padding: 20px 30px;
    height: -webkit-fill-available;
}

.button-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: end;
    width: 100%;
    height: -webkit-fill-available;
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
</style>