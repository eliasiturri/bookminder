<template>
    <div ref="placeholder-container" class="placeholder-container" v-observe-visibility="visibilityChanged">
        <PlaceholderTextLine :alignment="alignment" :height="height" :minWidthPercent="minWidthPercent" :animated="true" v-for="line in nLines" />
    </div>
</template>

<script>

import PlaceholderTextLine from '@/components/placeholders/PlaceholderTextLine.vue'

export default {
    name: 'PlaceholderText',
    data() {
        return {
            isVisible: false,
            nLines: 1,
            parentHeight: 0,
            margin: 5,
        }
    },   
    props: {
        lines: {
            type: Number,
            default: 3
        },
        fill: {
            type: Boolean,
            default: false
        },
        width: {
            type: String,
            default: "random"
        },
        minWidthPercent: {
            type: Number,
            default: 10
        },
        height: {
            type: Number,
            default: 10
        },
        reduceTotalHeightIn: {
            type: Number,
            default: 0
        },
        animated: {
            type: Boolean,
            default: false
        },
        alignment: {
            type: String,
            default: "start"
        },
        marginBottom: {
            type: Number,
            default: 0
        },
    },
    watch: {
    },
    computed: {
        computedMarginBottom() {
            return this.marginBottom + "px";
        }
    },
    methods: {
        visibilityChanged(isVisible) {
            this.isVisible = isVisible;
            if (isVisible) {
                this.calculateLines();
            }
        },
        calculateLines() {
                let container = this.$refs['placeholder-container'];
                let parentHeight = container.parentElement.clientHeight;
                let nLines = this.fill ? Math.floor((parentHeight - this.reduceTotalHeightIn) / (this.height + (this.margin * 2))) : this.lines;
                this.nLines = nLines;
                console.log("nLines", nLines);
                this.parentHeight = parentHeight;
        }
    },
    async mounted() {
    },    
    components: {
        PlaceholderTextLine
    }
    
}

</script>

<style scoped>
.placeholder-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: min-content;
    position: relative;
    margin-bottom: v-bind(computedMarginBottom);
}


</style>

<style>
@keyframes placeholderAnimation {
    0% {
        transform: translate3d(-0%, 0, 0);
    }

    100% {
        transform: translate3d(100%, 0, 0);
    }
}
</style>