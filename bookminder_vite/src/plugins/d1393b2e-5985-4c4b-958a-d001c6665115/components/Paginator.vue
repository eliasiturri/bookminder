<template>
    <div class="paginator">
        <div class="page-button contrast-text" v-for="i in 10" :key="i" :class="[i <= max ? '' : 'disabled', i == current ? 'current' : '']" @click="pageClick(i)">{{ i }}</div>
    </div>
</template>

<script>

export default {
    name: 'Paginator',
    data() {
        return {

        }
    },   
    props: {
        current: {
            type: Number,
            required: true
        },
        max: {
            type: Number,
            required: true
        },
    },
    
    computed: {

    },
    emits: ['page-switch'],
    methods: {
        pageClick(page) {
            if (page > this.max) return;
            this.$emit('page-switch', page);
        }
    },
    async mounted() {

    },    
    components: {

    }
    
}

</script>

<style>

</style>

<style scoped>

.paginator {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;

}

.paginator .page-button {
    display: flex;
    justify-content: center;    
    padding: 5px 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    cursor: pointer;
    min-width: 36px;
}

.paginator .page-button.current {
    background-color: #007bff;
    color: white;
}

.paginator .page-button.disabled {
    color: #ccc;
    cursor: not-allowed;
}

.contrast-text {
    color: white;
    font-weight: 900;
    font-size: 16px;
}
</style>