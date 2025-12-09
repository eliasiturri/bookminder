<template>
    <div class="container">
        <div class="row">
            <label for="calibre-convert-input">Input Format</label>
            <VueMultiselect id="calibre-convert-input" class="ms1 vms-contrast" v-model="selectedInputFormat" :options="data.formats" label="name"  />
            <label for="calibre-convert-output">Output Format</label>
            <VueMultiselect id="calibre-convert-output" class="ms2 vms-contrast" v-model="selectedOutputFormat" :options="filteredOutputFormats" label="name" />
            <Button class="plugin-button" @clicked="convert" text="Convert" icon="faBurst" />
        </div>
    </div>
</template>

<script>

import VueMultiselect from '@/components/vue-multiselect'

import { mapState } from 'pinia'
import { useCalibreStore } from '../stores/calibre'

import Button from '@/components/actions/Button.vue'

import { toastTTS } from '@/utils/tts'
import { useI18n } from 'vue-i18n'

export default {
    name: 'FormatConversionComponent',
    data() {
        return {
            pluginData: {
                pluginUuid: '985f95c0-fe2d-4213-8240-6b3799569cca',
                
            },
            selectedInputFormat: null,
            selectedOutputFormat: null,
            store: useCalibreStore(),
            t: useI18n().t
        }
    },   
    props: {
        data: {
            type: Object,
            required: false
        }
    },
    computed: {
        ...mapState(useCalibreStore, ['outputFormats']),
        filteredOutputFormats() {
            if (!this.selectedInputFormat) {
                return this.outputFormats;
            }
            return this.outputFormats.filter(f => f.value !== this.selectedInputFormat.name);
        },
    },
    methods: {
        formatChanged(value) {
            this.selectedFormat = value;
        },
        async convert() {
            if (!this.selectedInputFormat || !this.selectedOutputFormat) {
                toastTTS("error", "Please select both input and output formats");
                return;
            }
            
            if (!this.data || !this.data.selectedFormat) {
                toastTTS("error", "Please select a book format first");
                return;
            }
            
            // Get the full file path and other necessary info from the selected format
            const inputFormatPath = this.selectedInputFormat.path;
            const outputFormat = this.selectedOutputFormat.value;
            const bookId = this.data.bookId;
            const libraryId = this.data.libraryId;
            
            if (!inputFormatPath) {
                toastTTS("error", "Could not find file path for the selected format");
                return;
            }
            
            console.log("Converting:", { inputFormatPath, outputFormat, bookId, libraryId });
            
            // Show immediate "processing" toast
            toastTTS("info", `Converting to ${outputFormat.toUpperCase()}...`);
            
            try {
                const result = await this.store.convert(inputFormatPath, outputFormat, bookId, libraryId);
                
                if (result && result.success) {
                    toastTTS("success", result.message || "Format conversion completed successfully");
                    // Call the refresh callback if provided
                    if (this.data && typeof this.data.refreshBookDetails === 'function') {
                        this.data.refreshBookDetails();
                    }
                } else if (result && result.error) {
                    toastTTS("error", result.error || "Conversion failed");
                } else {
                    // Empty response - conversion is likely processing
                    toastTTS("info", "Conversion is being processed. The new format will appear shortly.");
                    // Still call refresh after a delay
                    if (this.data && typeof this.data.refreshBookDetails === 'function') {
                        setTimeout(() => {
                            this.data.refreshBookDetails();
                        }, 3000);
                    }
                }
            } catch (error) {
                console.error("Conversion error:", error);
                toastTTS("error", "Conversion failed");
            }
        }
    },
    async mounted() {

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
    white-space: nowrap;
}

.row .ms1,
.row .ms2 {
    margin-right: 1rem;
}

.plugin-button {
    min-width: 150px;
}
</style>
