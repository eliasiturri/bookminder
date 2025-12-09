<template>
    <nav class="navigation-container" aria-label="Top Navigation Breadcrumb">
        <div class="top-navigation main-max-width">
            <div class="left-block">
                <FontAwesomeIcon :icon="icons.bars" class="fa-icon" @click="toggleSidebar" tabindex="0" @keyup.enter="toggleSidebar"/>
                <div class="logo-element" :class="!topLogoVisible ? 'hidden' : ''" tabindex="0" @keyup.enter="goHome">
                    <div class="logo-svg a" :onclick="goHome"></div>
                </div>

            </div>
  
            <UserBadge>
                <div class="back-container" v-if="showBreadcrumb && !hideBackContainer">
                    <BackArrow />
                    <h1 class="h1-title">{{ title }}</h1>
                </div>          
            </UserBadge>
        </div>     
    </nav>
</template>

<script>

import BackArrow from '@/components/navigation/BackArrow.vue'
import UserBadge from '@/components/users/UserBadge.vue'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'

import emitter from 'tiny-emitter/instance'

import { useI18n } from 'vue-i18n'

export default {
    name: 'DashboardTopNavigation',
    data() {
        return {
            topLogoVisible: false,
            icons: {
                bars: faBars
            },
            t: useI18n().t
        }
    },   
    props: {
        title: {
            type: String,
            default: 'Dashboard'
        },
        hideBackContainer: {
            type: Boolean,
            default: false
        }
    },
    
    computed: {
        showBreadcrumb() {
            return screen.width > 768;
        },
        frontEndUrlPath() {
            return import.meta.env.VITE_BASE || '';
        }
    },
    watch: {

    },
    methods: {
        toggleSidebar() {
            this.topLogoVisible = !this.topLogoVisible;
            emitter.emit('toggle-sidebar', this.topLogoVisible);
        },
        goHome() {
            console.log("going home");
            window.location = this.frontEndUrlPath;
        },    
        checkScreenWidth(w) {
            if (w < 768) {
                this.topLogoVisible = true;
            } else {
                this.topLogoVisible = false;
            } 
        }

    },
    async mounted() {
        this.checkScreenWidth(screen.width);
        window.addEventListener('resize', () => {
            this.checkScreenWidth(screen.width);
        });
    },    
    components: {
        FontAwesomeIcon,
        BackArrow,
        UserBadge
    }
    
}

</script>


<style scoped>

@import '@/assets/css/containers.css';

.back-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-right: 3rem;
    transition: margin-left 1s;
    width: min-content;
    white-space: nowrap;
}

.top-navigation-spacer {
    height: 65px;
}

nav {
    /*overflow: hidden;*/
    position: sticky;  /*changed to sticky and removed overflow hidden*/
    top: 0;
    width: 100%;
    height: 65px;
    z-index: 100;
    background-color: var(--topbar-bg-color);
}

.logo-element.hidden {
    opacity: 0;
    width: 0 !important;
}


.logo-element {    
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    width: 190px;
    overflow: hidden;
    transition: opacity 1.5s, width 1.5s;
    
}

.logo-element .a {
    cursor: pointer;
}

.logo-svg {
    background-color: var(--logo-color);
    mask: url(@/assets/images/bm_name.svg);
    mask-size: contain;
    mask-repeat: no-repeat;
    mask-position: center;    
    width: 190px;
    height: 50px;

}

.sticky {
    position: fixed;
    top: 0; /* required */
    
}

.top-navigation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 65px;
    color: var(--topbar-text-color);
    
    max-width: 100%;

}
.left-block {
    display: flex;
    align-items: center;
    justify-content: center;
}
.user-pic {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background-color: #e0e0e0;
    border-radius: 50%;
}

.fa-icon {
    font-size: 1.5rem;
    margin-left: 1rem;
    margin-right: 1rem;
    cursor: pointer;
}

::-webkit-scrollbar {
    z-index: 10000;

}
</style>