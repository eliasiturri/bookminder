<template>
    <div class="container" :class="!dummy && !menuVisible ? 'hidden' : '' " @mouseenter="mouseEnter" @mouseleave="mouseLeave">
        <div class="reader-toolbar">
            <div class="left">
                <div class="menu pointer action-button">
                    <FontAwesomeIcon :icon="icons.menu" @click="toggleMenu" />
                </div>

                <div class="title">
                    {{ title }}
                </div>
            </div>

            <div class="navigation pointer action-button">
                <FontAwesomeIcon :icon="icons.left" @click="goPrev" />
                <FontAwesomeIcon :icon="icons.right" @click="goNext" />
            </div>
        </div>
    </div>
    
</template>

<script>

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faChevronLeft, faChevronRight, faBars, faClose } from '@fortawesome/free-solid-svg-icons'

import { useSettingsStore } from '@/stores/settings'

import { useI18n } from 'vue-i18n'

export default {
    name: 'ReaderToolbar',
    data() {
        return {
            menuVisible: true,
            icons: {
                left: faChevronLeft,
                right: faChevronRight,
                menu: faBars,
                close: faClose
            },
            settingsStore: useSettingsStore,
            t: useI18n().t,
        }
    },   
    props: {
        dummy: {
            type: Boolean,
            default: false
        }, 
        title: {
            type: String,
            default: ""
        },
        loaded: {
            type: Boolean,
            default: false
        },
        tocVisible: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        
        
    },
    watch: {
        loaded() {
            this.setVisibilityTimeout();
        },
        tocVisible() {
            if (this.tocVisible) {
                this.menuVisible = true;
            }
        }
    },
    methods: {
        toggleMenu() {
            if (this.dummy) { return; };
            this.$emit('menu');
        },
        goPrev() {
            if (this.dummy) { return; };
            this.$emit('goPrev');
        },
        goNext() {
            if (this.dummy) { return; };
            this.$emit('goNext');
        },
        close() {
            if (this.dummy) { return; };
            this.$router.go(-1);
        },
        setVisibilityTimeout() {
            setTimeout(() => {
                this.menuVisible = false;
            }, 1000);
        },
        mouseEnter() {
            this.menuVisible = true;
            this.$emit('visibility', true);
        },
        mouseLeave() {
            if (this.tocVisible) {
                return;
            }
            this.menuVisible = false;
            this.$emit('visibility', false);
        }
    },
    async mounted() {
    },   
    emits: ['goNext', 'goPrev', 'menu', 'visibility'], 
    components: {
        FontAwesomeIcon
    }
    
}

</script>

<style scoped>
.hidden {
    opacity: 0;
}
.container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 10px;
    background-color: #f0f0f0;
    padding: 5px 20px;
    transition: opacity 1s;
    width: 100%;
    color: black;
}

.toc {
    background-color: #f0f0f0;
    padding: 10px;
}
.reader-toolbar {
    display: flex;
    justify-content: space-between;    
    
    max-width: 1600px;
    width: 100%;
}

.left {
    display: flex;
    align-items: center;
}

.left .title {
    font-size: 1rem;
    margin-left: 12px;
}

.pointer {
    cursor: pointer;
}

.action-button {
    padding: 10px;
    font-size: 1.25rem;
}

.action-button > *:not(:last-child) {
    margin-right: 20px;
}
</style>