<template>
    <div class="delete-confirm-button" @click="click()">
        <font-awesome-icon :icon="icons.trash" v-if="iconPosition == 'left'" />
        <div class="text-block" :class="[iconPosition == 'left' ? 'left-align' : 'right-align']">
            <span :class="[asked ? 'hide' : '']">{{ text.notConfirmed }}</span>
            <span :class="[asked ? 'show' : '']">{{ text.confirm }}</span>
        </div>
        <font-awesome-icon :icon="icons.trash" v-if="iconPosition == 'right'" />
    </div>
</template>

<script>

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'

export default {
    name: 'DeleteWithConfirm',
    data() {
        return {
            icons: {
                trash: faTrash
            },
            asked: false,
            confirmed: false,
            text: {
                notConfirmed: "Delete",
                confirm: "Are you sure?"
            },
            timer: null
        }

    },   
    props: {
        id: {
            type: String,
            required: true
        },
        iconPosition: {
            type: String,
            default: "left"
        },
        timeout: {
            type: Number,
            default: 5000
        }
    },
    
    computed: {

    },
    emits: ['delete'],
    methods: {
        click() {
            if (this.asked) {
                this.$emit('delete', this.id);
            } else {
                this.asked = true;
                this.timer = setTimeout(() => {
                    this.asked = false;
                }, this.timeout);
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
.delete-confirm-button {
    display: inline-flex;
    align-items: center;
    height: 20px;
    cursor: pointer;
    padding-right: 5px;
}


.text-block {
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: start;
    margin-left: 10px;
    height: 20px;
    overflow-y: hidden;
    position: relative;
}

.text-block.left-align {
    align-items: start;
    margin-left: 0.7rem;
}

.text-block.right-align {
    align-items: end;
    margin-right: 0.7rem;
}

.text-block span {
    display: flex;
    align-items: center;
    transition: all 0.5s;
    height: 20px;
    white-space: nowrap;
}

.text-block span:first-child.hide {
    transform: translateY(-100%);
}

.text-block span:last-child.show {
    transform: translateY(-100%);
}
</style>