<template>
    <div class="plugin-card row-card">
        <div class="row">
            <div class="open-link-button">
                <font-awesome-icon :icon="icons.open" @click="openUrl()" />
            </div>
            <div class="data-block">
                <h3>{{ pluginData.name }}</h3>
                <div class="dates">
                    <div>
                        <span>First registered:</span>
                        <span>{{ formatTsToDatetime(pluginData.meta.created) }}</span>
                    </div>
                    <div>
                        <span>Last ping:</span>
                        <span>{{ formatTsToDatetime(pluginData.meta.updated) }}</span>
                    </div>
                </div>
                <div class="tags">
                    <PluginTypeLabel :type="entrypoint.type" v-for="entrypoint in pluginData.entrypoints" />
                </div>
            </div>
            <div v-if="relativeEntryPointPath != null" class="config-button">
                <font-awesome-icon :icon="icons.config" @click="openConfig()" tabindex="0"/>
            </div>
        </div>
    </div>
    <VueFinalModal v-if="relativeEntryPointPath != null"
        v-model="showConfigModal"
        :teleport-to="'body'"
        class="flex justify-center items-center"
        :content-class="`p-4 bg-white rounded-lg space-y-2 ${fullyAccessibleClass}`"
        overlay-transition="vfm-fade"
        content-transition="vfm-fade"
        
        >
        <component :is="component" @close="closeConfigComponent" />
    </VueFinalModal>
</template>

<script>

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGear, faPowerOff } from '@fortawesome/free-solid-svg-icons'

import DeleteWithConfirm from '@/components/actions/DeleteWithConfirm.vue'

import PluginTypeLabel from '@/components/labels/PluginTypeLabel.vue'

import { formatDistanceToNow } from 'date-fns'

import { VueFinalModal } from 'vue-final-modal'

import { defineAsyncComponent } from 'vue'

import {createApp} from 'vue'
import axios from 'axios'

export default {
    name: 'RepositoryCard',
    data() {
        return {
            icons: {
                open: faPowerOff,
                config: faGear
            },
            showConfigModal: false
        }

    },   
    props: {
        pluginData: {
            type: Object,
            required: true
        }
    },
    
    
    computed: {
        relativeEntryPointPath() {
            
            let e = this.pluginData && this.pluginData.entrypoints ? this.pluginData.entrypoints.find(entrypoint => {
                if (entrypoint.type == 'settings') {
                    return entrypoint.entrypoint;
                }
            }) : null;
            return e ? e.entrypoint : null;
        },
        pluginPublicUuid() {
            return this.pluginData.public_uuid;
        },
        fullyAccessible() {
            return this.$route.meta.accessible == true;
        },
        fullyAccessibleClass() {
            return this.$route.meta.accessible == true ? 'full-page' : 'modal-content';
        },
        async htmlFromComponent() {
            return await axios.get(this.configEntryPoint);
        },
        component() {
            return defineAsyncComponent(() => import(`../../plugins/${this.pluginPublicUuid}/${this.relativeEntryPointPath}`));
        },
        

    },
    methods: {
        openConfig() {
            this.showConfigModal = true;

        },
        closeConfigComponent() {
            this.showConfigModal = false
        },
        formatTsToDatetime(ts) {
            if (!ts || isNaN(new Date(ts))) {
                return 'Never';
            }
            let date = new Date(ts);
            return date.toLocaleString();
        }
    },
    async mounted() {

    },    
    components: {
        FontAwesomeIcon,
        PluginTypeLabel,
        DeleteWithConfirm,
        VueFinalModal,
    }
    
}

</script>

<style>
.vue3-iframe,
.vue3-iframe div,
.vue3-iframe iframe {
    width: 100%;
    height: 100%;
}
</style>

<style scoped>

@import '@/assets/css/buttons.css';
@import '@/assets/css/accessibility.css';

.repository-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}
.row {
    display: flex;
    align-items: center;
    width: 100%;
}
.data-block {
    display: flex;
    flex-direction: column;
    margin-left: 10px;
    width: 100%;
}

.dates {
    display: flex;
    font-size: 14px;
}

.dates div:not(:last-child) {
    margin-right: 0.7rem;
}

.dates div span:last-child {
    margin-left: 0.25rem;
}

.url {
    font-size: 14px;
}

.open-link-button {
    margin-left: 0.6rem;
    margin-right: 0.6rem;
}

.delete-confirm-button {
    margin-right: 0.7rem;
}

.plugin-card {
    background-color: var(--secondary-bg-color);
    padding: 1rem;
    border-radius: 10px;
}

.plugin-card:not(:last-child) {
    margin-bottom: 1rem;
}

.plugin-card .tags {
    display: flex;
}

.plugin-card .tags > div {
    margin: 5px;
}
.config-button {
    font-size: 2rem;
    margin: 0 1rem;
    cursor: pointer;
}

</style>