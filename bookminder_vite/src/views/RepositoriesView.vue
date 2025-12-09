<template>
    <div class="main-container">
        <DashboardTopNavigation :title="'Repositories'"/>
        <div class="top-actions">
            <span>Add Repository</span>
            <font-awesome-icon :icon="icons.faCirclePlus" />
            <span class="top-action-button">Help</span>
        </div>
        {{ repositories }}
    </div>
</template>

<script>

import { mapState } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import { usePluginsStore } from '../stores/plugins'
import { defineAsyncComponent } from 'vue'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons'

import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'

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
            icons: {
                faCirclePlus: faCirclePlus
            }

        }
    },   
    
    computed: {
        ...mapState(useRequestsStore, ['requestsPage']),
        ...mapState(usePluginsStore, ['registeredPlugins', 'pluginLocations', 'repositories']),
        tabbedPlugins() {
            let tabs = [{}];
        }

    },
    methods: {
        getPluginName(id) {
            return this.registeredPlugins.find(plugin => plugin.id == id).name;
        },
        getReadableTimeAgoFromTs(ts) {
            const date = new Date(ts);
            return formatDistanceToNow(date, { addSuffix: true });
        },
    },
    async mounted() {
        await this.pluginsStore.getRepositories();
    },    
    components: {
        VueMultiselect,
        DashboardTopNavigation,
        FontAwesomeIcon
        
    }
    
}

</script>

<style scoped>
.main-container {
    width: 100%;
}
</style>