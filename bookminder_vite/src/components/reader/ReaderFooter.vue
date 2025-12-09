<template>
    <div class="container" :class="!doShow ? 'hidden' : '' " @mouseenter="mouseEnter" @mouseleave="mouseLeave">
        <div class="reader-toolbar">
            Progress {{ progress }}%
        </div>
    </div>
    
</template>

<script>

import { useI18n } from 'vue-i18n'

export default {
    name: 'ReaderFooter',
    data() {
        return {
            visible: false,
            t: useI18n().t,
        }
    },   
    props: {
        show: {
            type: Boolean,
            default: false
        },
        progress: {
            type: Number,
            default: 0
        },
    },
    computed: {
        doShow() {
            return this.show || this.visible;
        }
        
    },
    watch: {
        show() {
            this.visible = this.show;
            this.setVisibilityTimeout();
        }
    },
    methods: {
        setVisibilityTimeout() {
            setTimeout(() => {
                this.visible = false;
            }, 1000);
        },
        mouseEnter() {
            this.visible = true;
        },
        mouseLeave() {
            if (this.tocVisible) {
                return;
            }
            this.visible = false;
        }
    },
    async mounted() {
    },   
    components: {

    }
    
}

</script>

<style scoped>
.hidden {
    opacity: 0;
}
.container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    padding: 10px;
    background-color: #f0f0f0;
    padding: 5px 20px;
    transition: opacity 1s;
    width: 100%;
    position: sticky;
    height: 40px;
    width: 100%;
    color: black;
}

</style>