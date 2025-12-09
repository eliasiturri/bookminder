<template>
    <div v-if="isLoading" class="loading-placeholder">
        <div class="spinner"></div>
        <p>Loading...</p>
    </div>
</template>

<script>
export default {
    data() {
        return {
            isLoading: true
        };
    },
    mounted() {
        // Listen to when the Vue app is ready
        window.addEventListener('load', this.hideLoading);
    },
    beforeDestroy() {
        window.removeEventListener('load', this.hideLoading);
    },
    methods: {
        hideLoading() {
            // Hide the loading screen once the window is loaded
            this.isLoading = false;
        }
    }
};
</script>

<style scoped>
.loading-placeholder {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.spinner {
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid #000;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
