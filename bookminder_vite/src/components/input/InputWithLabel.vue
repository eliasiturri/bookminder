<template>
    <div class="outer-container">

        <div class="input-container" :style="containerStyle">
            <label :for="label" v-if="showingLabel" class="accessibility-label" :class="accessibilityClass">{{ placeholder }}</label>
            <div class="input">
                <input tabindex="0" :id="label" :role="role" :name="label" v-model="inputValue" :type="mutableType" :placeholder="placeholder" :style="inputStyle" @input="input" @focus="focus" >
                <font-awesome-icon tabindex="0" v-if="showShowPasswordIcon" :icon="showingPassword ? hidePasswordIcon : showPasswordIcon" @click="togglePasswordVisibility" class="clear-button" @keyup.enter="togglePasswordVisibility"/>
                <font-awesome-icon tabindex="0" v-if="showClearIcon" :icon="closeIcon" @click="clearInput" class="clear-button" @keyup.enter="clearInput"/>
            </div>
        </div>
    </div>        
</template>

<script>

import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faXmark, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'

export default {
    name: 'InputWithLabel',
    data() {
        return {
            inputValue: '',
            closeIcon: faXmark,
            showPasswordIcon: faEye,
            hidePasswordIcon: faEyeSlash,
            showingPassword: false,
            mutableType: "text",

        }

    },   
    props: {
        id: {
            type: String,
            default: ''
        },
        value: {
            type: String,
            default: ''
        },
        type: {
            type: String,
            default: 'text'
        },
        placeholder: {
            type: String,
            default: ''
        },
        role: {
            type: String,
            default: ''
        },
        label: {
            type: String,
            default: ''
        },
        labelColor: {
            type: String,
            default: 'black'
        },
        labelBackgroundColor: {
            type: String,
            default: 'white'
        },
        marginRight: {
            type: Number,
            default: 0
        },
        marginRightUnit: {
            type: String,
            default: 'px'
        },
        showClearIcon: {
            type: Boolean,
            default: true
        },
        showShowPasswordIcon: {
            type: Boolean,
            default: false
        },
        showLabel: {
            type: String,
            default: 'conditional'
        },
        orientation: {
            type: String,
            default: 'vertical'
        }
    },
    watch: {
        value: {
            handler(newValue) {
                this.inputValue = newValue;
            },
            immediate: true
        }
    },
    
    computed: {
        ...mapState(useSettingsStore, {
            accessibility: 'accessibility'
        }),
        showingLabel() {
            if (this.showLabel === 'force') {
                return true;
            }
            if (this.accessibility) {
                return this.accessibility.inputsAccessible;
            }
            return false;
        },
        containerStyle() {
            return {
                marginRight: `${this.marginRight}${this.marginRightUnit}`,
                flexDirection: this.orientation === 'horizontal' ? 'row' : 'column'
            }
        },
        inputStyle() {
            return {
                paddingRight: this.showClearIcon ? '2rem' : '0'
            }
        },
        labelStyle() {
            return {
                color: this.labelColor,
                backgroundColor: this.labelBackgroundColor
            }
        },
        fullyAccessible() {
            return this.$route && this.$route.meta ? this.$route.meta.accessible : false;
        },
        accessibilityClass() {
            return this.$route.meta.accessible == true ? 'accessible' : 'visually-hidden';
        },
    },
    emits: ['input'],
    methods: {
        clearInput() {
            this.inputValue = '';
            this.$emit('input', this.inputValue, this.id);
        },
        input() {
            this.$emit('input', this.inputValue, this.id);
        },
        focus() {
            if (this.$route.meta.hearing == true) {
                this.$emit('focus');
            }
        },
        togglePasswordVisibility() {
            this.showingPassword = !this.showingPassword;
            this.mutableType = this.showingPassword ? 'text' : 'password';
        }
    },
    async mounted() {
        this.mutableType = this.type;
    },    
    components: {
        FontAwesomeIcon
    }
    
}

</script>


<style scoped>

.outer-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    
}

.input {
    display: flex;
    align-items: center;
    position: relative;
    
}

input {
    padding: 0.5rem;
    border-radius: 5px;
    border: 1px solid #e8e8e8;
    width: 100%;
    min-height: 40px;
    font-size: 14px;
    background-color: var(--secondary-bg-color);
    color: var(--primary-text-color);
}

.label {
    position: absolute;
    top: -10px;
    margin-top: 0px;
    margin-left: 10px;
    padding: 0 5px;
    font-size: 12px;
    height: 20px;
}

.accessibility-label {
    margin-left: 0.3rem;
}

.clear-button {
    position: absolute;    
    right: 0.65rem;
    cursor: pointer;
    color: #ccc;
}

</style>