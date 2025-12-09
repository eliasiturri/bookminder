<template>
    <div class="button" :class="[!enabled ? 'disabled' : '', contrastAccessibleClass]" :syle="widthStyle" @click="clicked()" tabindex="0" @keyup.enter="clicked()">
        <font-awesome-icon :style="iconStyle" :icon="usedIcon" v-if="icon != null && iconPosition == 'left'" aria-hidden="true" />
        <div class="text-block" :class="[textBlockClass, contrastAccessibleClass]">
            {{ text }}
        </div>
        <font-awesome-icon :style="iconStyle" :icon="usedIcon" v-if="icon != null && iconPosition == 'right'" aria-hidden="true" />
    </div>
</template>

<script>

import { mapState } from 'pinia';
import { useSettingsStore } from '@/stores/settings';

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import  * as icons  from '@fortawesome/free-solid-svg-icons';

export default {
    name: 'Button',
    data() {
        return {
            icons: icons,
            asked: false,
            confirmed: false,
            timer: null
        }

    },   
    props: {
        id: {
            type: String,
            default: ""
        },
        icon: {
            type: String,
            default: "faXmark"
        },
        iconPosition: {
            type: String,
            default: "left"
        },
        iconFontSizePx: {
            type: String,
            default: null,
        },
        text: {
            type: String,
            default: ""
        },
        width: {
            type: String,
            default: "min"
        },
        enabled: {
            type: Boolean,
            default: true
        }
    },
    
    computed: {
        ...mapState(useSettingsStore, ['accessibility']),
        contrastAccessibleClass() {
            return this.accessibility.contrastAccessible ? 'color-contrast' : '';
        },
        usedIcon() {
            return this.icons[this.icon];
        },
        widthStyle() {
            if (this.width == 'min') {
                return 'min-width-button';
            } else if (this.width == 'full') {
                return 'full-width-button';
            } else {
                return 'button';
            }
        },
        iconStyle() {
            return this.iconFontSizePx != null ? { 'font-size': `${this.iconFontSizePx}px` } : {};
        },
        textBlockClass() {
            return this.icon != null ? this.iconPosition == 'left' ? 'left-align' : 'right-align' : '';
        }
    },
    emits: ['clicked'],
    methods: {
        clicked() {
            console.log("click in Button component");
            if (this.enabled) {
                this.$emit('clicked', this.id);
            }
        }
    },
    async mounted() {

    },    
    components: {
        FontAwesomeIcon
    }
    
}

</script>


<style scoped>

@import '@/assets/css/buttons.css';



.text-block.left-align {
    align-items: start;
    margin-left: 0.7rem;
}

.text-block.right-align {
    align-items: end;
    margin-right: 0.7rem;
}

.button.disabled {
    background-color: #e8e8e8;
    color: #a8a8a8;
    cursor: not-allowed;
}
.button {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border-radius: 0.5rem;
    padding: 0.5rem;
}

.color-contrast {
    font-size: 19px;
    font-weight: 900;
}

.button.disabled.color-contrast {
    color:rgb(16, 15, 15);
}
</style>