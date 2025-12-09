<template>
    <main>
        <div class="welcome">
            <div class="logo-element">
                <img src="/src/assets/images/bm_spinner.svg">
            </div>
            <div class="text-element noto-serif-abc">
                <span>{{ t('logout.msg') }}</span>
            </div>
            <div class="button-container">
                <Button :text="t('logout.button')" :icon="'faRotateRight'" iconPosition="left" iconFontSizePx="20" tabindex="1" @clicked="goOn()"/>
            </div>            
        </div>
    </main>
</template>

<script>

import { useAuthStore } from '@/stores/auth'

import Button from '@/components/actions/Button.vue'

import { useI18n } from 'vue-i18n';

export default {
    name: 'LogoutView',
    data() {
        return {
            authStore: useAuthStore(),
            timeout: null,
            t: useI18n().t,
        }
    },   
    
    computed: {

    },
    methods: {
        goOn() {
            clearTimeout(this.timeout);
            this.$router.push({ name: 'login' });
        }
    },
    async mounted() {
        this.authStore.logout();
        this.timeout = setTimeout(() => {
            this.$router.push({ name: 'login' });
        }, 3000);
    },    
    components: {
        Button
    }
    
}

</script>

<style scoped>

@import '@/assets/css/containers.css';
@import '@/assets/css/buttons.css';

.noto-serif-abc{
  font-family: "Noto Serif", serif;
  font-weight: 500;
  font-style: normal;
  font-variation-settings:
    "wdth" 100;
}

main {
    margin-top: 0 !important;
}

.full-width {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
}

.welcome {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
}

.logo-element {
    display: flex;
    justify-content: center;
    align-items: center;
}

.logo-element img {
    width: 500px;
    max-width: 50%;
    height: auto;
    filter: contrast(0.1) brightness(2);
}

.text-element {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;    
    font-size: 2.5rem;
    margin-top: 3rem;
    height: 50px;
}

.button-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 4rem;
}

.button-container div {
    width: max-content;
}

.button-container div .text-block {
    width: 100%;
    align-items: center;
    justify-content: center;
    padding-left: 8px;
    display: flex;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 1.5s ease;
  position: absolute;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

</style>