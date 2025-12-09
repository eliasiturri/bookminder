<template>
    <main>
        <div class="welcome w" v-if="view == 'welcome'">
            <div class="logo-element">
                <img src="/src/assets/images/bm_spinner.svg">
            </div>
            <div class="text-element noto-serif-abc">
                <Transition >
                    <span :key="animationIndex">{{ animationText[animationIndex] }}</span>
                </Transition>
            </div>
            <div class="button-container">
                <Button :text="continueText[animationIndex]" :icon="'faCaretRight'" iconPosition="right" iconFontSizePx="20" tabindex="1" @clicked="goOn('settings')" />
            </div>
        </div>
        <div class="full-width" v-else-if="view == 'settings'">
            <UserSettingsView :isWelcome="true" @passwordChanged="passwordChanged" />
            <div class="button-container">
                <Button :text="t('buttons.continue')" :icon="'faCaretRight'" iconPosition="right" iconFontSizePx="20" tabindex="1" @clicked="goOn('done')" />
            </div>            
        </div>
    </main>
</template>

<script>

import { useUsersStore } from '@/stores/users'
import { useLibrariesStore } from '@/stores/libraries'

import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'

import InputWithLabel from '@/components/input/InputWithLabel.vue'

import Button from '@/components/actions/Button.vue'
import TabHeaderComponent from '@/components/TabHeaderComponent.vue'

import NewLibrary from '@/components/libraries/NewLibrary.vue'

import LibraryAccess from '@/components/users/LibraryAccess.vue'

import { VueFinalModal } from 'vue-final-modal'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGear, faPowerOff } from '@fortawesome/free-solid-svg-icons'
import { mapState } from 'pinia'

import VueMultiselect from '@/components/vue-multiselect'

import UserSettingsView from '@/views/user/UserSettingsView.vue'

import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

import { toastTTS } from '@/utils/tts';

import { useI18n } from 'vue-i18n'

export default {
    name: 'WelcomeUser',
    data() {
        return {
            view: 'welcome',
            token: '',
            usersStore: useUsersStore(),
            librariesStore: useLibrariesStore(),
            animationIndex: 0,
            animationInterval: null,
            animationText: ["Welcome.", "Bienvenido.", "Willkommen.", "Bienvenue.", "Benvenuto.", "Välkommen.", "Welkom.", "Bem-vindo.", "Добро пожаловать.", "歡迎.", "환영합니다.", "ようこそ.", "欢迎.", "خوش آمدید.", "ברוך הבא.", "स्वागत है.", "ยินดีต้อนรับ.", "Hoş geldiniz"],
            continueText: ["Continue", "Continuar", "Fortsetzen", "Continuer", "Continua", "Fortsätt", "Doorgaan", "Continuar", "Продолжить", "繼續", "계속하다", "続ける", "继续", "ادامه دهید", "המשך", "जारी रखें", "ดำเนินการต่อ", "Devam et"],
            password1: '',
            password2: '',
            t: useI18n().t
        }
    },   
    watch: {

    },
    
    computed: {
    },
    methods: {
        async goOn(value) {
            console.log("goOn", value);
            if (value == 'done') {
                console.log("done");
                if (this.password1.length == 0 && this.password2.length == 0) {
                    console.log("empty password");
                    toastTTS("error", this.t('errors.empty password'));
                    return;
                }
                if (this.password1 != this.password2) {
                    console.log("password mismatch");
                    toastTTS("error", this.t('errors.password mismatch'));
                    return;
                }
                await this.usersStore.createUserFromToken(this.token, this.password1);
                this.$router.push({ name: 'login' });
            }
            this.view = value;
        },
        passwordChanged(which, value) {
            if (which == "password1") {
                this.password1 = value;
            } else if (which == "password2") {
                this.password2 = value;
            }
        }
    },
    async mounted() {

        this.token = this.$route.query.token;

        this.interval = setInterval(() => {
            this.animationIndex < this.animationText.length - 1 ? this.animationIndex++ : this.animationIndex = 0;
        }, 2000)
        
    },    
    components: {
        InputWithLabel,
        DashboardTopNavigation,
        TabHeaderComponent,
        Button,
        VueFinalModal,
        NewLibrary,
        FontAwesomeIcon,
        VueMultiselect,
        LibraryAccess,
        UserSettingsView
    }
    
}

</script>

<style>
.welcome.w .button-container div .text-block {
    width: 100%;
    align-items: center;
    justify-content: center;
    padding-left: 8px;
    display: flex;
}


</style>

<style scoped>

@import '@/assets/css/containers.css';
@import '@/assets/css/inputs.css';
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
    margin-bottom: 4rem;
}

.button-container div {
    width: 200px;
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