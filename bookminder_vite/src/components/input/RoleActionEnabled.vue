<template>
    <font-awesome-icon tabindex="0" class="element" :icon="enabled == 1 ? icons.enabled : icons.disabled" @click="change" @keyup.space.enter="change" :class="iconClass" />
</template>

<script>

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCheck, faClose } from '@fortawesome/free-solid-svg-icons'

export default {
    name: 'RoleActionEnabled',
    data() {
        return {
            icons: {
                enabled: faCheck,
                disabled: faClose
            },
        }

    },   
    props: {
        role: {
            type: String,
            default: ''
        },
        action: {
            type: String,
            default: ''
        },
        enabled: {
            type: Number,
            default: 0
        },
    },    
    computed: {
        iconClass() {
            return this.enabled == 1 ? 'enabled' : 'disabled';
        },
        fullyAccessible() {
            return this.$route.meta.accessible == true;
        },
        fullyAccessibleClass() {
            return this.$route.meta.accessible == true ? 'full-page' : '';
        },
    },
    emits: ['change'],
    methods: {
        change() {

            let newValue = this.enabled == 1 ? 0 : 1;
            
            this.$emit('change', this.role, this.action, newValue);
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

.enabled {
    color: green;
}

.disabled {
    color: red;
}

.element {
    cursor: pointer;
    padding: 10px;
    font-size: 1.75rem;
    min-width: 20px;
}

</style>