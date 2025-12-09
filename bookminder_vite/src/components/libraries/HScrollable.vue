<template>
    <div class="accessible-h-scrollable" v-if="isAccessible">
        <div class="title-row flex-row flex-align-center">
            <h2 class="title" v-if="title && typeof(title) == 'string'">
                {{ title }}
            </h2>
            <h2 class="title" v-else-if="title && typeof(title) != 'string'">
                <span>{{ title[0] }}</span>
                <span class="color-grey">{{ title[1] }}</span>
            </h2>        
        </div>
        <div class="grid baseline" :ref="`scrollable-${uuid}`">

            <slot></slot>

        </div>        
    </div>

    <div class="h-scrollable" v-else v-touch:swipe="swipeHandler">
        <div class="row">
            <div class="title-row flex-row flex-align-center">
                <h2 class="title" v-if="title && typeof(title) == 'string'">
                    {{ title }}
                </h2>
                <h2 class="title" v-else-if="title && typeof(title) != 'string'">
                    <span>{{ title[0] }}</span>
                    <span class="color-grey">{{ title[1] }}</span>
                </h2>                
            </div>
            <div class="flex-row scroll-buttons">
                <FontAwesomeIcon :alt="t('alts.scroll container left')" class="button" :class="canScrollLeft ? '' : 'disabled'" :icon="icons.left" @click="scroll(-1)"/>
                <FontAwesomeIcon :alt="t('alts.scroll container right')" class="button" :class="canScrollRight ? '' : 'disabled'" :icon="icons.right" @click="scroll(1)"/>
            </div>   
        </div>     
        <div class="flex-row scrollable baseline" :ref="`scrollable-${uuid}`"  >
            <slot></slot>
        </div>
    </div>
</template>

<script>

import { useSettingsStore } from '@/stores/settings'
import { mapState } from 'pinia'

import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'

import { v4 as uuidv4 } from 'uuid';

import { useI18n } from 'vue-i18n';

export default {
    name: 'HScrollable',
    data() {
        return {
            uuid: uuidv4(),
            icons: {
                left: faChevronLeft,
                right: faChevronRight
            },
            scrollLeft: 0,
            scrollRight: 0,
            scrollWidth: 0,
            clientWidth: 0,
            amount: 0,
            settingsStore: useSettingsStore(),
            t: useI18n().t
        }
    },   
    props: {
        title: {
            type: Object,
            default: ''
        },
        internalRef: {
            type: String,
            default: uuidv4()
        }
    },
    
    computed: {
        ...mapState(useSettingsStore, ['settings']), 
        canScrollLeft() {
            return this.scrollLeft > 0 && this.scrollWidth > this.clientWidth;
        },
        canScrollRight() {
            return this.scrollRight > 0 && this.scrollWidth > this.clientWidth;
        },
        isAccessible() {         
            return this.settingsStore.accessibility.homeAccessible;
        },            
    },
    watch: {

    },
    emits: ['child-interface'],
    methods: {
        scroll(direction) {
            if (direction < 0 && !this.canScrollLeft || direction > 0 && !this.canScrollRight) {
                return;
            }

            const container = this.$refs[`scrollable-${this.uuid}`];
            let amount = this.calculateScroll(direction);
            
            container.scrollBy({
                left: amount,
                behavior: 'smooth'
            });
        },
        enableMutationObserver(enable) {
            if (enable) {
                this.observer = new MutationObserver((mutations) => {
                    this.calculateScroll(0);
                });
                this.observer.observe(this.$refs[`scrollable-${this.uuid}`], { childList: true });
            } else {
                this.observer.disconnect();
            }
        },
        calculateScroll(direction) {
            const container = this.$refs[`scrollable-${this.uuid}`];
            this.clientWidth = container.clientWidth;
            this.scrollWidth = container.scrollWidth;

            let amount = container.clientWidth * direction;

            let scrollLeft = this.scrollLeft + amount;
            if (scrollLeft + amount > this.scrollWidth) {
                this.scrollLeft = this.scrollWidth;
            } else if (scrollLeft + amount < 0) {
                this.scrollLeft = 0;
            } else {
                this.scrollLeft = this.scrollLeft + amount;
            }
            
            this.scrollRight = this.scrollWidth - this.scrollLeft >= 0 ? this.scrollWidth - this.scrollLeft : 0;

            return amount;
        },
        swipeHandler(direction) {
            if (direction == 'left') {
                this.scroll(1);
            } else if (direction== 'right') {
                this.scroll(-1);
            }
        },
        scrollLeftBy(value) {
            this.$refs[`scrollable-${this.uuid}`].scrollLeft += value;
        },        
        emitInterface() {
            this.$emit("child-interface", this.internalRef, {
                    scrollLeftBy: (value) => this.scrollLeftBy(value)
                }
            );
        }        

        
    },
    async mounted() {
        this.emitInterface();
        this.enableMutationObserver(true);
        this.calculateScroll(0);
    },   
    unmounted() {
        this.enableMutationObserver(false);
    },
    components: {
        FontAwesomeIcon
    }
}

</script>

<style>
.scrollable > div:not(:last-child) {
    margin-right: 1.25rem;
}
.grid > div {
    width: min-content !important;
}
</style>

<style scoped>
@import '@/assets/css/containers.css';

.h-scrollable,
.accessible-h-scrollable {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    width: 100%;
    max-width: 100%;

}

.h-scrollable > .row {
    margin-right: 5px;
}

.baseline {
    align-items: start;
}

.scrollable {
    display: flex;
    justify-content: flex-start;    
    overflow: hidden;
}

.scroll-buttons {
    justify-content: end;
    align-items: end;
    height: 100%;
    margin-bottom: 1.5rem;
    margin-left: 1rem;
}

.scroll-buttons .button {
    cursor: pointer;
}

.title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    line-height: 1.25;
}

.scroll-buttons .button:not(:last-child) {
    cursor: pointer;
    margin-right: 1.5rem;
}

.scroll-buttons .button.disabled {
    color: #ccc;
}
.color-grey {
    color: #ccccccd1;
}

.grid {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
}

.col {
    display: flex;
    flex-direction: column;
}

.row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>