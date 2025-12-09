<template>
    <div class="locale-changer">
        <label v-if="inputsAccessible" :for="labelUuid">{{ t('formLabels.select your language') }}</label>
        <VueMultiselect class="max-w-400px" :id="labelUuid" name="language" v-model="selectedLanguage" :options="languages" label="name"  @select="languageChanged" :tabIndex="tabIndex" aria-expanded="true"/>
    </div>
</template>

<script>
import VueMultiselect from '@/components/vue-multiselect'

import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

import { useI18n } from 'vue-i18n';

import {v4 as uuidv4} from 'uuid';


export default {
    name: 'locale-changer',
    data () {
        return { 
            labelUuid: uuidv4(),
            t: useI18n().t,
            i18n: useI18n(), 
            selectedLanguage: null,
            languages: [
                {
                    name: useI18n().t('languages.english'),
                    code: "en"
                }, 
                {
                    name: useI18n().t('languages.spanish'),
                    code: "es"
                },
                {
                    name: useI18n().t('languages.swedish'),
                    code: "sv"
                }
            ], 
            settingsStore: useSettingsStore(),
            t: useI18n().t
        }
    },
    props: {
        detectBrowserLanguage: {
            type: Boolean,
            default: false
        },
        tabIndex: {
            type: Number,
            default: 10
        }
    },
    computed: {
        ...mapState(useSettingsStore, ['settings']),
        inputsAccessible() {
            return this.settingsStore.accessibility.inputsAccessible;
        },
        availableLanguages() {
            return Object.keys(this.i18n.messages)
        }
    },
    methods: {
        languageChanged(selectedOption, id) {           
            this.settingsStore.language = selectedOption.code;
            this.i18n.locale = selectedOption.code;
        }
    },
    watch: {
        settingsStore: {
            handler: function (val) {
                this.i18n.locale = val.language;
            },
            immediate: true
        }
    },
    mounted() {

        let userLanguage = this.settingsStore.language || 'en';
        
        if (this.detectBrowserLanguage) {
            userLanguage = navigator.language || navigator.userLanguage; 
            if (userLanguage) {
                userLanguage = userLanguage.split('-')[0];

                let lang = this.languages.find(lang => lang.code === userLanguage);
                if (lang) {
                    this.languageChanged(lang);
                } else {
                    userLanguage = 'en';
                }
            } else {
                userLanguage = 'en';
            }
        }
        this.selectedLanguage = this.languages.find(lang => lang.code === userLanguage);
    },
    components: {
        VueMultiselect
    }
}
</script>