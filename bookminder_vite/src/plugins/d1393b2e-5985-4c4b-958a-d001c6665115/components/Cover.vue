<template>
    <div class="cover">
        <ErrorAwareImage
            :minimal="true"
            :height="computedHeight"
            :width="computedWidth"
            :title="title"
            :author="author"
            :description="''"
            :doSrc="url"
            :isOutside="true"
        />
    </div>
</template>

<script>

import ErrorAwareImage from '@/components/ErrorAwareImage.vue';

export default {
    name: 'Cover',
    data() {
        return {

        }
    },   
    props: {
        url: {
            type: String,
            required: true,
            default: 'cover-not-exists.png'

        },
        title: {
            type: String,
            default: ''
        },
        author: {
            type: String,
            default: ''
        },
        width: {
            type: Number,
            default: 150
        },
        height: {
            type: Number,
            default: 225
        }
    },
    
    computed: {
        computedWidth() { return this.width; },
        computedHeight() { return this.height; }
    },
    methods: {

    },
    async mounted() {

    },    
    components: {
        ErrorAwareImage
    }
    
}

</script>

<style>

</style>

<style scoped>

.cover, .cover.notfound {
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>