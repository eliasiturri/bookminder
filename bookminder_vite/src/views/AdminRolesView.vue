<template>
    <main>
        <DashboardTopNavigation :title="t('nav.head.roles')"/>
        <div class="main-constrainer main-max-width">
        
            
            <div class="content-container">
                <div class="button-row flex-wrap">
                    <Button :text="t('buttons.add role')" :icon="'faPlus'" iconPosition="left" @clicked="addRole()"></Button>
                    <Button :text="t('buttons.help')" :icon="'faQuestion'" iconPosition="left" ></Button>
                    <Button :text="t('buttons.save changes')" :icon="'faFloppyDisk'" iconPosition="left" :enabled="thereAreChanges" @clicked="saveChanges()"></Button>
                </div>
                <div class="flex-row mr flex-1">
                    
                    <div class="flex-column container flex-1">
                        <h2>{{t('nav.head.roles')}}</h2>
                        <div class="roles-list height-full scroll-container">
                            <FilterComponent :value="filterText" @filter="filter" class="filter-input mb-1rem filter-container-margin-bottom"/>
                            <div tabindex="0" class="role" v-for="role in filteredRoles" :class="selectedRole && selectedRole.role_name == role.role_name ? 'selected' : ''" @click="selectedRole = role" @keyup.enter="selectedRole = role">
                                <span>{{ role.role_name }}</span>
                                <FontAwesomeIcon :icon="icons.star" v-if="role.is_default" />
                            </div>
                        </div>                
                    </div>

                    <div class="flex-column container flex-1">
                        <h2>{{t('nav.head.role properties')}}</h2>
                        <div class="role-properties blob-container">
                            <InputWithLabel v-if="selectedRole" @input="(value) => selectedRole.role_name = value" label="Role Name" placeholder="Type a name for your role" :value="selectedRole.role_name" :showClearIcon="true" orientation="vertical" showLabel="force" />
                            <Button :text="t('buttons.default')" :icon="'faStar'" iconPosition="left" @clicked="toggleDefault()"></Button>
                            <Button :text="t('buttons.delete')" :icon="'faTrash'" iconPosition="left" @clicked="deleteRole()"></Button>
                        </div>                      
                        <h2>{{t('nav.head.role actions')}}</h2>
                        <div class="role-actions scroll-container">
                            <div class="action flex-row" v-for="(enabled, action) in roleActions">
                                <RoleActionEnabled class="role-action-changer" :enabled="enabled" :action="action" :role="selectedRole.role_name" @change="actionChanged" @clicked="actionChanged"/>
                                <span>{{ action }}</span>
                            </div>  
                        </div>  
                    </div>

                </div>
            </div>
        </div>
    </main>
</template>

<script>

import { useRolesStore } from '@/stores/roles'

import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'
import InputWithLabel from '@/components/input/InputWithLabel.vue'
import Toggle from '@/components/input/Toggle.vue'
import Button from '@/components/actions/Button.vue'
import DeleteWithConfirm from '@/components/actions/DeleteWithConfirm.vue'

import FilterComponent from '@/components/FilterComponent.vue'

import NewLibrary from '@/components/libraries/NewLibrary.vue'

import { VueFinalModal } from 'vue-final-modal'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faStar } from '@fortawesome/free-solid-svg-icons'
import { mapState } from 'pinia'

import RoleActionEnabled from '@/components/input/RoleActionEnabled.vue'

import VueMultiselect from '@/components/vue-multiselect'
import { useI18n } from 'vue-i18n'

export default {
    name: 'AdminRolesView',
    data() {
        return {
            filterText: "",
            roles: [],
            initialRoles: [],
            selectedRole: null,
            roleActions: {},
            suggestedActions: [],
            thereAreChanges: false,
            store: useRolesStore(),
            icons: {
                star: faStar,
            },
            t: useI18n().t
        }
    },   
    watch: {
        selectedRole: {
            handler: function (val) {
                console.log("selectedRole", val);
                this.roleActions = val.actions;
            },
            deep: true
        },
        roles: {
            handler: function (val) {
                console.log("roles", val);
                this.thereAreChanges = JSON.stringify(this.roles) != JSON.stringify(this.initialRoles);
            },
            deep: true
        }
    },
    computed: {
        fullyAccessible() {
            return this.$route.meta.accessible == true;
        },
        fullyAccessibleClass() {
            return this.$route.meta.accessible == true ? 'full-page' : '';
        },
        filteredRoles() {
            return this.roles.filter(role => {
                if (this.filterText == "") return true;
                return role.role_name.toLowerCase().includes(this.filterText.toLowerCase());
            });
        },
    },
    methods: {
        filter(value) {
            this.filterText = value;
        },
        addRole() {

            let newActions = {};
            for (let i = 0; i < this.suggestedActions.length; i++) {
                newActions[this.suggestedActions[i]['action_name']] = this.suggestedActions[i]['is_suggested'];
            }

            let newRoleName = 'New Role';
            let countNewRoleNames = this.roles.filter(r => r.role_name.startsWith('New Role')).length;
            if (countNewRoleNames > 0) {
                newRoleName = `New Role ${countNewRoleNames + 1}`;
            }

            this.selectedRole = {
                role_name: newRoleName,
                actions: newActions,
                is_default: 0,
            };
            this.roles.push(this.selectedRole);
        },
        actionChanged(role, action, enabled) {
            console.log("actionChanged", role, action, enabled);
            let affectedRoleIndex = this.roles.findIndex(r => r.role_name == role);
            this.roles[affectedRoleIndex].actions[action] = enabled;
        },
        toggleDefault(role_name, enabled) {
            this.roles.forEach(r => {
                if (r.is_default == 1) {
                    r.is_default = 0;
                }
                if (r.role_name == this.selectedRole.role_name) {
                    r.is_default = 1;
                }
            });
        },
        deleteRole(role_name) {
            let affectedRoleIndex = this.roles.findIndex(r => r.role_name == role_name);
            this.roles.splice(affectedRoleIndex, 1);
            if (this.roles.length > 0) {
                this.selectedRole = this.roles[0];
            } else {
                this.selectedRole = null;
            }            
        },
        async saveChanges() {

            let newRoles = this.roles.filter(r => this.initialRoles.findIndex(ir => ir.role_name == r.role_name) == -1);
            let editedRoles = [];
            let deletedRoles = [];

            for (let i = 0; i < this.initialRoles.length; i++) {
                let initialRole = this.initialRoles[i];
                let role = this.roles.find(r => r.role_name == initialRole.role_name);
                if (role == undefined) {
                    deletedRoles.push(initialRole);
                } else {
                    if (JSON.stringify(role) != JSON.stringify(initialRole)) {
                        console.log("role", role);
                        console.log("initialRole", initialRole);
                        let tempRole = JSON.parse(JSON.stringify(role));
                        tempRole['actions'] = {};
                        for (let action in role.actions) {
                            if (initialRole.actions[action] != role.actions[action]) {
                                tempRole['actions'][action] = role.actions[action];
                            }
                        }
                        editedRoles.push(tempRole);
                    }
                }
            }

            console.log("newRoles", newRoles);
            console.log("editedRoles", editedRoles);
            console.log("deletedRoles", deletedRoles);

            let selectedRoleIndex = this.roles.findIndex(r => r.role_name == this.selectedRole.role_name);

            await this.store.saveRoles(newRoles, editedRoles, deletedRoles);
            let result = await this.store.getRoles();
            this.roles = result.roles;
        },

        async fetchGlobalLibraries(selectedRoleIndex) {
            let result = await this.store.getRoles();
            this.roles = result.roles;
            this.suggestedActions = result.suggestedActions;
            this.initialRoles = JSON.parse(JSON.stringify(this.roles));
            if (this.roles.length > 0) {
                this.selectedRole = this.roles[selectedRoleIndex ? selectedRoleIndex : 0];
            }
        },
    },
    async mounted() {
        this.fetchGlobalLibraries();
    },    
    components: {
        InputWithLabel,
        Toggle,
        DeleteWithConfirm,
        DashboardTopNavigation,
        Button,
        VueFinalModal,
        NewLibrary,
        FontAwesomeIcon,
        VueMultiselect,
        RoleActionEnabled,
        FilterComponent
    }
    
}

</script>

<style>
.role-properties .outer-container,
.role-properties .inner-container {
    width: -webkit-fill-available;
    max-width: 100%;
}
.role-properties > div {
    width: 100%;
    max-width: 200px;
}
</style>

<style scoped>

@import '@/assets/css/containers.css';
@import '@/assets/css/inputs.css';
@import '@/assets/css/buttons.css';
@import '@/assets/css/paddings.css';

main {
    display: flex;
    flex-direction: column;
}

.content-container {
    height: 100%;
}

.container {
    margin: 20px;
}

.roles-list, .role-properties, .role-actions, .blob-container {
    padding: 20px;
    border: 1px solid var(--primary-text-color);
    border-radius: 15px;
}

.roles-list .role,
.role-actions .action {
    padding: 0.4rem 0.1rem;
}

.roles-list .role:hover,
.role-actions .action:hover,
.role.selected {
    background-color: var(--secondary-bg-color);
}

.roles-list .role {
    justify-content: space-between;
    align-items: center;
}

.role-actions .action {
    display: flex;
    align-items: center;
}

div.role {
    display: flex;
    min-height: 60px;
    padding: 0 1rem !important;

}

.role-actions .action span {
    padding: 0.3rem 1rem;
}

.role-properties {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.role-properties {
    margin-bottom: 1rem;
    display: flex;
    align-items: end;   
    justify-content: center; 
    flex-wrap: wrap;
    gap: 20px;
}

.roles-properties .button {
    width: -webkit-fill-available !important;

}

.input-label-adjustment {
    margin-top: 22px;
}

.input-label-adjustment:not(:last-child) {
    margin-left: 15px;
    margin-right: 15px;
}

.flex-1 {
    flex: 1;
}

.scroll-container {
    max-height: 100%;
    overflow-y: auto;
}

.flex-row {
    flex-wrap: wrap;
}

</style>