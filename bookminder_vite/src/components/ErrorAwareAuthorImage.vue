<template>
    <div class="author-image-container">
        <!-- Placeholder with shimmer while loading -->
        <div class="author-placeholder-wrapper" v-if="isLoading && doSrc">
            <svg class="author-placeholder-svg" xmlns="http://www.w3.org/2000/svg" :width="computedWidth" :height="computedHeight" viewBox="0 0 256 256">
                <rect width="256" height="256" fill="#f4f4f5"/>
                <circle cx="128" cy="96" r="48" fill="#d4d4d8"/>
                <path d="M32 240c0-53 43-80 96-80s96 27 96 80" fill="#d4d4d8"/>
            </svg>
            <div class="author-shimmer"></div>
            <!-- Hidden image for preloading -->
            <img :src="doSrc" @load="onLoadSuccess()" @error="onLoadError()" style="position: absolute; visibility: hidden; width: 0; height: 0;">
        </div>
        
        <!-- No URL provided: show placeholder immediately -->
        <div class="author-placeholder-wrapper" v-else-if="doSrc == null">
            <svg class="author-placeholder-svg" xmlns="http://www.w3.org/2000/svg" :width="computedWidth" :height="computedHeight" viewBox="0 0 256 256">
                <rect width="256" height="256" fill="#f4f4f5"/>
                <circle cx="128" cy="96" r="48" fill="#444"/>
                <path d="M32 240c0-53 43-80 96-80s96 27 96 80" fill="#444"/>
            </svg>
        </div>
        
        <!-- Image loaded successfully -->
        <img 
            v-else-if="!isLoading && !isError"
            :src="doSrc" 
            :alt="altText"
            class="author-image"
        />
        
        <!-- Image failed to load: show placeholder as fallback -->
        <div class="author-placeholder-wrapper" v-else>
            <svg class="author-placeholder-svg" xmlns="http://www.w3.org/2000/svg" :width="computedWidth" :height="computedHeight" viewBox="0 0 256 256">
                <rect width="256" height="256" fill="#f4f4f5"/>
                <circle cx="128" cy="96" r="48" fill="#444"/>
                <path d="M32 240c0-53 43-80 96-80s96 27 96 80" fill="#444"/>
            </svg>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ErrorAwareAuthorImage',
    data() {
        return {
            isError: false,
            isLoading: true
        };
    },
    props: {
        doSrc: {
            type: String,
            default: null
        },
        altText: {
            type: String,
            default: 'Author image'
        },
        width: {
            type: Number,
            default: 190
        },
        height: {
            type: Number,
            default: 285
        }
    },
    computed: {
        computedWidth() {
            return this.width;
        },
        computedHeight() {
            return this.height;
        }
    },
    watch: {
        doSrc() {
            this.isError = false;
            this.isLoading = true;
        }
    },
    methods: {
        onLoadSuccess() {
            this.isLoading = false;
            this.isError = false;
        },
        onLoadError() {
            this.isLoading = false;
            this.isError = true;
        }
    }
};
</script>

<style scoped>
.author-image-container {
    position: relative;
    width: v-bind('computedWidth + "px"');
    height: v-bind('computedHeight + "px"');
    display: flex;
    align-items: center;
    justify-content: center;
}

.author-placeholder-wrapper {
    position: relative;
    width: v-bind('computedWidth + "px"');
    height: v-bind('computedHeight + "px"');
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background-color: #f4f4f5;
}

.author-placeholder-svg {
    width: v-bind('computedWidth + "px"');
    height: v-bind('computedHeight + "px"');
    object-fit: cover;
}

.author-shimmer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.4) 50%,
        rgba(255, 255, 255, 0) 100%
    );
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

.author-image {
    width: v-bind('computedWidth + "px"');
    height: v-bind('computedHeight + "px"');
    object-fit: cover;
}
</style>
