<template>
    <div @click.stop="toggle()" @keyup.enter.space="toggle()" class="toggle" :class="enabled == 1 ? 'on' : 'off'" :tabindex="tabIndexParent">
        <div class="switch" :class="enabled == 1? 'on' : 'off'"></div>
    </div>
</template>



<script>




export default {
    name: 'Toggle',
    data() {
        return {

        }
    },    
    props: {
        enabled: {
            type: Number,
            required: true
        },
        id: {
            type: String,
            required: true
        },
        tabIndexParent: {
            type: Number,
            default: 0
        }
    },  
    watch: {

    },
    methods: {
        toggle() {
            let newValue = this.enabled == 1 ? 0 : 1;
            this.$emit('toggle', this.id, newValue);
        }
    },
    emits: ['toggle'],
    async mounted() {

    },
    components: {

    },
}

</script>

<style scoped>
.toggle {
    display: flex;
    flex-direction: column;
    background-color: var(--secondary-bg-color);
    border-radius: 5px;
    padding: 4px 5px;
    width: 50px;
    height: 28px !important;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    justify-content: center;
    cursor: pointer;
    border: 1px solid;
    border-color: var(--primary-text-color-alpha-80-percent);
}
.switch {
    height: 18px;
    width: 18px;
    border-radius: 5px;
    transition: all 0.3s;
}
.switch.on {
    background-color: var(--primary-text-color);
}
.switch.off {
    background-color: var(--primary-text-color-alpha-40-percent);
}
.toggle.on {
    align-items: end;
}
</style>
