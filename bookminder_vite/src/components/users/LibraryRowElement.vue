<template>
    <div class="container" :class="contrastAccessibleClass">
        <div class="title">{{ library.library_name || library.name }}</div>
        <div class="description">{{ library.library_description }}</div>
        <div class="folder-count">{{ library.folder_count }} {{ library.folder_count != 1 ? t('users view.buttons.folder plural') : t('users view.buttons.folder singular') }}</div>
    </div>
</template>

<script>

import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import RoleActionEnabled from '@/components/input/RoleActionEnabled.vue'

import { useI18n } from 'vue-i18n'

export default {
    name: 'LibraryRowElement',
    data() {
        return {
            isMouseOver: false,
            t: useI18n().t
        }
    },   
    props: {
        library: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapState(useSettingsStore, ['accessibility']),
        backgroundUrl() {
            // TODO USE ENV VARIABLE
            let url = new URL(this.library.image_path, "https://demo.bookminder.io").href;
            return `url(${url})`;
        },
        contrastAccessibleClass () {
            return this.accessibility.contrastAccessible ? 'contrast-accessible' : '';
        }
        
    },
    emits: ['change-access'],
    methods: {
        changeAccess(where, library) {
            this.$emit('change-access', this.id, where, library.library_name);
        },

    },
    async mounted() {
        
    },    
    components: {
        FontAwesomeIcon,
        RoleActionEnabled
    }
    
}

</script>


<style scoped>
.container:hover {
    background-image: v-bind('backgroundUrl');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    color: white;
    height: 200px;
}

.container {
    cursor: default;
    transition: height 2s ease-in-out;    
    height: 100px;
}
.cell.library {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: center;
    flex-grow: 2;
}

.cell.library:hover {
    justify-content: start;
}

.cell.library .title {
    font-weight: bold;
}

.cell.library .description,
.cell.library .folder-count {
    font-size: 0.8rem;
}

.contrast-accessible {
    background-image: none !important;
    justify-content: center !important;
}
.contrast-accessible:hover {
    background-image: none !important;
    height: 100px !important;
}
</style>