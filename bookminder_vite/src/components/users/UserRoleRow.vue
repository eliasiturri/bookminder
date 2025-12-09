<template>
    <div class="container">
        <div class="title">{{ library }}</div>
    </div>
</template>

<script>

import { useI18n } from 'vue-i18n'

export default {
    name: 'UserRoleRow',
    data() {
        return {
            t: useI18n().t
        }
    },   
    props: {
        library: {
            type: String,
            required: true
        }
    },
    computed: {
        
    },
    emits: ['change-access'],
    methods: {
        changeAccess(where, library) {
            this.$emit('change-access', this.id, where, library);
        },

    },
    async mounted() {
        
    },    
    components: {

    }
    
}

</script>


<style scoped>
.container {
    cursor: default;
    transition: height 2s ease-in-out;    
    height: 100px;
}
.cell.library {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: center;
    flex-grow: 2;
}

.cell.library .title {
    font-weight: bold;
}

.cell.library .description,
.cell.library .folder-count {
    font-size: 0.8rem;
}

.contrast-accessible {
    background-image: none !important;
    justify-content: center !important;
}
.contrast-accessible:hover {
    background-image: none !important;
    height: 100px !important;
}
</style>