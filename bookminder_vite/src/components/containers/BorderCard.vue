<template>
    <div class="container" >
        <slot></slot>
    </div>  
</template>

<script>

export default {
    name: 'BorderCard',
    data() {
        return {

        };
    },
    props: {

    },
    computed: {

    },
    watch: {

    },
    emits: [],
    methods: {
     
    },
    mounted: function () {},
    components: {
        
    }
};
</script>

<style scoped>

.container {
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 1rem;
    margin: 1rem;
    background-color: var(--primary-bg-color);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
}

</style>
