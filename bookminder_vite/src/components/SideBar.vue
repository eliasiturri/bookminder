<template>
    <nav id="sidebar" v-if="view == 'regular'" aria-label="Main Navigation For User" :class="!visible ? 'hidden' : ''">
        <div class="top-container">
            <div class="logo-element" tabindex="2" @keyup.enter="goHome">
                <div class="logo-svg a" :onclick="goHome"></div>
            </div>
            <div class="menu-element" :class="showOrNoneClass(el)" v-for="el, idx in elements" @click="goTo(el, el.url)" :tabindex="2 + idx" @keyup.enter="goTo(el, el.url)">
                <div  v-if="(accessibilityShow(el) == true) || (!el.adminOnly && el.normallyHidden != true) || (el.adminOnly && canAccessAdmin)">
                    <font-awesome-icon class="fa-icon" :icon="el.icon" aria-hidden="true"/>
                    <span>{{ t(el.displayName) }}</span>
                </div>
            </div>
        </div>
    </nav>
    <nav id="sidebar" v-else-if="view == 'admin' && canAccessAdmin" arial-label="Main Navigation For Administrator" :class="!visible ? 'hidden' : ''">
        <div class="top-container">
            <div class="logo-element">
                <div class="logo-svg"></div>
            </div>
            <div class="admin-banner">
                <span>{{ t('sidebarMenu.admin panel') }}</span>
            </div>
            <div class="menu-element" :class="permissionShow(el) == false ? 'show-or-none' : ''" v-for="el in adminElements" @click="goTo(el, el.url)">
                <div v-if="permissionShow(el)">
                    <font-awesome-icon class="fa-icon" :icon="el.icon" />
                    <span>{{ t(el.displayName) }}</span>
                </div>
            </div>
        </div>
    </nav>    
</template>

<script>
import { mapState } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faMinus, faArrowRightFromBracket, faUser, faHatWizard, faBook, faUpload, faUserSecret, faHouse, faPenRuler, faUserGroup, faPhotoFilm, faBookOpenReader, faMagnifyingGlass, faBackward, faCircleArrowDown, faPlug, faGear, faCodeCommit, faBriefcase } from '@fortawesome/free-solid-svg-icons'

import { useI18n } from 'vue-i18n'

import emitter from 'tiny-emitter/instance'

export default {
    name: 'SideBar',
    data() {
        return {
            visible: true,
            view: "regular",
            logoIcon: faBookOpenReader,
            versionIcon: faCodeCommit,
            elements: [
                {
                    displayName: 'sidebarMenu.home',
                    url: "/",
                    icon: faHouse,
                },
                {
                    displayName: 'sidebarMenu.discover',
                    url: "/discover",
                    icon: faHatWizard
                },{
                    displayName: 'sidebarMenu.books',
                    url: "/books",
                    icon: faMinus
                }, {
                    displayName: 'sidebarMenu.authors',
                    url: "/authors",
                    icon: faMinus
                }, {
                    displayName: 'sidebarMenu.search',
                    url: "/search",
                    icon: faMagnifyingGlass
                }, {
                    displayName: 'sidebarMenu.upload',
                    url: "/upload",
                    icon: faUpload
                }, {
                    displayName: 'sidebarMenu.admin',
                    url: "admin",
                    icon: faPlug,
                    adminOnly: true,
                    changesView: true
                },{
                    displayName: 'sidebarMenu.profile',
                    url: "/user-profile",
                    icon: faUser,
                    accessibilityShowIf: 'avatarAccessible',
                    normallyHidden: true
                }, {
                    displayName: 'sidebarMenu.settings',
                    url: "/user-settings",
                    icon: faGear,
                    accessibilityShowIf: 'avatarAccessible',
                    normallyHidden: true
                }, {
                    displayName: 'sidebarMenu.logout',
                    url: "/logout",
                    icon: faArrowRightFromBracket,
                    accessibilityShowIf: 'avatarAccessible',
                    normallyHidden: true
                }, 
            ],
            adminElements: [
                {
                    displayName: "sidebarMenu.roles",
                    url: "/admin-roles",
                    icon: faPenRuler,
                    role_actions: ['can edit roles']
                }, 
                {
                    displayName: "sidebarMenu.users",
                    url: "/admin-users",
                    icon: faUserGroup,
                    role_actions: ['can edit users']
                },{
                    displayName: "sidebarMenu.user libraries",
                    url: "/admin-libraries/user",
                    icon: faPhotoFilm,
                    role_actions: ['can edit user libraries']
                },{
                    displayName: "sidebarMenu.global libraries",
                    url: "/admin-libraries/global",
                    icon: faPhotoFilm,
                    role_actions: ['can edit global libraries']
                }, {
                    displayName: "sidebarMenu.plugins",
                    url: "/plugins",
                    icon: faPlug,
                    changesView: false,
                    forEverybody: true
                }, {
                    displayName: "sidebarMenu.go back",
                    url: "regular",
                    icon: faBackward,
                    changesView: true,
                    forEverybody: true
                }, 
            ],
            store: useAuthStore(),
            settingsStore: useSettingsStore(),
            t: useI18n().t,
            top: 0,
            scrollTop: 0,
            lastScrollTop: 0,
            lastScrollDifference: 0,
            debounceTimer: null,
            body: null,
            sidebar: null,
            sidebarExcess: 0,
            windowWidth: 0,
        }
    },   
    computed: {
        ...mapState(useSettingsStore, ['behavior']),
        ...mapState(useAuthStore, ['role_actions', 'needReloadRoles']),
        frontendUrlPath() {
            return import.meta.env.VITE_BASE || '';
        },
        canAccessAdmin() {
            // Allow admin view if user is admin or has any admin capability
            if (this.store.role === 'admin') return true;
            const needed = [
                'can edit user libraries',
                'can edit global libraries',
                'can edit users',
                'can edit roles'
            ];
            return needed.some(a => this.role_actions && this.role_actions[a] === 1);
        }
    },
    watch: {
        // restores de sidebar menu to the "admin panel" if we are in an admin route
        $route(to, from) {
            if (to.meta.admin == true) {
                this.view = "admin";
            }
        }
    },
    methods: {

        permissionShow(el) {
            if (el.forEverybody) {
                return true;
            }
            if (el.role_actions) {
                let found = false;
                el.role_actions.forEach(action => {

                    let actionValue = this.role_actions[action];
                    if (actionValue && actionValue == 1) {
                        found = true;
                    }
                });
                return found;
            } 
            return false;
        },
        showOrNoneClass(el) {
            return (this.accessibilityShow(el) == true) || (!el.adminOnly && el.normallyHidden != true) || (el.adminOnly && this.canAccessAdmin) ? '' : 'show-or-none';
        },
        goTo(el, url) {
            /* if the right setting is set to true, close the sidebar when a menu element is clicked (useful
               for mobile devices), unless we are just navigating inside the sidebar */
            if (el.changesView) {
                this.view = el.url;
            } else {
                this.$router.push(url);
                if (this.behavior.closeSidebarOnClick && this.windowWidth < this.behavior.maxWindowWidth) {
                    emitter.emit('toggle-sidebar', true);
                }
            }
        },
        // home redirection in the logos
        goHome() {
            window.location = this.frontendUrlPath;
        },
        accessibilityShow(el) {
            let key = el.accessibilityShowIf || null;
            if (key && this.settingsStore.accessibility[key] == true) {
                return true;
            } else {
                return false;
            }
        },
        windowResize(w) {
            this.debounce(() => {
                this.sidebarExcess = this.sidebar.getBoundingClientRect().height - window.innerHeight > 0 ? this.sidebar.getBoundingClientRect().height - window.innerHeight : 0;
                this.windowWidth = window.innerWidth;
                this.scrollHandler();

                if (w < 768) {
                    this.visible = false;
                } else {
                    this.visible = true;
                }
            }, 100);
        },
        scrollHandler(event) {
            this.debounce(() => {
                this.lastScrollDifference = this.lastScrollTop - window.scrollY;
                this.lastScrollTop = window.scrollY;

                if (this.sidebarExcess > 0) {
                    let newScrollTop = this.scrollTop - this.lastScrollDifference;
                    if (newScrollTop > this.sidebarExcess) {
                        newScrollTop = this.sidebarExcess;
                    } else if (newScrollTop < 0) {
                        newScrollTop = this.scrollTop - this.lastScrollDifference > 0 ? this.scrollTop - this.lastScrollDifference : 0;
                    }
                    this.scrollTop = newScrollTop;
                }

                this.sidebar.style.top = `-${this.scrollTop}px`;
            }, 50);


        },
        debounce(func, delay) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                func();
            }, delay);
        }
    },
    async mounted() {

        console.log('reloading roles');

        // if the path does not include 'access-token', we reload the roles
        if (!this.$route.path.includes('access-token')) {
            //await this.store.reloadRoles();
        }

        if (this.$route.meta.admin == true) {
            this.view = "admin";
        }
        emitter.on('toggle-sidebar', (value) => {
            this.visible = !value;
        });

        this.windowResize(screen.width);
        window.addEventListener('resize', () => {
            this.windowResize(screen.width);
        });

        let body = document.querySelector('body');
        let sidebar = document.querySelector('#sidebar .top-container');
        this.body = body;
        this.sidebar = sidebar;
        this.top = sidebar.getBoundingClientRect().top;
        this.sidebarExcess = sidebar.getBoundingClientRect().height - window.innerHeight > 0 ? sidebar.getBoundingClientRect().height - window.innerHeight : 0;
        this.scrollTop = window.scrollY;
        this.windowWidth = window.innerWidth;
        window.addEventListener('scroll', this.scrollHandler);
    },    
    async beforeUnmount() {
        window.removeEventListener('resize', this.windowResize);
        window.removeEventListener('scroll', this.scrollHandler);
    },
    components: {
        FontAwesomeIcon,
    }
    
}

</script>


<style scoped>
nav {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: var(--sidebar-text-color);
    background-color: var(--sidebar-bg-color);
    min-height: 100vh;
    width: 250px;
    transition: width 1.5s; 
    z-index: 150;
    position: sticky;
    top: 0;
}

nav.hidden {
    width: 0;
    overflow: hidden;
}

.top-container {
    padding: 30px;
    transition: width 1.5s;
    position: sticky;
    position: -webkit-sticky;
    top: 0; /* required */
    z-index: 200;       
}

.hiddenx .top-container {
    width: 0;
}

.menu-element {
    padding: 30px;
}

.menu-element div {
    white-space: nowrap;
}

.logo-svg {
    background-color: var(--logo-color);
    mask: url(@/assets/images/bm_spinner.svg);
    mask-size: contain;
    mask-repeat: no-repeat;
    mask-position: center;
    width: 131px;
    height: 113px;
    margin: 10px;
}

.logo-element {    
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    margin-bottom: 20px;
    width: 100%;
    overflow: hidden;
}

.logo-element .logo {
    width: 70%;
    filter: invert(1);
}

.logo-element .fa-icon {
    margin-right: 10px;
}

.logo-element .a {
    cursor: pointer;
}

.menu-element {
    color: var(--primary-text-color);
    font-size: 18px;
    padding: 12px 0;
    cursor: pointer;
}

.menu-element .fa-icon {
    margin-right: 10px;
}

.fa-icon {
    color: var(--primary-text-color);
    min-width: 25px;
}

.admin-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
}

.admin-banner span {
    color: var(--primary-text-color);
    font-size: 16px;
    padding: 0px 30px 1px 30px;
    text-align: center;
    border: 1px solid var(--primary-text-color);
    border-radius: 10px;
    margin-bottom: 20px;
    font-weight: 400;
}

.show-or-none {
    display: none;
}
</style>