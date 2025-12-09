<template>
    <div class="drop-zone-container" >
        <div class="drop-zone" :class="isDragging ? 'dragging' : ''" 
            @dragenter.prevent="(e) => { isDragging = true; }"
            @dragleave.prevent="(e) => { isDragging = false; }"
            @dragover.prevent="(e) => { isDragging = true; }"
            @drop.prevent="handleDrop"
            @click="openFileInput()">

            <div class="dots">
                <FontAwesomeIcon :icon="icons.image" class="icon" />
                <span>{{ t('image editor.buttons.drop here') }}</span>
            </div>
        </div>
    </div>  
</template>

<script>

import { useSettingsStore } from '@/stores/settings';
import { mapState } from 'pinia';

import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'

import Button from '@/components/actions/Button.vue';

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import { faImage, faSun } from '@fortawesome/free-solid-svg-icons'

import { useI18n } from 'vue-i18n';

export default {
    name: 'FileUploader',
    data() {
        return {
            selectedFilterIdx: 0,
            value: 100,
            imageFile: null,
            isDragging: false,
            files: [],
            filterData: [
                {
                    value: 100,
                    min: 0,
                    max: 200,
                    text: 'image editor.buttons.brightness'
                },
                {
                    value: 100,
                    min: 0,
                    max: 200,
                    text: 'image editor.buttons.saturation'
                },
                {
                    value: 100,
                    min: 0,
                    max: 200,
                    text: 'image editor.buttons.inversion'
                },
                {
                    value: 100,
                    min: 0,
                    max: 200,
                    text: 'image editor.buttons.greyscale'
                }
            ],
            accept: '*/*',
            icons: {
                image: faImage,
                brightness: faSun,
            },
            store: useSettingsStore(),
            isError: false,
            t: useI18n().t,
            i18n: useI18n(),
        };
    },
    props: {
        type: {
            type: String,
            default: 'files'
        },
        isEnabled: {
            type: Boolean,
            default: true
        }
    },
    computed: {
        ...mapState(useSettingsStore, ['settings']),
        backgroundColorHtmlSemiTransparent() {
            return this.settings.setting_value.background_color + '80';
        }
    },
    watch: {

    },
    emits: ['drop-done'],
    methods: {
        selectFilter(idx) {
            this.selectedFilterIdx = idx;
        },
        openFileInput() {
            //this.$refs.fileInput.click();
        },
        updateFiles(event) {
            const file = event.target.files[0];
            if (file) {
                this.imageFile = URL.createObjectURL(file);
            }
            this.$emit('drop-done', this.files);
        },
        onDrop(event) {
            event.preventDefault();
            this.isDragging = false;
            const items = event.dataTransfer.items;
            
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                }
            }
        },
        handleDrop(event) {
            // Don't process files if not enabled (no library selected)
            if (!this.isEnabled) {
                this.isDragging = false;
                this.$emit('drop-done', []);
                return;
            }
            
            const self = this;
            var dt = event.dataTransfer;
            var files = dt.files;
            var length = event.dataTransfer.items.length;
            for (var i = 0; i < length; i++) {
                var entry = dt.items[i].webkitGetAsEntry();
                if (entry.isFile) {
                    entry.file(self.handleFiles);
                } else if (entry.isDirectory) {
                    var reader = entry.createReader();
                    reader.readEntries(function(entries) {
                        entries.forEach(function(dir, key) {
                        dir.file(self.handleFiles);
                        })
                    });
                }
            }
            this.isDragging = false;
            this.$emit('drop-done', this.files);
        },
        handleFiles(file) {
            this.files.push(file);
        }
    },
    mounted: function () {},
    components: {
        Button,
        VueSlider,
        FontAwesomeIcon
    }
};
</script>

<style scoped>

@import '@/assets/css/containers.css';

.drop-zone-container {
    display: flex;
    width: 100%;
    height: 100%;
}

.drop-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.dots {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 10px dashed;
    border-color: var(--secondary-bg-color);
    width: 100%;
    height: 100%;
    padding: 3rem;
}

.dots svg {
    font-size: 10rem;
    color: var(--secondary-bg-color);
}

@media screen and (max-width: 768px) {
    .dots svg {
        font-size: 5rem;
    }
    
}

.dragging {
    background-color: var(--secondary-bg-color-alpha-80-percent);
}
</style>
