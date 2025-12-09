<template>
    <div class="container">
        <div ref="el" class="placeholder-text" :class="animated ? 'animated': ''" :style="styles">&nbsp;</div>
    </div>
</template>

<script>

export default {
    name: 'PlaceholderTextLine',
    data() {
        return {
            isVisible: false,
            finalWidth: 0,
            parentHeight: 0,
            margin: 5,
        }
    },   
    props: {
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
    computed: {

        computedHeight() {
            return this.height + "px";
        },
        computedWidth() {
            return `${100 + (100 - this.finalWidth)}%`;
        },
        computedAlignment() {
            return this.alignment == "center" ? "center" : "flex-start";
        },


        styles() {
            let width = this.width == "random" ? Math.floor(Math.random() * (100 - this.minWidthPercent) + this.minWidthPercent) : this.width;
            this.finalWidth = width;
            return {
                width: width + "%",
                height: this.height + "px",
                maxHeight: this.height + "px",
                backgroundColor: "#eee",
                borderRadius: "5px",
                margin: this.margin + "px",
            }
        },

    },
    methods:{

    },
    mounted() {

    }
}
</script>

<style>

:root {
    --from-width: 88%;
}

</style>

<style scoped>

.placeholder-text {
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    position: relative;
    overflow: hidden;
}

.container {
    display: flex;
    background-color: white;
    justify-content: v-bind(computedAlignment);
}




.animated::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: v-bind(computedHeight);
    min-height: v-bind(computedHeight);
    background: linear-gradient(to right, transparent 0%, #e2e2e2, transparent 30%);
    animation-duration: 3s;
    animation-fill-mode: forwards;
    animation-iteration-count: infinite;
    animation-name: placeholderAnimation;
    animation-timing-function: linear;
}

</style>