<template>
    <SideBar v-if="!$route.meta.noSidebar"/>
    <RouterView />
    <ModalsContainer />
</template>

<script>
import { RouterLink, RouterView } from 'vue-router'
import SideBar from './components/SideBar.vue'

import { mapState } from 'pinia'
import { useSettingsStore } from './stores/settings'

import { toRaw } from 'vue'

import { ModalsContainer } from 'vue-final-modal'

import emitter from 'tiny-emitter/instance'


export default {
    name: 'App',
    data() {
        return {

        };
    },   
    computed: {
        ...mapState(useSettingsStore, ['theme', 'selectedTheme']),
    },
    watch: {
        theme: {
            handler: 'updateCSSVariables',
            deep: true
        },
        selectedTheme: 'updateCSSVariables'
    },
    methods: {
        updateCSSVariables() {
            const themeData = toRaw(this.theme[this.selectedTheme]);
            for (let [key, value] of Object.entries(themeData)) {
                key = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
                document.documentElement.style.setProperty(`--${key}`, value);
                document.documentElement.style.setProperty(`--${key}-alpha-80-percent`, value + '80');
                document.documentElement.style.setProperty(`--${key}-alpha-60-percent`, value + '60');
                document.documentElement.style.setProperty(`--${key}-alpha-40-percent`, value + '40');

            }
        }
    },
    async mounted() {
        this.updateCSSVariables();     
        emitter.on('settings-changed', () => {
            console.log("received settings-changed");
            this.updateCSSVariables();
        })
        window.addEventListener('storage', () => {
            console.log("received localStorage");
            useSettingsStore().reloadStateFromStorage();
            //this.updateCSSVariables();
        })
    },    
    components: {
        SideBar,
        RouterView,
        ModalsContainer        
    }
}

</script>

<style>

</style>

<style scoped>

</style>
