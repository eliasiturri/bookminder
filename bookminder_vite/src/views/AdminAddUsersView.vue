<template>
    <main>
        <DashboardTopNavigation :title="t('newUser.header.add new user')"/>
        <div class="main-constrainer main-max-width">

        <div class="content-container">
            <div v-if="selectedView == 0">
                <h1>{{t('newUser.header.new username')}}</h1>
                <InputWithLabel :value="username" role="textbox" type="text" :placeholder="placeholders.username" label="User" labelColor="black" labelBackgroundColor="white" showLabel="never" :showClearIcon="false" @input="(value) => username = value"/>
                <Button class="button" :text="t('newUser.buttons.continue')" :icon="'faCaretRight'" iconPosition="right" iconFontSizePx="20" tabindex="0" @clicked="createUser()"/>
            </div>
            <div v-else-if="selectedView == 1">
                <h1>{{t('newUser.header.change library access')}}</h1>
                <LibraryAccess :libraries="globalLibraries" @change-access="changeAccess"/>
                <Button class="button" :text="t('newUser.buttons.finish')" :icon="'faFloppyDisk'" iconPosition="left" :enabled="true" @clicked="finish()"></Button>                
            </div>
            <div v-else-if="selectedView == 2">
                <h1>{{ t('newUser.header.token') }}</h1>
                <BorderCard class="border-card">
                    <p>{{ t('newUser.content.token') }}</p>
                    <div class="border-card">
                        <a class="reset-password-link" :href="accessUrl">{{ accessUrl }}</a>
                    </div>
                </BorderCard>
                <Button class="button" :text="t('newUser.buttons.close')" :icon="'faClose'" iconPosition="left" :enabled="true" @clicked="close()"></Button>                

            </div>            
        </div>
        </div>
    </main>
</template>

<script>

import { useUsersStore } from '@/stores/users'
import { useLibrariesStore } from '@/stores/libraries'

import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'

import InputWithLabel from '@/components/input/InputWithLabel.vue'

import Button from '@/components/actions/Button.vue'
import TabHeaderComponent from '@/components/TabHeaderComponent.vue'

import NewLibrary from '@/components/libraries/NewLibrary.vue'
import BorderCard from '@/components/containers/BorderCard.vue'
import LibraryAccess from '@/components/users/LibraryAccess.vue'

import { VueFinalModal } from 'vue-final-modal'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGear, faPowerOff } from '@fortawesome/free-solid-svg-icons'
import { mapState } from 'pinia'

import VueMultiselect from '@/components/vue-multiselect'

import { toastTTS } from "@/utils/tts";
import { useI18n } from 'vue-i18n'

export default {
    name: 'AdminAddUsersView',
    data() {
        return {
            selectedView: 0,
            username: '',
            globalLibraries: [],
            initialGlobalLibraries: [],
            accessUrl: '',
            placeholders: {
                username: 'Enter a new username',
                email: 'Enter a new email for the user',
            },
            usersStore: useUsersStore(),
            librariesStore: useLibrariesStore(),
            t: useI18n().t,
        }
    },   
    watch: {

    },
    
    computed: {
        fullyAccessible() {
            return this.$route.meta.accessible == true;
        },
        fullyAccessibleClass() {
            return this.$route.meta.accessible == true ? 'full-page' : '';
        },
    },
    methods: {
        async createUser() {
            if (this.username.trim() == '') {
                toastTTS('error', this.t('errors.empty username'));
                return;
            }
            let result = await this.usersStore.createUser(this.username, this.email);
            if (result.error) {
                console.log("error creating user");

            } else {

                let result = await this.librariesStore.getGlobalLibraries(this.username);
                this.initialGlobalLibraries = JSON.parse(JSON.stringify(result));
                this.globalLibraries = result;

                this.selectedView = 1;
            }
        },
        changeAccess(where, library_name) {
            let affectedGlobalLibraryIndex = this.globalLibraries.findIndex(library => library.library_name == library_name);
            if (where == 'see') {
                this.globalLibraries[affectedGlobalLibraryIndex].see_enabled = this.globalLibraries[affectedGlobalLibraryIndex].see_enabled == 1 ? 0 : 1;
            } else if (where == 'delete') {
                this.globalLibraries[affectedGlobalLibraryIndex].delete_enabled = this.globalLibraries[affectedGlobalLibraryIndex].delete_enabled == 1 ? 0 : 1;
            }
        },       
        async finish() {
            await this.librariesStore.saveGlobalLibrariesAccess(this.username, this.globalLibraries);
            let result = await this.usersStore.getUserAccessUrl(this.username);
            this.accessUrl = result.url;
            this.selectedView = 2;
        },
        close() {
            this.$router.push({ name: 'home' });
        }
    },
    async mounted() {

    },    
    components: {
        InputWithLabel,
        DashboardTopNavigation,
        TabHeaderComponent,
        Button,
        VueFinalModal,
        NewLibrary,
        FontAwesomeIcon,
        VueMultiselect,
        LibraryAccess,
        BorderCard,
    }
    
}

</script>

<style scoped>

@import '@/assets/css/containers.css';
@import '@/assets/css/inputs.css';
@import '@/assets/css/buttons.css';
@import '@/assets/css/paddings.css';

.libraries-container {
    display: ruby;
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

.user-select {
    width: 300px;
}

.content-container {
    max-width: 900px;
}
.button {
    margin-top: 20px;
    max-width: 200px;
}

.mt-20 {
    margin-top: 20px;
}

.border-card {
    display: flex;
    flex-direction: column;
    font-size: 1rem;
    margin-left: 0;
}

.italics {
    font-style: italic;
}

.reset-password-link {
    text-wrap: wrap;
    overflow-wrap: anywhere;
}

.mb-1rem {
    margin-bottom: 1rem;
}
</style>