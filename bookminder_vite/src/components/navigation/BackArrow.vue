<template>
    <div class="back-navigation" @click="goBack()">
        <font-awesome-icon :icon="icons.faAngleLeft" />
    </div>
</template>

<script>


import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons'

import TabHeaderComponent from '@/components/TabHeaderComponent.vue'

export default {
    name: 'BackArrow',
    data() {
        return {
            icons: {
                faAngleLeft: faAngleLeft
            }
        }
    },   
    props: {

    },
    
    computed: {

    },
    watch: {

    },
    methods: {
        goBack() {
            this.$router.go(-1);
        }
    },
    async mounted() {

    },    
    components: {
        FontAwesomeIcon,
    }
    
}

</script>


<style scoped>
.back-navigation {
    padding-left: 15px;
    padding-right: 15px;
    cursor: pointer;
}
</style>