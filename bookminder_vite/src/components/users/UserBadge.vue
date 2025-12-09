<template>
    <div class="flex-row user-badge-wrapper">
        <slot></slot>
        <div class="badge-container"  @click="openMenu()">
            <img :src="avatarPath" ref="badgeContainer" class="avatar" :alt="t('alts.user avatar')" >
        </div>
        <div class="badge-menu" :class="showingMenu ? 'visible' : 'hidden'" ref="badgeMenuElement">
            <div class="menu-badge-container">
                <img :src="avatarPath" class="avatar" :alt="t('alts.user avatar')" >
            </div>    
            <div class="menu-element-separator full" v-if="menuElements.length > 0"></div>    
            <div class="menu-element" @click="goTo(null, null)">
                <div class="menu-element-row">
                    <font-awesome-icon class="fa-icon" :icon="languageElement.icon" />
                    <LanguageSwitcher class="w-100" />
                </div>
                <div class="menu-element-separator full"></div>
            </div>
            <div class="menu-element" v-for="el, idx in menuElements" @click="goTo(el, el.url)">
                <div class="menu-element-row">
                    <font-awesome-icon class="fa-icon" :icon="el.icon" />
                    <span>{{ getTranslation(el.displayName) }}</span>
                </div>
                <div class="menu-element-separator full" v-if="idx < menuElements.length - 1"></div>
            </div>
        </div>
    </div>
</template>

<script>

import { mapState } from 'pinia'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher.vue'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faArrowRightFromBracket, faEarthAmericas, faUser, faPhotoFilm, faBookOpenReader, faMagnifyingGlass, faBackward, faCircleArrowDown, faPlug, faGear, faCodeCommit, faBriefcase } from '@fortawesome/free-solid-svg-icons'

import { useI18n } from 'vue-i18n';

export default {
    name: 'UserBadge',
    data() {
        return {
            menuElements: [
                {
                    displayName: "profile",
                    url: "/user-profile",
                    icon: faUser
                },
                {
                    displayName: "settings",
                    url: "/user-settings",
                    icon: faGear
                },
                {
                    displayName: "logout",
                    url: "/logout",
                    icon: faArrowRightFromBracket
                } 
            ],
            languageElement: {
                displayName: "language",
                url: "/user-language",
                icon: faEarthAmericas
            },
            showingMenu: false,
            usersStore: useUsersStore(),
            authStore: useAuthStore(),
            t: useI18n().t
        }
    },   
    props: {

    },
    computed: {
        ...mapState(useUsersStore, ['settings']),
        ...mapState(useAuthStore, ['avatar']),
        avatarPath() {
            // First check if avatar is in auth store
            if (this.avatar) {
                return this.avatar;
            }
            
            // Fallback to settings
            if (Object.keys(this.settings).length === 0) {
                return new URL('@/assets/images/placeholders/avatar.png', import.meta.url).href;
            } else {
                if (this.settings.setting_value && this.settings.setting_value.avatar_path) {
                    return new URL(this.settings.setting_value.avatar_path, import.meta.url).href;
                } else if (this.settings.setting_fallback_value && this.settings.setting_fallback_value.avatar_path) {
                    return new URL(this.settings.setting_fallback_value.avatar_path, import.meta.url).href;
                }
                else {
                    return new URL('@/assets/images/placeholders/avatar.png', import.meta.url).href;
                }
            }
        },
    },
    emits: ['change-access'],
    methods: {
        openMenu() {
            if (!this.showingMenu) {
                document.addEventListener('mousedown', this.clickOutside);
            }
            this.showingMenu = !this.showingMenu;

        },
        clickOutside(event) {
            const el = this.$refs.badgeMenuElement;
            if (!el) {
                document.removeEventListener('mousedown', this.clickOutside);
                this.showingMenu = false;
                return;
            }
            const boundingRect = el.getBoundingClientRect();
            const outside = event.clientX < boundingRect.left || event.clientX > boundingRect.right || event.clientY < boundingRect.top || event.clientY > boundingRect.bottom;
            if (outside) {
                document.removeEventListener('mousedown', this.clickOutside);
                this.showingMenu = false;
            }
        },
        goTo(el, url) {
            if (!el) { return; }
            if (el.changesView) {
                this.view = el.url;
            } else {
                this.$router.push(url);
            }
        },
        getTranslation(key) {
            return this.t(`sidebarMenu.${key}`);
        }
    },
    async mounted() {
        // Load avatar from auth store
        await this.authStore.getAvatar();
        
        if (Object.keys(this.settings).length === 0) {
            await this.usersStore.fetchSettings();
        }
    }, 
    beforeUnmount() {
        document.removeEventListener('mousedown', this.clickOutside);
    },
    components: {
        FontAwesomeIcon,
        LanguageSwitcher
    }
    
}

</script>


<style scoped>

@import '@/assets/css/containers.css';

.user-badge-wrapper {
    position: relative;
}

.avatar {
    width: 35px;
    height: 35px;
    border-radius: 50%;
}

.w-100 {
    width: 100%;
}

.menu-badge-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.6rem 0;
}

.badge-container {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-right: 2rem;
}

.badge-menu {
    position: absolute;
    top: calc(100% + 5px);
    right: 0;
    display: flex;
    flex-direction: column;
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    min-width: 350px;
    z-index: 999;
}

.badge-menu.hidden {
    visibility: hidden;
}

.menu-element-row {
    display: flex;
    align-items: center;
    color: black;
    font-size: 18px;
    padding: 0.75rem 1.25rem;
    cursor: pointer;
}

.menu-element-row:hover {
    background-color: #f5f5f5;
}

.menu-element-row .fa-icon {
    margin-right: 10px;
}

.menu-element-separator {
    margin: 0 10px;
    border-bottom: 1px solid #e0e0e0;
}

.menu-element-separator.full {
    margin: 0;
}

.fa-icon {
    color: black;
}
</style>