<template>
    <main>
        <div class="welcome">
            <div class="logo-element">
                <img src="/src/assets/images/bm_spinner.svg">
            </div>
            <div class="text-element noto-serif-abc">
                <span>{{ t('login.msg') }}</span>
            </div>
            <form @submit.prevent="login" class="login-form">
                <div class="login-container">
                    <InputWithLabel :value="username" role="textbox" type="text" :placeholder="t('login.username')" :label="t('login.username')" labelColor="black" labelBackgroundColor="white" showLabel="never" :showClearIcon="false" @input="(value) => username = value" @keyup.enter="login"/>
                    <InputWithLabel :value="password" role="textbox" type="password" :placeholder="t('login.password')" :label="t('login.password')" labelColor="black" labelBackgroundColor="white" showLabel="never" :showClearIcon="false" :showShowPasswordIcon="true" @input="(value) => password = value" @keyup.enter="login"/>
                </div>
                <div class="button-container">
                    <Button :text="t('login.button')" :icon="null" tabindex="0" @clicked="login" />
                </div>
            </form>
        </div>
    </main>
</template>

<script>

import { useAuthStore } from '@/stores/auth'

import InputWithLabel from '@/components/input/InputWithLabel.vue';
import Button from '@/components/actions/Button.vue'

import { toastTTS } from '@/utils/tts';

import { useI18n } from 'vue-i18n';

export default {
    name: 'LoginView',
    data() {
        return {
            username: '',
            password: '',
            authStore: useAuthStore(),
            t: useI18n().t,
            isLoggingIn: false
        }
    },   
    
    computed: {

    },
    methods: {
        async login() {
            // Prevent double submission
            if (this.isLoggingIn) return;
            this.isLoggingIn = true;

            if (this.username.trim() == '' ) {
                toastTTS('error', this.t('login.empty username'));
                this.isLoggingIn = false;
                return;
            }

            if (this.password.trim() == '' ) {
                toastTTS('error', this.t('login.empty password'));
                this.isLoggingIn = false;
                return;
            }

            let result = await this.authStore.login(this.username, this.password);
            this.isLoggingIn = false;
            if (result) { 
                this.$router.push('/'); 
            } else {
                toastTTS('error', this.t('login.invalid credentials'));
            }
        }
    },
    async mounted() {

    },    
    components: {
        InputWithLabel,
        Button
    }
    
}

</script>

<style scoped>

@import '@/assets/css/containers.css';
@import '@/assets/css/inputs.css';
@import '@/assets/css/buttons.css';

.login-form {
    display: contents;
}

.button-container div .text-block {
    width: 100%;
    align-items: center;
    justify-content: center;
    display: flex;
}

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

.login-container {
    margin-top: 1rem;
}

.login-container div {
    margin-top: 1rem;
    width: 300px;
}

.button-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 3rem;
}

.button-container div {
    width: 200px;
}

.text-block.left-align {
    margin-left: 0 !important;
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