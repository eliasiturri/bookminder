<template>
    <div class="tabs-header-container">
        <nav class="tabs-header" :class="cstyle" aria-label="Component Tabs">
        <div class="tab" @click="selectTab(idx)" @keyup.enter="selectTab(idx)" v-for="tab, idx in tabs" :key="idx" 
            tabindex="0" :class="[ idx == selectedTabIdx ? 'active' : '', hasBorder(idx)]"
            >
                {{ tab.name }}
            </div>
        </nav>
    </div>

</template>

<script>

export default {
    name: 'TabHeaderComponent',
    data() {
        return {

        }
    },   
    props: {
        selectedTabIdx: {
            type: Number,
            required: true
        },
        tabs: {
            type: Array,
            required: true
        },
        cstyle: {
            type: Array,
            default: ["buttons"]
        }
    },
    
    computed: {

    },
    emits: ['tab-selected'],
    methods: {
        selectTab(idx) {
            console.log("about to emit with index: ", idx)
            this.$emit('tab-selected', idx);
        },
        hasBorder(idx) {
            if (this.selectedTabIdx == 0 && (idx != 0 && idx != this.tabs.length - 1)) {
                return 'border-right';
            } else if (this.selectedTabIdx != idx && this.selectedTabIdx == this.tabs.length - 1 && (idx != this.tabs.lenght - 1)) {
                return 'border-right';
            } else {
                return '';
            }
        }
    },
    async mounted() {

    },    
    components: {
        
    }
    
}

</script>

<style scoped>
.tabs-header-container {
    display: flex;
    justify-content: center;
    align-items: center;
}

.tabs-header {
    display: flex;
    justify-content: start;
    align-items: center;
    width: min-content;
}

.tabs-header.buttons {
    border: 1px solid grey;
    border-radius: 10px;
}

.tabs-header.buttons .tab {
    display: flex;
    justify-content: center;
    align-items: center;    
    cursor: pointer;
    white-space: nowrap;
}

.tabs-header.underlined .tab {
    padding: 10px 10px 2px 10px;
    cursor: pointer;
    margin-right: 5px;
    white-space: nowrap;
}

.tabs-header.buttons .tab {
    padding: 10px 20px;
    cursor: pointer;
    white-space: nowrap;
}

.tabs-header.default .tab {
    border: 1px solid grey;
    border-radius: 5px;
}

.tabs-header.buttons .tab.active {
    color: white;
    background-color: rgb(27, 134, 221);
}

.tabs-header.buttons .tab.active:first-child {
    color: white;
    background-color: rgb(27, 134, 221);
    border-start-start-radius: 10px;
    border-end-start-radius: 10px;
}

.tabs-header.buttons .tab.active:last-child {
    color: white;
    background-color: rgb(27, 134, 221);
    border-start-end-radius: 10px;
    border-end-end-radius: 10px;
}

.tabs-header.buttons .tab.border-right {
    border-right: 1px solid grey;
}

.tabs-header.underlined .tab.active {
    border-bottom: 2px solid;
    margin-bottom: -2px;
}

.tabs-header.j-center {
    justify-content: center;
}
</style>