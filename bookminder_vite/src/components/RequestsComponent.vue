<template>

    <TabHeaderComponent :tabs="tabbedPlugins" :selectedTabIdx="selectedTabIdx" @tab-selected="selectTab"/>
    <div class="requests-component" v-if="selectedTabIdx == 0">
        <h2>Naming</h2>

        <div>
            <VueMultiselect
                v-model="selectedNamingPattern"
                :options="namingPatterns"
                :searchable="false"
                :allow-empty="false"            
                label="name"
            />
        </div>
        {{ resultingFilename }}

        <h2>
            <span>Operations</span>
            <font-awesome-icon :icon="icons.faPlus" @click="copyOperations.push({ action: 'copy', source: '', destination: '' })" />
        </h2>
        <div>
            <div v-for="operation, idx in copyOperations" :key="idx">
                <div class="operation-row">
                    <div class="operation">
                        <VueMultiselect
                            v-model="operation.action"
                            :options="actions"
                            :searchable="false"
                            :allow-empty="false"            
                            label="label"
                        />
                    </div>
                    <div class="operation">
                        <VueMultiselect
                            v-model="operation.destination"
                            :options="destinationFolders"
                            :searchable="false"
                            :allow-empty="false"            
                            label="name"
                        />
                    </div>
                    <font-awesome-icon :icon="icons.faXmark" @click="deleteOperation(idx)" />
                </div>
            </div>
        </div>   
    </div>       
    <div v-for="plugin, idx in tabbedPlugins">
        <component :is="plugin.component" :data="data" :customData="customData" :class="[selectedTabIdx  == idx ? '' : 'hidden']"/>
    </div>


</template>

<script>

import { mapState } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import { usePluginsStore } from '../stores/plugins'
import { defineAsyncComponent } from 'vue'

import VueMultiselect from '@/components/vue-multiselect'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons'

import TabHeaderComponent from '@/components/TabHeaderComponent.vue'

export default {
    name: 'RequestsComponent',
    data() {
        return {
            requestsStore: useRequestsStore(),
            pluginsStore: usePluginsStore(),
            selectedTabIdx: 0,
            selectedComponent: null,
            loadedComponents: [null],
            copyOperations: [
                {
                    action: 'copy',
                    source: '',
                    destination: '',
                }
            ],
            actions: [
                {
                    name: 'copy',
                    label: 'Copy',
                    icon: 'faCopy',
                    action: 'copy',
                    source: '',
                    destination: '',
                },
                {
                    name: 'move',
                    label: 'Move',
                    icon: 'faArrowRight',
                    action: 'move',
                    source: '',
                    destination: '',
                },
            ],
            selectedNamingPattern: '',
            resultingFilename: '',
            icons: {
                faPlus: faPlus,
                faXmark: faXmark
            }
        }
    },   
    props: {
        data: {
            type: Object,
            required: false,
            default: {}
        },
        customData: {
            type: Object,
            required: false,
            default: {}
        }
    },
    
    computed: {
        ...mapState(useRequestsStore, ['requestsPage', 'destinationFolders', 'namingPatterns']),
        ...mapState(usePluginsStore, ['registeredPlugins', 'pluginLocations']),
        tabbedPlugins() {
            let tabs = [{
                name: 'Destination'
            }];
            this.pluginLocations.requestActions.forEach((uuid) => {
                let plugin = this.registeredPlugins.find(plugin => plugin.uuid == uuid);
                if (plugin) {
                    let component = defineAsyncComponent(() => import(`../plugins/${plugin.uuid}/${plugin.entryPoints.requestActions}`));
                    plugin.component = component;
                    tabs.push(plugin);
                }
            })
            return tabs;
        }
    },
    watch: {
        data: {
            handler() {
                this.applyNamingPattern();
            },
            deep: true
        },
        selectedNamingPattern: {
            handler() {
                this.applyNamingPattern();
            },
            deep: true
        }
    },
    methods: {
        selectTab(idx) {
            console.log("received emit with index: ", idx)
            this.selectedTabIdx = idx;
        },
        selectDefaultNamingPattern() {
            this.namingPatterns.forEach(pattern => {
                if (pattern.default) {
                    this.selectedNamingPattern = pattern;
                }
            });
        },
        applyNamingPattern() {
            let tempFilename = this.selectedNamingPattern.pattern;
            // extract variables like "{variable}" from the pattern, replace tempFilename with the actual values from the data prop, or "unknown" if the value is not present
            let matches = tempFilename.match(/{[a-zA-Z0-9_]+}/g);
            matches.forEach(match => {
                let variable = match.replace(/{|}/g, '');
                tempFilename = tempFilename.replace(match, this.data[variable] ? this.data[variable] : 'unknown');
            });
            if (this.data.extension)
                tempFilename += '.' + this.data.extension.toLowerCase();
            this.resultingFilename = tempFilename;
        },
        deleteOperation(idx) {
            if (this.copyOperations.length > 1) {
                this.copyOperations.splice(idx, 1);
            }
        },
        async request() {
            let filename = this.resultingFilename;
            let operations = [];
            this.copyOperations.forEach(operation => {
                operations.push({
                    action: operation.action.action,
                    destination: operation.destination.path
                });
            });
            let source = this.customData.source;
            let plugin = this.customData.plugin;
            let coverUrl = this.data.cover_url;
            let title = this.data.title;
            await this.requestsStore.saveRequest(plugin, source, filename, operations, coverUrl, title);
        }
    },
    async mounted() {
        await this.requestsStore.getDestinationFolders();
        await this.requestsStore.getNamingPatterns();
        this.selectDefaultNamingPattern();
        this.applyNamingPattern();
        console.log("data passed to the requests component", this.data);
    },    
    components: {
        VueMultiselect,
        FontAwesomeIcon,
        TabHeaderComponent
    }
    
}

</script>


<style scoped>
.requests-component {
    display: flex;
    flex-direction: column;
    padding: 10px;
}
.operation-row {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    margin: 10px 0;
}
.operation {
    display: flex;
    flex-direction: column;
    width: 100%;
}
.operation:not(:last-child) {
    margin-right: 10px;
}
.hidden {
    display: none;
}
</style>