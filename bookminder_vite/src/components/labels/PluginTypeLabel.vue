<template>
    <div class="plugin-label" :style="labelStyle">
        <font-awesome-icon :icon="labelIcon" />
        <span>{{ labelText }}</span>
    </div>
</template>

<script>

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faSearch, faCode } from '@fortawesome/free-solid-svg-icons'

export default {
    name: 'PluginTypeLabel',
    data() {
        return {

        }
    },   
    props: {
        type: {
            type: String,
            default: 'other',
            required: true
        }
    },
    computed: {
        labelText() {
            return this.type.charAt(0).toUpperCase() + this.type.slice(1);
        },
        labelIcon() {
            switch (this.type) {
                case 'search':
                    return faSearch;
                default:
                    return faCode;
            }
        },
        labelColor() {
            switch (this.type) {
                case 'search':
                    return 'blue';
                case 'gitlab':
                    return 'orange';
                case 'bitbucket':
                    return 'blue';
                case 'other':
                    return 'green';
                default:
                    return 'green';
            }
        },
        labelStyle() {
            return {
                backgroundColor: this.labelColor
            }
        }
    },
    methods: {

    },
    async mounted() {

    },    
    components: {
        FontAwesomeIcon,
    }
}

</script>


<style scoped>

.plugin-label {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    color: white;
    font-size: 0.75rem;
    font-weight: bold;
    width: fit-content;
    min-width: 75px;
}

.plugin-label span {
    margin-left: 0.35rem;
}

</style>