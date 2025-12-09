<template>
    <main>
        <DashboardTopNavigation :title="t('nav.head.search')" />
        <div class="main-constrainer main-max-width">
            <h1>{{ t('nav.head.search with') }} {{ selectedPlugin ? selectedPlugin.name : '' }}</h1>
            <VueMultiselect v-model="selectedPlugin" :options="typeSearchPlugins" :searchable="false"
                :allow-empty="false" label="name" class="mb-20" />
            <component  v-if="selectedPlugin && relativeEntryPointPath && component" :is="component" />
        </div>
    </main>
</template>

<script>

import { mapState } from 'pinia'
import { usePluginsStore } from '../stores/plugins'
import { defineAsyncComponent } from 'vue'
import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'

import VueMultiselect from '@/components/vue-multiselect'

import { useI18n } from 'vue-i18n'

export default {
    name: 'SearchView',
    data() {
        return {
            selectedPlugin: null,
            query: 'against intellectual monopoly',
            pluginsStore: usePluginsStore(),
            searchComponent: null,
            t: useI18n().t,

        }
    },
    watch: {
        selectedPlugin() {
            this.searchComponent = defineAsyncComponent(() => import(`../plugins/${this.selectedPlugin.entryPoint}`))
        }
    },
    computed: {
        ...mapState(usePluginsStore, ['registeredPlugins']),
        typeSearchPlugins() {
            let searchPlugins = [];
            if (this.registeredPlugins) {
                this.registeredPlugins.forEach(plugin => {
                    if (plugin.entrypoints) {
                        plugin.entrypoints.forEach(entrypoint => {
                            if (entrypoint.type == 'search') {
                                searchPlugins.push(plugin);
                            }
                        });
                    }
                });
            }
            return searchPlugins;
        },
        relativeEntryPointPath() {
            let e = this.selectedPlugin && this.selectedPlugin.entrypoints ? this.selectedPlugin.entrypoints.find(entrypoint => {
                if (entrypoint.type == 'search') {
                    return entrypoint.entrypoint;
                }
            }) : null;
            return e ? e.entrypoint : null;
        },
        component() {
            let path = `../plugins/${this.selectedPlugin.public_uuid}/${this.relativeEntryPointPath}`;
            console.log(path)
            return defineAsyncComponent(() => import(path));
        },
    },
    methods: {

    },
    async mounted() {
        await this.pluginsStore.getRegisteredPlugins();
        this.selectedPlugin = this.typeSearchPlugins[0];
    },
    components: {
        VueMultiselect,
        DashboardTopNavigation
    }

}

</script>

<style>
@import "vue-multiselect/dist/vue-multiselect.css";

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
</style>

<style scoped>

@import '@/assets/css/paddings.css';

.book-search-result {
    display: flex;
    margin-bottom: 1rem;
}

.action {
    background-color: #007bff;
    color: white;
    padding: 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    width: min-content;
}
</style>