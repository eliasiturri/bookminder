<template>
    <main>
        <DashboardTopNavigation :title="'Plugins'"/>
        <div class="main-constrainer main-max-width">

            <H2PlusAdd :header="headerText" :showAction="selectedTabIdx == 2" class="content-subheader"/>

            <FilterComponent :placeholder="filterPlaceholder" :value="filterText" @filter="filter" class="filter-input filter-container-margin-bottom"/>

            <div class="repositories" v-if="selectedTabIdx == 2">
                <RepositoryCard v-for="repo in filteredRepositories" :id="repo.id.toString()" :name="repo.name" :url="repo.url" :added="repo.added_ts.toString()" :lastChecked="repo.last_checked_ts.toString()"/>
            </div>
            <div class="installed-plugins" v-if="selectedTabIdx == 0">
                <InstalledPluginCard v-for="plugin in registeredPluginsFiltered" 
                    :pluginData="plugin"
                    />
            </div>            
        </div>

    </main>
</template>

<script>

import { mapState } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import { usePluginsStore } from '../stores/plugins'
import { defineAsyncComponent } from 'vue'

import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'
import TabHeaderComponent from '@/components/TabHeaderComponent.vue'
import H2PlusAdd from '@/components/navigation/H2PlusAdd.vue'

import FilterComponent from '@/components/FilterComponent.vue'
import RepositoryCard from '@/components/plugins/RepositoryCard.vue'
import InstalledPluginCard from '@/components/plugins/InstalledPluginCard.vue'

import VueMultiselect from '@/components/vue-multiselect'
import { formatDistanceToNow } from 'date-fns'

export default {
    name: 'PluginsView',
    data() {
        return {
            selectedPlugin: null,
            query: 'against intellectual monopoly',
            requestsStore: useRequestsStore(),
            pluginsStore: usePluginsStore(),
            tabbedEntries: [
                { name: "Installed Plugins" },
                { name: "Plugin Catalog" },
            ],
            selectedTabIdx: 0,
            filterPlaceholderTexts: {
                catalog: "Filter by plugin name, description or category",
                repositories: "Filter by repository name or URL"
            },
            headerTexts: {
                plugins: "Installed Plugins",
                catalog: "Plugin Catalog",
                repositories: "Repositories"
            },
            filterText: ""
        }
    },   
    
    computed: {
        ...mapState(useRequestsStore, ['requestsPage']),
        ...mapState(usePluginsStore, ['registeredPlugins', 'pluginLocations', 'allData']),
        tabbedPlugins() {
            let tabs = [{}];
        },
        filteredRepositories() {
                return this.allData.repositories.filter(repo => {
                    if (this.filterText == "") return true;
                    let r = repo.name.includes(this.filterText) || repo.url.includes(this.filterText);
                    return r;
                });
        },
        filterPlaceholder() {
            if (this.selectedTabIdx == 1 || this.selectedTabIdx == 0) return this.filterPlaceholderTexts.catalog;
            if (this.selectedTabIdx == 2) return this.filterPlaceholderTexts.repositories;
        },
        headerText() {
            if (this.selectedTabIdx == 1) return this.headerTexts.catalog;
            if (this.selectedTabIdx == 0) return this.headerTexts.plugins;
            if (this.selectedTabIdx == 2) return this.headerTexts.repositories;
        },
        registeredPluginsFiltered() {
            return this.registeredPlugins.filter(plugin => {
                if (this.filterText == "") { return true };
                plugin.entrypoints.forEach(ep => {
                    if (ep.type.includes(this.filterText) || ep.description.includes(this.filteredText)) {
                        return true;
                    };
                });
                if (plugin.name.includes(this.filterText) || plugin.description.includes(this.filterText)) {
                    return true;
                }
                return false;
            });
        },
    },
    methods: {
        getPluginName(id) {
            return this.registeredPlugins.find(plugin => plugin.id == id).name;
        },
        getReadableTimeAgoFromTs(ts) {
            const date = new Date(ts);
            return formatDistanceToNow(date, { addSuffix: true });
        },
        selectTab(idx) {
            this.selectedTabIdx = idx;
        },
        filter(text) {
            this.filterText = text;

        }
    },
    async mounted() {
        //await this.requestsStore.getRequests(20, 1);
        await this.pluginsStore.getRegisteredPlugins();
    },    
    components: {
        VueMultiselect,
        DashboardTopNavigation,
        TabHeaderComponent,
        FilterComponent,
        RepositoryCard,
        InstalledPluginCard,
        H2PlusAdd
    }
    
}

</script>

<style scoped>

@import '@/assets/css/cards.css';
@import '@/assets/css/inputs.css';
@import '@/assets/css/paddings.css';

.main-container {
    width: 100%;
    height: 100%;
}

.installed-plugins {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 1rem;

}

.plugin-card {
    background-color: var(--secondary-bg-color);
}

.plugins-sidebar {
    display: flex;
}
.repositories, .content-subheader {
    margin-top: 1.5rem;
}
.filter-input {
    margin-top: 0.7rem;
}
</style>