<template>
    <h2>
        <span class="header-text" >{{ header }}</span>
        <font-awesome-icon v-if="showAction" :icon="icons.add" @click="add"/>
    </h2>
</template>

<script>

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons'

export default {
    name: 'H2PlusAdd',
    data() {
        return {
            icons: {
                add: faCirclePlus
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
        }
    },
    
    computed: {

    },
    emits: ['add'],
    methods: {
        add() {
            this.$emit('add');
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
}
h2 svg {
    cursor: pointer;
    margin-left: 0.5rem;
}
</style>