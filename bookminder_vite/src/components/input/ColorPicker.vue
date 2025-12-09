<template>
    <div class="outer-colorpicker">
        <div
        class="selected-color"
        :style="selectedColorStyle"
        @click="openModal($event)"
        >
    </div>
    
    <VueFinalModal  v-model="isModalOpen" @close="closeModal"
          display-directive="show"
          content-class="color-picker-modal-content"
          :style="{'--modal-top': modalY + 'px', '--modal-left': modalX + 'px'}"
    >
        <div class="color-picker-container">
            <div class="color-picker" >
                <div
                v-for="color, idx in colors"
                :key="color"
                class="color-box"
                :style="{ backgroundColor: color }"
                @click="selectColor(color)"
                ></div> 
            </div>
            <div class="row button-row full-width-button flex-justify-center flex-align-center" @click="addNew()">
                <FontAwesomeIcon :icon="plusIcon" />
                <span>Close</span>
            </div>   
        </div>            
    </VueFinalModal>
</div>
</template>

<script>
import { VueFinalModal } from 'vue-final-modal';

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default {
    components: {
        VueFinalModal,
        FontAwesomeIcon,
    },
    props: {
        value: {
            type: String,
            default: '',
        },
        startWithRandomColor: {
            type: Boolean,
            default: false,
        },
        data: {
            default: null,
        },
        marginRight: {
            type: String,
            default: "0",
        },
    },
    data() {
        return {
            colors: [
            '#fcc02e', '#f67c01', '#e64a19', '#d81b43', '#8e24aa',
            '#512da7', '#1f87e8', '#008781', '#05a045',
            '#fed835', '#fb8c00', '#f5511e', '#eb1d4e', '#9c28b1',
            '#5d35b0', '#2097f3', '#029688', '#4cb050',
            '#ffeb3c', '#ffa727', '#fe5722', '#eb4165', '#aa47bc',
            '#673bb7', '#42a5f6', '#26a59a', '#83c683',
            '#fff176', '#ffb74e', '#ff8a66', '#f1627e', '#b968c7',
            '#7986cc', '#64b5f6', '#80cbc4', '#a5d6a7',
            '#fff59c', '#ffcc80', '#ffab91', '#fb879e', '#cf93d9',
            '#9ea8db', '#90caf8', '#b2dfdc', '#c8e6ca',
            ],
            selectedColor: null,
            isModalOpen: false,
            modalX: 0,
            modalY: 0,
            color: 'blue', 
        };
    },
    methods: {
        openModal(event) {
            console.log(event);
            
            let x = event.clientX;
            let y = event.clientY;
            console.log(x, y);
            if (document.documentElement.clientWidth - x > 600) {
                this.modalX = x + 30;
                this.modalY = y - 100;
            } else {
                this.modalX = x - 600;
                this.modalY = y - 100;
            }
            
            
            this.isModalOpen = true;
        },
        closeModal() {
            this.isModalOpen = false;
        },
        selectColor(color) {
            this.selectedColor = color;
            this.$emit('color', this.selectedColor, this.data);
            this.closeModal();
        },
    },
    emits: ['color'],
    computed: {
        selectedColorStyle() {
            return {
                marginRight: `${this.marginRight}`,
                backgroundColor: this.selectedColor,
            };
        },
        modalStyle() {
            return {
                '--modal-top': `${this.modalY}px`,
                '--modal-left': `${this.modalX}px`,
            };
        },
    },
    mounted() {
        if (this.startWithRandomColor) {
            this.selectedColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            this.$emit('color', this.selectedColor, this.data);
        } else if (this.value.length > 0) {
            this.selectedColor = this.value;
        }
    },
};
</script>

<style>

.vfm {
    display: flex;
    align-items: center;
    justify-content: center;
}

.vfm__container {
    display: flex;
    justify-content: center;
    align-items: center;
    
}
.color-picker-modal-content {
    position: absolute;
    top: var(--modal-top);
    left: var(--modal-left);
}
</style>

<style scoped>
@import '@/assets/css/buttons.css';

.outer-colorpicker {
    display: flex;
    align-items: center;
    justify-content: center;
}
.selected-color {
    width: 30px; /* Adjust size as needed */
    height: 30px; /* Adjust size as needed */
    border: 1px solid #000;
    cursor: pointer;
    border: 1px solid rgb(179, 179, 179);
    border-radius: 50%;
}

.color-picker {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    grid-template-rows: repeat(5, 1fr);
    gap: 5px;
    padding: 1rem;
    background-color: white;
}

.color-box {
    width: 40px;  /* Adjust size as needed */
    height: 40px; /* Adjust size as needed */
    cursor: pointer;
    border: 1px solid #ddd;
    transition: transform 0.2s;
}

.color-box:hover {
    transform: scale(1.1);
}

</style>
