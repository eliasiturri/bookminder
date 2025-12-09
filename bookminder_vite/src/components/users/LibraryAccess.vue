<template>
    <div class="table">
        <div class="row heading">
            <div class="cell library"></div>
            <div class="cell">Access content</div>
            <div class="cell">Add content</div>
            <div class="cell">Delete content</div>
        </div>
        <div class="row" v-for="library in libraries">
            <LibraryRowElement class="cell library" :library="library" />
            <div class="cell">
                <RoleActionEnabled :enabled="library.see_enabled" :action="library.library_name" @change="changeAccess('see', library)"/>
            </div>
            <div class="cell">
                <RoleActionEnabled :enabled="library.add_enabled" :action="library.library_name" @change="changeAccess('add', library)"/>
            </div>            
            <div class="cell">
                <RoleActionEnabled :enabled="library.delete_enabled" :action="library.library_name" @change="changeAccess('delete', library)"/>
            </div>
        </div>
    </div>    
</template>

<script>

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import RoleActionEnabled from '@/components/input/RoleActionEnabled.vue'
import LibraryRowElement from '@/components/users/LibraryRowElement.vue'

export default {
    name: 'LibraryAccess',
    data() {
        return {

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
            this.$emit('change-access', this.id, where, library.library_name);
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
        LibraryRowElement
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
    background-color: rgba(128, 128, 128, 0.397);
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
    background-color: rgba(17, 17, 149, 0.105)
}
</style>