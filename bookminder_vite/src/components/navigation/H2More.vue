<template>
    <h2>
        <span class="header-text" >{{ header }}</span>
        <font-awesome-icon v-if="showAction" :icon="icons.more" @click="h2Action"/>
    </h2>
</template>

<script>

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faAnglesRight } from '@fortawesome/free-solid-svg-icons'

export default {
    name: 'H2More',
    data() {
        return {
            icons: {
                more: faAnglesRight
            }
        }

    },   
    props: {
        header: {
            type: String,
            default: "Repositories"
        },
        showAction: {
            type: Boolean,
            default: false
        },
        iconSize: {
            type: Number,
            default: 15
        },
        iconMarginTop: {
            type: Number,
            default: 0
        }
    },
    
    computed: {

    },
    emits: ['see-more'],
    methods: {
        h2Action() {
            this.$emit('see-more');
        }
    },
    async mounted() {

    },    
    components: {
        FontAwesomeIcon
    }
    
}

</script>


<style scoped>
h2 {
    display: flex;
    align-items: center;
    cursor: pointer;
}
h2 svg {
    margin-left: 0.5rem;
    width: calc(v-bind(iconSize) * 1px);
    margin-top: calc(v-bind(iconMarginTop) * 1px);
}
</style>