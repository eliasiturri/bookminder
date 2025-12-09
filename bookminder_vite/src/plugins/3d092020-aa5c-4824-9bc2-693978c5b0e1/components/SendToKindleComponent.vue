<template>
    <div class="container">
        <div class="row">
            <label for="sendtokindle-format" >Format</label>
            <VueMultiselect id="sendtokindle-format" class="ms1  vms-contrast" v-model="selectedFormat" :options="data.formats" label="name"  />
            <label for="sendtokindle-email" >Email</label>
            <VueMultiselect id="sendtokindle-email" class="ms2  vms-contrast" v-model="selectedDestination" :options="formattedDestinations" label="name"  />
            <Button class="plugin-button" @clicked="sendToKindle" text="Send" icon="faPaperPlane" />
        </div>
    </div>
</template>

<script>

import VueMultiselect from '@/components/vue-multiselect'

import { mapState } from 'pinia'
import { useSendToKindleStore } from '../stores/sendToKindle'

import Button from '@/components/actions/Button.vue'
import { toastTTS } from '@/utils/tts'

export default {
    name: 'SendToKindle',
    data() {
        return {
            pluginData: {
                pluginUuid: 'e71581bb-6fc7-472e-896a-d974bc9b3c04',
                
            },
            selectedFormat: null,
            selectedDestination: null,
            store: useSendToKindleStore()
        }
    },   
    props: {
        data: {
            type: Object,
            required: false
        }
    },
    computed: {
        ...mapState(useSendToKindleStore, ['destinations']),
        formattedDestinations() {
            return this.destinations.map(d => {
                return {
                    name: `${d.alias} (${d.email})`,
                    email: d.email,
                    value: d.uuid
                }
            })
        }
    },
    methods: {
        formatChanged(value) {
            this.selectedFormat = value;
        },
        sendToKindle() {
            if (!this.selectedFormat) {
                toastTTS('error', 'Please select a format');
                return;
            }
            if (!this.selectedDestination) {
                toastTTS('error', 'Please select a destination email');
                return;
            }
            
            toastTTS('info', 'Sending book to Kindle...');
            
            let p = this.selectedFormat ? this.selectedFormat.path : null;
            this.store.sendToKindle(this.selectedFormat, this.selectedDestination.email);
        }
    },
    async mounted() {
        this.store.getData();
    },    
    components: {
        VueMultiselect,
        Button
    }
    
}

</script>

<style scoped>
.container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
}

.row {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80%;
}

.row label {
    margin-right: 1rem;
    font-size: 1.15rem;
}

.row .ms1,
.row .ms2 {
    margin-right: 1rem;
}

.row .ms1 {
    max-width: 250px;
}

.plugin-button {
    min-width: 150px;
}
</style>
