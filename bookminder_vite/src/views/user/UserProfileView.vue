<template>
    <main>
        <DashboardTopNavigation :title="t('nav.head.user profile')"/>

        <div class="main-constrainer main-max-width">
            <h1 class="mt-20">{{ t('profile.avatar') }}</h1>

            <div class="profile-header-container">
                <div class="profile-header-left">
                    <img :src="avatarPath" class="avatar" :alt="t('alts.user avatar')" />
                </div>
                <div class="profile-header-right">
                    <h1>{{ username }}</h1>
                    <Button :text="t('buttons.change image')" icon="faUpload" @clicked="uploadFiles()"/>
                    <div class="input-row">
                        <label for="file-input" style="display: none;">{{ t('buttons.change image') }}</label>
                        <input id="file-input" ref="file-input" name="file" type="file" @change="onFileSelect" style="display: none;"/>
                    </div>
                </div>
            </div>

            <div class="section-block selected-theme mt-4rem" >
                <h1 class="mt-20">{{ t('profile.password') }}</h1>
                <div class="col-configuration-container grid-container accessibility">

                    <InputWithLabel :value="password1" role="textbox" type="password" :placeholder="t('formLabels.password1')" :label="t('formLabels.password1')" labelColor="black" labelBackgroundColor="white" showLabel="never" :showClearIcon="false" :showShowPasswordIcon="true" :id="'password1'" @input="passwordChanged" />
                    <InputWithLabel :value="password2" role="textbox" type="password" :placeholder="t('formLabels.password2')" :label="t('formLabels.password2')" labelColor="black" labelBackgroundColor="white" showLabel="never" :showClearIcon="false" :showShowPasswordIcon="true" :id="'password2'" @input="passwordChanged" @keyup.enter="changePassword()"/>

                </div>
                <div class="button-container">
                    <Button :text="t('buttons.change password')" :icon="'faKey'" iconPosition="right" iconFontSizePx="20" @clicked="changePassword()" />
                </div>                   
            </div>      
        </div>     
    </main>
</template>

<script>
import { mapState } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import { useUsersStore } from '@/stores/users'

import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'

import Button from '@/components/actions/Button.vue'
import InputWithLabel from '@/components/input/InputWithLabel.vue';

import { toastTTS } from '@/utils/tts'
import { useI18n } from 'vue-i18n'

export default {
    name: 'UserProfileView',
    data() {
        return {
            t: useI18n().t,
            imageBase64: null,
            password1: '',
            password2: '',
            authStore: useAuthStore(),
            usersStore: useUsersStore(),
        }
    },   
    watch: {

    },
    
    computed: {
        ...mapState(useUsersStore, ['selectedUser']),
        ...mapState(useAuthStore, ['username', 'avatar']),
        avatarPath() {
            if (this.imageBase64) { return this.imageBase64; }
            if (this.avatar) { return this.avatar; }
            return new URL('@/assets/images/placeholders/avatar.png', import.meta.url).href;
        },
    },
    methods: {
        uploadFiles() {
            this.$refs['file-input'].click();
        },
        async onFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                this.imageBase64 = e.target.result;
                
                // Save the avatar
                const result = await this.authStore.uploadAvatar(this.imageBase64);
                
                if (result.success) {
                    toastTTS("success", result.message || this.t('success.avatar updated'));
                } else {
                    toastTTS("error", result.error || this.t('errors.avatar upload failed'));
                }
            };
            reader.readAsDataURL(file);
        },
        passwordChanged(value, which) {
            if (which == "password1") {
                this.password1 = value;
                this.$emit('password-changed', "password1", value);
            } else if (which == "password2") {
                this.password2 = value;
                this.$emit('password-changed', "password2", value);
            }
        },       
        async changePassword() {
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
            
            const result = await this.authStore.changePassword(this.password1);
            
            if (result.success) {
                toastTTS("success", result.message || this.t('success.password changed'));
                this.password1 = '';
                this.password2 = '';
            } else {
                toastTTS("error", result.error || this.t('errors.password change failed'));
            }
        },         
    },
    async mounted() {
        // Load user's avatar
        await this.authStore.getAvatar();
    },    
    components: {
        DashboardTopNavigation,
        Button,
        InputWithLabel
    }
}

</script>

<style scoped>

@import '@/assets/css/containers.css';
@import '@/assets/css/inputs.css';
@import '@/assets/css/buttons.css';
@import '@/assets/css/paddings.css';

.main-constrainer {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.profile-header-container {
    display: flex;
    flex-direction: row;
}

.profile-header-left,
.profile-header-right {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 20px;
}
.profile-header-right {
    align-items: start;
    justify-content: center;
}

.profile-header-left img {
    width: 128px;
    height: 128px;
    max-width: 128px;
    max-height: 128px;
}

.button-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    width: 100%;
}

.button-container div {
    max-width: 250px;
}

h1.mt-20 {
    display: flex;
    justify-content: center;
}
</style>