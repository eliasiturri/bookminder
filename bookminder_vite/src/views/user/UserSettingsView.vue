<template>
    <main>
        <DashboardTopNavigation :title="t('nav.head.settings')" v-if="isWelcome != true" />
        <div class="main-constrainer main-max-width" :class="isWelcome ? 'welcome' : ''">

            <h1 class="h1" :class="isWelcome ? 'welcome' : ''" v-if="isWelcome == true">{{ t('settings.header.stablish your preferences') }}</h1>
            <h1 class="h1" v-else>{{ t('nav.head.settings') }}</h1>

            <div class="content-container" :class="isWelcome ? 'welcome' : ''">

                <div class="section-block selected-theme">
                    <h2 class="mt-20">{{ t('settings.header.language') }}</h2>
                    <div class="grid-container">
                        <LanguageSwitcher class="max-w-300px" :detectBrowserLanguage="isWelcome" :tabindex="0" />
                    </div>
                </div>

                <div class="section-block selected-theme mt-20">
                    <h2 class="mt-20">{{ t('settings.header.accessibility') }}</h2>
                    <div class="col-configuration-container grid-container accessibility">
                        <div class="toggle-block mt-20" v-for="el in accessibilityProperties">
                            <Toggle :id="el" :enabled="settingsStore.accessibility[el] == true ? 1 : 0" @toggle="accessibilityToggle"  />
                            <span>{{ t(`accessibility.${el}`) }}</span>
                        </div>
                    </div>
                </div>

                <div class="section-block selected-theme mt-20">
                    <h2 class="mt-20">{{ t('accessibility.errorAccessible') }}</h2>
                    <div class="grid-container">
                        <div class="col">
                            <label for="close-toast-after">
                                {{ t('accessibility.closeToastAfter') }}
                            </label>                    
                            <VueMultiselect id="close-toast-after" class="max-w-300px vms-contrast"  v-model="selectedCloseToastAfter" :options="closeToastOptions" :custom-label="customLabel" @select="selectedCloseToast" :tabindex="0"  />
                        </div>    
                        <div class=" col toggle-block" >
                            <Toggle :id="'speak-toast-aloud'" :enabled="errorAccessibility.speakToastAloud ? 1 : 0" @toggle="speakToastToggle"  />
                            <span>{{ t('accessibility.speakToastAloud') }}</span>
                        </div>
                        
                    </div>   

                </div>            

                <div class="section-block selected-theme  mt-20" v-if="isWelcome != true" >
                    <h2 class="mt-20">{{ t('settings.header.display options') }}</h2>
                    <div class="grid-container">

                        <div class="col">
                            <label for="max-continue-reading">
                                {{ t('settings.select.max continue reading') }}
                            </label>                    
                            <VueMultiselect id="max-continue-reading" class="max-w-300px"  v-model="selectedMaxContinueReadingValue" :options="homeDisplayOptions" :custom-label="customLabel" @select="selectedMaxContinueReading" :tabindex="0"  />
                        </div>       

                        <div class="col" >
                            <label for="max-recently-added">
                                {{ t('settings.select.max recently added') }}
                            </label>                    
                            <VueMultiselect id="max-recently-added" class="max-w-300px"  v-model="selectedMaxRecentlyAddedValue" :options="homeDisplayOptions" :custom-label="customLabel" @select="selectedMaxRecentlyAdded" :tabindex="0"  />
                        </div>    
                    </div>
                </div>     

                <div class="section-block selected-theme  mt-20">
                    <h2 class="mt-20">{{ t('settings.header.display theme') }}</h2>
                    <div class="grid-container">
                        <div class="col" >
                            <label for="display-theme">
                                {{ t('settings.select.select a theme') }}
                            </label>  
                            <VueMultiselect id="display-theme" class="max-w-300px"  v-model="selectedTheme" :options="availableThemes" @select="selectedThemeChanged" :tabindex="0"  />
                        </div>
                    </div>
                </div>  
                <div class="section-block" v-if="isWelcome != true" >
                    <h2 class="mt-20">{{ t('settings.header.theme configuration') }}</h2>
                    <div class="theme-configuration-container">
                        <div class="theme-colors" v-for="(themeValue, themeKey) in theme">
                            <h2>{{ getThemeTitle(themeKey) }}</h2>

                            <div class="color" v-for="(value, key) in themeValue">
                                <ColorPicker format="hex" shape="circle" v-model:pureColor="theme[themeKey][key]" :tabindex="0"  />
                                <span>{{ getThemeDescription(key) }}</span>
                            </div>
                            <div class="centered-button-container mt-20">
                                <Button :id="themeKey" :text="t('buttons.restore defaults')" :icon="'faBolt'" iconPosition="left" @clicked="restoreThemeDefaults" ></Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="section-block selected-theme" v-if="isWelcome == true" >
                    <h1 class="h1" :class="isWelcome ? 'welcome' : ''" v-if="isWelcome == true">{{ t('settings.header.set up a password') }}</h1>
                    <div class="password-input mt-20">
                        <InputWithLabel :value="password1" role="textbox" type="password" :placeholder="t('formLabels.password1')" :label="t('formLabels.password1')" labelColor="black" labelBackgroundColor="white" showLabel="force" :showClearIcon="false" :showShowPasswordIcon="true" :id="'password1'" @input="passwordChanged" :tabindex="0" />
                    </div>
                    <div class="password-input mt-20">
                        <InputWithLabel :value="password2" role="textbox" type="password" :placeholder="t('formLabels.password2')" :label="t('formLabels.password2')" labelColor="black" labelBackgroundColor="white" showLabel="force" :showClearIcon="false" :showShowPasswordIcon="true" :id="'password2'" @input="passwordChanged" :tabindex="0" />
                    </div>

                </div>


            </div>
        </div>
    </main>
</template>

<script>
import { mapState } from 'pinia'
import { mapWritableState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { useUsersStore } from '@/stores/users'
import { useLibrariesStore } from '@/stores/libraries'

import {ColorPicker} from "vue3-colorpicker/index.es.js";
import "vue3-colorpicker/style.css";

import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'

import Toggle from '@/components/input/Toggle.vue'
import Button from '@/components/actions/Button.vue'
import TabHeaderComponent from '@/components/TabHeaderComponent.vue'

import NewLibrary from '@/components/libraries/NewLibrary.vue'

import LibraryAccess from '@/components/users/LibraryAccess.vue'

import { VueFinalModal } from 'vue-final-modal'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import VueMultiselect from '@/components/vue-multiselect'

import { useI18n } from 'vue-i18n'
import InputWithLabel from '@/components/input/InputWithLabel.vue';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher.vue'

import emitter from 'tiny-emitter/instance'

export default {
    name: 'UserSettingsView',
    data() {
        return {
            usersStore: useUsersStore(),
            settingsStore: useSettingsStore(),
            closeToastOptions: [
                {
                    name: [3 , 'accessibility.toast.seconds'],
                    value: 3000
                },
                {
                    name: [5 , 'accessibility.toast.seconds'],
                    value: 5000
                },
                {
                    name: [8 , 'accessibility.toast.seconds'],
                    value: 8000
                },
                {
                    name: [10 , 'accessibility.toast.seconds'],
                    value: 10000
                },
                {
                    name: [15 , 'accessibility.toast.seconds'],
                    value: 15000
                },                
                {
                    name: [20 , 'accessibility.toast.seconds'],
                    value: 20000
                },
                {
                    name: [25 , 'accessibility.toast.seconds'],
                    value: 25000
                },
                {
                    name: [30 , 'accessibility.toast.seconds'],
                    value: 30000
                },
                {
                    name: [60 , 'accessibility.toast.seconds'],
                    value: 60000
                },  
                {
                    name: 'accessibility.toast.never',
                    value: false
                },                              
            ],
            homeDisplayOptions: [
                {
                    name: [4, 'settings.select.books'],
                    value: 4
                },
                {
                    name: [8, 'settings.select.books'],
                    value: 8
                },
                {
                    name: [12, 'settings.select.books'],
                    value: 12
                },
                {
                    name: [16, 'settings.select.books'],
                    value: 16
                },
                {
                    name: [20, 'settings.select.books'],
                    value: 20
                },
                {
                    name: [24, 'settings.select.books'],
                    value: 24
                },
                {
                    name: [28, 'settings.select.books'],
                    value: 28
                },
                {
                    name: [32, 'settings.select.books'],
                    value: 32
                },
                {
                    name: [36, 'settings.select.books'],
                    value: 36
                },
                {
                    name: [40, 'settings.select.books'],
                    value: 40
                },
                {
                    name: [44, 'settings.select.books'],
                    value: 44
                },
                {
                    name: [48, 'settings.select.books'],
                    value: 48
                },
                {
                    name: [52, 'settings.select.books'],
                    value: 52
                },
                {
                    name: [56, 'settings.select.books'],
                    value: 56
                },
                {
                    name: [60, 'settings.select.books'],
                    value: 60
                }
            ],
            selectedCloseToastAfter: null,
            selectedMaxContinueReadingValue: null,
            selectedMaxRecentlyAddedValue: null,
            t: useI18n().t,
            i18n: useI18n(),
            password1: '',
            password2: '',
        }
    },   
    props: {
        noTopBar: {
            type: Boolean,
            default: false
        },
        isWelcome: {
            type: Boolean,
            default: false
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
        theme: {
            handler: function (val) {
                emitter.emit('settings-changed');
            },
            deep: true
        },
        selectedTheme: {
            handler: function (val) {
                emitter.emit('settings-changed');
            },
            deep: true
        },


    },
    
    computed: {
        ...mapState(useSettingsStore, ['accessibilityProperties']),
        ...mapWritableState(useSettingsStore, ['theme', 'themeDescription', 'selectedTheme', 'errorAccessibility']), 
        availableThemes() {
            return Object.keys(this.theme);
        }, 

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
    },
    emits: ['password-changed'],
    methods: {
        getTabIndex() {
            this.lastTabIndex += 1;
            return this.lastTabIndex;
        },            
        accessibilityToggle(id, value) {
            value = value == 1 ? true : false;
            if (id == 'fullyAccessible' && value == true) {
                for (let key in this.settingsStore.accessibilityProperties) {
                    key = this.settingsStore.accessibilityProperties[key];
                    this.settingsStore.setAccessibilityProperty(key, value);
                }
            } else if (id != 'fullyAccessible' && this.settingsStore.accessibility.fullyAccessible == true && value == false) {
                this.settingsStore.setAccessibilityProperty('fullyAccessible', false);
                this.settingsStore.setAccessibilityProperty(id, false);
            }
            else {
                this.settingsStore.setAccessibilityProperty(id, value);
            }
        },
        speakToastToggle(id, value) {
            value = value == 1 ? true : false;
            this.settingsStore.errorAccessibility.speakToastAloud = value;
        },
        restoreThemeDefaults(themeKey) {
            this.settingsStore.restoreThemeDefaults(themeKey);
        },


        getThemeTitle(value) {
            return this.themeDescription.titles[value];
        },
        getThemeDescription(value) {
            return this.t('settings.colors.' + this.themeDescription.colors[value]);
        },
        selectedThemeChanged(selectedOption) {
            this.settingsStore.selectedTheme = selectedOption;
        },
        selectedCloseToastChanged(selectedOption) {
            this.settingsStore.errorAccessibility.closeToastAfter = selectedOption.value;
        },
        selectedMaxContinueReading(selectedOption) {
            this.settingsStore.homeDisplay.maxContinueReading = selectedOption.value;
            this.selectedMaxContinueReadingValue = selectedOption;
        },
        selectedMaxRecentlyAdded(selectedOption) {
            this.settingsStore.homeDisplay.maxRecentlyAdded = selectedOption.value;
            this.selectedMaxRecentlyAddedValue = selectedOption;
        },
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
        customLabel({name, value}) {
            if (name != undefined) {
                if (typeof(name) == 'object') {
                    return name[0] + ' ' + this.t(name[1]);
                } else {
                    return this.t(name);
                }
            }
        },
        selectedCloseToast(value) {
            this.selectedCloseToastAfter = value;
            this.settingsStore.errorAccessibility.closeToastAfter = value.value;
        },
        passwordChanged(value, which) {
            if (which == "password1") {
                this.$emit('password-changed', "password1", value);
            } else if (which == "password2") {
                this.$emit('password-changed', "password2", value);
            }
        },
    },
    created() {
        this.lastTabIndex = 110;
    },
    async mounted() {
        //this.lastTabIndex = 1000;
        let toastValue = this.settingsStore.errorAccessibility.closeToastAfter;
        this.selectedCloseToastAfter = this.closeToastOptions.find(option => option.value == toastValue);
        let maxContinueReading = this.settingsStore.homeDisplay.maxContinueReading;
        this.selectedMaxContinueReadingValue = this.homeDisplayOptions.find(option => option.value == maxContinueReading);
        let maxRecentlyAdded = this.settingsStore.homeDisplay.maxRecentlyAdded;
        this.selectedMaxRecentlyAddedValue = this.homeDisplayOptions.find(option => option.value == maxRecentlyAdded);

        if (this.isWelcome != true) {
            this.users = await this.usersStore.getUsers();
        }
        
        //await this.settingsStore.getSettings();
    },    
    components: {
        DashboardTopNavigation,
        ColorPicker,
        TabHeaderComponent,
        Button,
        VueFinalModal,
        NewLibrary,
        FontAwesomeIcon,
        VueMultiselect,
        LibraryAccess,
        Toggle,
        InputWithLabel,
        LanguageSwitcher
    }
    
}

</script>

<style>
.welcome .password-input .input-container {
    width: 400px;
    max-width: 400px;
}
</style>

<style scoped>

@import '@/assets/css/containers.css';
@import '@/assets/css/inputs.css';
@import '@/assets/css/buttons.css';
@import '@/assets/css/paddings.css';

.welcome.h1 {
    margin-top: 2rem;
    display: flex;
    justify-content: center;    
}

.welcome.content-container {
    display: flex;
    justify-content: start;
    width: 100%;
    max-width: 800px;
}

.welcome.main-constrainer {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 0;
    width: -webkit-fill-available;

}

.theme-configuration-container {
    display: inline-flex;
    flex-direction: row;
    justify-content: center;
    align-items: start;
    flex-flow: wrap;
}

.col {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: start;
    height: 100%;
}

.col.toggle-block {
    height: 40px;
}

.col-configuration-container .toggle-block span {
    white-space: nowrap;
}

.theme-colors {
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: start;
    margin: 20px;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 10px;
}

.theme-colors h2 {
    margin-bottom: 10px;
}

.theme-colors .color {
    margin-bottom: 8px;
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

.toggle-block {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.toggle-block span {
    margin-left: 10px;
}

.mt-20 {
    margin-top: 20px;
}

.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    align-items: end;
}

.welcome .grid-container {
    display: flex;
    flex-wrap: wrap;
    
}

.welcome .grid-container .col {
    width: 100%;
}

.welcome .button-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 4rem;
    margin-bottom: 4rem;
}

.welcome .button-container div {
    width: 200px;
    max-width: 200px;
}

.welcome .password-input .outer-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
}


</style>