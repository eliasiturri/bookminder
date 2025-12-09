<template>
<div class="book-metadata-container">
    <h1>Book Metadata</h1>
</div>
</template>

<script>

import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
import { faUser } from '@fortawesome/free-regular-svg-icons'
import { faExpand } from '@fortawesome/free-solid-svg-icons'
import { faGear, faPowerOff } from '@fortawesome/free-solid-svg-icons'

export default {
    name: 'LibraryCard',
    data() {

        }
    },   
    props: {
        data: {
            type: Object,
            required: true
        },
    
    computed: {

    },
    emits: ['save-metadata'],
    methods: {
        saveMetadata() {
            this.$emit('save-metadata', this.data);
        }
    },
    async mounted() {

    },    
    components: {
        FontAwesomeIcon
    }
    
}

</script>

<style>

</style>

<style scoped>

@import '@/assets/css/containers.css';

.library-card-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 1em;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.library-card {
    background-image: v-bind(imgUrl);
    background-clip: content-box;
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: cover;
    border-start-start-radius: 0.2rem;
    border-start-end-radius: 0.2rem;
    border-end-start-radius: 0;
    border-end-end-radius: 0;
    position: relative;
}

.library-card.horizontal {
    min-width: 342px;
    min-height: 192px;
    max-width: 400px;
}

.extra-data {
    min-width: 342px;
    max-width: 400px;
}

.library-card.vertical {
    min-width: 190px;
    min-height: 285px;
    max-width: 400px;
}

.type-icon {
    position: absolute;
    color: white;
    top: 0.6rem;
    right: 0.6rem;
}

.extra-data {
    display: flex;
    align-items: center;
    width: 300px;
    background-color: var(--secondary-bg-color);
    padding: 10px;
    border-start-start-radius: 0;
    border-start-end-radius: 0;
    border-end-start-radius: 0.2rem;
    border-end-end-radius: 0.2rem;
    min-height: 150px;
}

.extra-data .left {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: start;
    flex: 9;
}

.extra-data .right,
.extra-data .right > div {
    display: flex;
    justify-content: center;
    margin: 0 5px;
}

.library-card-header {

    font-size: 1.3rem;
    font-weight: bold;
}

.config-button {
    margin-right: 1.5rem;
    font-size: 1.5rem;
    cursor: pointer;
}

</style>