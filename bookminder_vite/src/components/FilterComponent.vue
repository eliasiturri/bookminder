<template>
    <InputWithLabel v-model="filterText" role="textbox" type="text" :placeholder="placeholder" label="Filter" labelColor="black" labelBackgroundColor="white" @input="filter"/>
</template>

<script>

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import InputWithLabel from './input/InputWithLabel.vue';

export default {
    name: 'FilterComponent',
    data() {
        return {
            filterText: "",
        }
    },   
    props: {
        placeholder: {
            type: String,
            default: "Filter"
        },
        value: {
            type: String,
            default: ""
        }
    },
    computed: {


    },
    emits: ['filter'],
    methods: {
        filter(value) {
            this.filterText = value;
            this.$emit('filter', this.filterText);
        }
    },
    async mounted() {
        this.filterText = this.value;
    },    
    components: {
        FontAwesomeIcon,
        InputWithLabel
    }
    
}

</script>
