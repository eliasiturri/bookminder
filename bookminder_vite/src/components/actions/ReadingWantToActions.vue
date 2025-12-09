<template>
    <div class="book-actions" @click="doShowDropdown()">
        <div class="center">
            <font-awesome-icon class="first" :icon="displayedAction.icon" v-if="displayedAction.icon != null"/>
            <span class="middle">{{displayedAction.name}}</span>
        </div>
        <div>
            <span class="divider"></span>
            <font-awesome-icon  class="last more-actions" :icon="icons.faAngleDown" />
        </div>
    </div>
    <div class="actions-dropdown-container" :class="[showDropdown ? 'show' : '']">
        <div class="actions-dropdown">
            <div class="action" v-for="action in availableActions" :key="action.key" @click="actionClick(action.key)">
                <font-awesome-icon class="first" :icon="action.icon" v-if="action.icon != null"/>
                <span class="last">{{action.name}}</span>
            </div>
        </div>
    </div>
</template>

<script>

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGlasses } from '@fortawesome/free-solid-svg-icons'
import { faBookmark } from '@fortawesome/free-regular-svg-icons'
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons'
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { faBan } from '@fortawesome/free-solid-svg-icons'

export default {
    name: 'H2More',
    data() {
        return {
            icons: {
                faAngleDown: faAngleDown
            },
            actions: [
                {
                    name: "Want to read",
                    class: "want-to",
                    key: "want-to",
                    icon: faBookmark
                },
                {
                    name: "Reading",
                    class: "reading",
                    key: "reading",
                    icon: faGlasses
                },
                {
                    name: "Read",
                    class: "read",
                    key: "read",
                    icon: faCircleCheck
                },
                {
                    name: "Change status",
                    class: "none-selected",
                    key: null,
                    icon: null
                },
                {
                    name: "Clear",
                    class: "clear",
                    key: "clear",
                    icon: faBan
                },
                {
                    name: "Close",
                    class: "close",
                    key: "close",
                    icon: null
                }

            ],
            showDropdown: false
        }

    },   
    props: {
        selectedAction: {
            type: String,
            default: null
        },
    },
    
    computed: {
        displayedAction() {
            return this.actions.find(action => action.key == this.selectedAction);
        },
        availableActions() {
            if (this.selectedAction == null) {
                return this.actions.filter(action => action.key != 'clear' && action.key != null);
            }
            if (this.selectedAction == 'want-to') {
                return this.actions.filter(action => action.key != 'want-to' && action.key != null);
            }
            if (this.selectedAction == 'reading') {
                return this.actions.filter(action => action.key != 'reading' && action.key != null);
            }
            if (this.selectedAction == 'read') {
                return this.actions.filter(action => action.key != 'read' && action.key != null);
            }
        },

    },
    emits: ['action-click'],
    methods: {
        doShowDropdown() {
            this.showDropdown = !this.showDropdown;
        },
        actionClick(key) {
            if (key == 'close') {
                this.showDropdown = false;
            } else if (key == 'clear') {
                this.$emit('action-click', null);
                this.showDropdown = false;
            } else {
                this.$emit('action-click', key);
                this.showDropdown = false;
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
.book-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.07rem 0.3rem;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.8rem;
    backdrop-filter: blur(10px);
    min-width: 130px;
    width: 100%;
}

.book-actions .first,
.book-actions .middle {
    margin-right: 5px;
}

.book-actions .last {
    margin-left: 5px;
}

.more-actions {
    margin-top: 3px;
}

.divider {
    border-right: 1px solid #e0e0e0;
    width: 1px;
    height: 75%;
}

.center {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
}

.actions-dropdown-container {
    display: none;
    align-items: center;
    justify-content: center;
    position: absolute;
    bottom: 0px;
    left: 0;
    width: 100%;
    z-index: 100;
}
.actions-dropdown-container.show {
    display: flex;
}

.actions-dropdown {
    /*background-color: white;*/
    border: 1px solid #e0e0e0;
    backdrop-filter: blur(10px);
    border-radius: 5px;
    width: 100%;
    margin: 4px;
    color: white
}

.actions-dropdown .action {
    padding: 0.5rem;
    cursor: pointer;
    
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}
.actions-dropdown .action:not(:last-child) {
    border-bottom: 1px solid #e0e0e0;
}
.action .first {
    margin-right: 7px;
}

.action:hover {
    background-color: #3f3f3f;
}

</style>