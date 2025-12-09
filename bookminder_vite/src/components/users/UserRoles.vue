<template>
    <div class="table">
        <div class="row heading">
            <div class="cell library"></div>
            <div class="cell">{{t('formLabels.selected role')}}</div>
        </div>
        <div class="row" v-for="library in libraries">
            <UserRoleRow class="cell library" :library="library.name" />
            <div class="cell">
                <RoleActionEnabled :enabled="library.enabled" :action="library.library_name" @change="changeAccess('set', library)"/>
            </div>
        </div>
    </div>    
</template>

<script>

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import RoleActionEnabled from '@/components/input/RoleActionEnabled.vue'
import UserRoleRow from '@/components/users/UserRoleRow.vue'

import { useI18n } from 'vue-i18n'

export default {
    name: 'UserRoles',
    data() {
        return {
            t: useI18n().t
        }
    },   
    props: {
        id: {
            type: String, 
            default: null
        },
        libraries: {
            type: Array,
            required: true
        }
    },
    computed: {
        
        
    },
    emits: ['change-access'],
    methods: {
        changeAccess(where, library) {
            this.$emit('change-access', this.id, where, library.name);
        },
        backgroundUrlStyle(image_path) {
            let url = new URL(image_path, "https://bookminder.io").href;
            return `background-image: url(${url});`;
        }
    },
    async mounted() {
        
    },    
    components: {
        FontAwesomeIcon,
        RoleActionEnabled,
        UserRoleRow
    }
    
}

</script>


<style scoped>
.table {
    display: flex;
    flex-flow: column nowrap;
    border: 1px solid grey;
    border-radius: 10px;
}

.row {
    display: flex;
}

.row:not(:last-child) {
    border-bottom: 1px solid grey
}

.heading {
    font-weight: bold;
    background-color: var(--secondary-bg-color);
    border-start-start-radius: 10px;
    border-start-end-radius: 10px;
}

.cell {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 0.5rem 1rem;
}

.cell.library {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: center;
    flex-grow: 2;
}

.row:not(:first-child):hover {
    background-color: var(--secondary-bg-color);
}
</style>