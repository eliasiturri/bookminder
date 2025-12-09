<template>
    <main>
        <DashboardTopNavigation :title="t('nav.Users')"/>
        <div class="main-constrainer main-max-width">
            <div class="content-container">
                <div class="button-row mb-2rem">
                    <div class="user-select-container">
                        <label v-if="inputsAccessible" for="user-select">
                            <h1 class="mt-20">{{t('users view.headers.select user')}}</h1>
                        </label>
                        <VueMultiselect
                                id="user-select"
                                v-model="selectedUser"
                                :placeholder="t('users view.headers.select user')"
                                :options="users"
                                :multiple="false"
                                label="username"
                                class="user-select vms-contrast"
                            ></VueMultiselect> 
                    </div>

                    <Button class="h-fit" :text="'Save changes'" :icon="'faFloppyDisk'" iconPosition="left" :enabled="thereAreGlobalLibrariesChanges || rolesChanged" @clicked="saveGlobalLibrariesChanges" />
                    <Button class="h-fit" :text="t('buttons.add new user')" :icon="'faPlus'" iconPosition="left" @clicked="addUser" />
                    <Button class="h-fit" :text="t('buttons.reload session')" :icon="'faRotate'" iconPosition="left" @clicked="reloadSession()" />
                    <Button class="h-fit" :text="t('buttons.help')" :icon="'faQuestion'" iconPosition="left" />
                </div>                
           
                <TabHeaderComponent :tabs="userTabsComputed" :selectedTabIdx="selectedTabIdx" tabindex="0" :cstyle="['j-center', 'buttons']" @tab-selected="selectTab" class="filter-container-margin-top filter-container-margin-bottom-lg"/>

                <div v-if="selectedTabIdx == 0">
                    <UserRoles :libraries="userRoles" id="roles" @change-access="changeRole"/>
                </div>
                <div v-else-if="selectedTabIdx == 1">
                    <LibraryAccess :libraries="globalLibraries" id="global" @change-access="changeAccess"/>
                </div>                
                <div v-else-if="selectedTabIdx == 22222">
                    <LibraryAccess :libraries="userLibraries" id="user" @change-access="changeAccess"/>
                </div>
                <div v-else-if="selectedTabIdx == 2">
                    <div v-if="selectedPasswordResetView == 0">
                        <BorderCard class="border-card">
                            <h1>{{t('users view.headers.password reset')}}</h1>
                            <div>
                                {{t('users view.content.you can generate - one')}} <span class="italics">{{ selectedUser.username }}</span> {{t('users view.content.you can generate - two')}} 
                            </div>
                            <div class="mb-1rem">
                                {{t('users view.content.this action will')}}
                            </div>
                            <Button :text="t('users view.buttons.generate password reset link')" icon="faKey" iconPosition="left" @clicked="proceedPasswordReset"/>

                        </BorderCard>

                    </div>
                    <div v-else>
                        <BorderCard class="border-card">
                            <h1>{{ t('users view.new token.new token') }}</h1>
                            <div>
                                {{ t('users view.new token.hand 1') }}<span class="italics">{{ selectedUser.username }}</span> {{ t('users view.new token.hand 2') }}
                            </div>
                            <div>
                                {{ t('users view.new token.invalidated 1') }}<span class="italics">{{ String(selectedUser.username).charAt(0).toUpperCase() + String(selectedUser.username).slice(1) }}</span> {{ t('users view.new token.invalidated 2') }}
                            </div>
                            <div>
                                <a class="reset-password-link" :href="passwordResetLink">{{ passwordResetLink }}</a>
                            </div>
                        </BorderCard>                    
                        
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script>

import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { useLibrariesStore } from '@/stores/libraries'
import { useSettingsStore } from '@/stores/settings'
import { useRolesStore } from '@/stores/roles'

import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'

import Button from '@/components/actions/Button.vue'
import TabHeaderComponent from '@/components/TabHeaderComponent.vue'

import NewLibrary from '@/components/libraries/NewLibrary.vue'
import BorderCard from '@/components/containers/BorderCard.vue'
import RoleActionEnabled from '@/components/input/RoleActionEnabled.vue'
import LibraryAccess from '@/components/users/LibraryAccess.vue'
import UserRoles from '@/components/users/UserRoles.vue'

import { VueFinalModal } from 'vue-final-modal'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGear, faPowerOff } from '@fortawesome/free-solid-svg-icons'

import VueMultiselect from '@/components/vue-multiselect'

import { toastTTS } from "@/utils/tts";

import { useI18n } from 'vue-i18n'

export default {
    name: 'AdminUsersView',
    data() {
        return {
            users: [],
            globalLibraries: [],
            userLibraries: [],
            roles: [],
            selectedRole: null,
            userRole: null,
            initialGlobalLibraries: [],
            rolesChanged: false,
            previouslySelectedUsername: null,
            initialRoleForUser: null,
            thereAreGlobalLibrariesChanges: false,
            userLibraries: [],
            selectedUser: null,
            selectedTabIdx: 0,
            selectedPasswordResetView: 0,
            passwordResetLink: "",
            userTabs: [
                {
                    name: 'users view.tabs.roles'
                },
                {
                    name: 'users view.tabs.global libraries'
                },
                /*{
                    name: 'users view.tabs.user libraries'
                },*/
                {
                    name: 'users view.tabs.password'
                }
            ],
            authStore: useAuthStore(),
            usersStore: useUsersStore(),
            librariesStore: useLibrariesStore(),
            rolesStore: useRolesStore(),
            t: useI18n().t,
            i18n: useI18n(),
        }
    },   
    watch: {
        selectedUser: {
            handler: async function (val) {
                if (val) {
                    console.log(val);
                    await this.fetchData();
                    if (this.previouslySelectedUsername != val.username ) {
                        this.rolesChanged = false;
                        this.initialRoleForUser = this.userRole;
                    }
                    this.previouslySelectedUsername = val.username;
                }
            },
            deep: true
        }
    },
    
    computed: {
        ...mapState(useSettingsStore, ['accessibility']),
        userRoleName() {
            return this.selectedUser ? this.selectedUser.role : '';
        },
        inputsAccessible() {
            return this.accessibility.inputsAccessible;
        },
        userTabsComputed() {
            return this.userTabs.map(tab => {
                return {
                    name: this.t(tab.name)
                }
            });
        },
        userRoles() {
            let result = [];
            for (let i = 0; i < this.roles.length; i++) {
                result.push({
                    name: this.roles[i].name,
                    enabled: this.roles[i].name == this.userRoleName ? 1 : 0
                });
            }
            return result;
        }
    },
    methods: {
        async selectTab(idx) {

            if (!this.selectedUser) {
                toastTTS('error', this.t('info.select a user first'));
                return;
            }

            this.selectedTabIdx = idx;

            if (idx == 1) {
                this.userLibraries = await this.librariesStore.getMyLibraries(this.selectedUser.id, true);
            } else if (idx == 2)          {
                this.selectedPasswordResetView = 0;
            }
        },
        addUser() {
            this.$router.push({ name: 'admin-add-user' });
        },
        changeAccess(userOrGlobal, where, library_name) {
            console.log("change access", where, library_name);

            let affectedGlobalLibraryIndex = this.globalLibraries.findIndex(library => library.library_name == library_name);

            if (where == 'see') {
                this.globalLibraries[affectedGlobalLibraryIndex].see_enabled = this.globalLibraries[affectedGlobalLibraryIndex].see_enabled == 1 ? 0 : 1;
            } else if (where == 'add') {
                this.globalLibraries[affectedGlobalLibraryIndex].add_enabled = this.globalLibraries[affectedGlobalLibraryIndex].add_enabled == 1 ? 0 : 1;
            } else if (where == 'delete') {
                this.globalLibraries[affectedGlobalLibraryIndex].delete_enabled = this.globalLibraries[affectedGlobalLibraryIndex].delete_enabled == 1 ? 0 : 1;
            }
            this.checkForChanges();
        },
        changeRole(role, action, newValue) {
            if (!this.selectedUser) {
                toastTTS('error', this.t('info.select a user first'));
                return;
            }
            this.selectedUser.role = newValue;
            this.rolesChanged = true;
            
        },
        async saveGlobalLibrariesChanges() {
            let changedLibraries = [];
            this.globalLibraries.forEach(library => {
                if (JSON.stringify(library) != JSON.stringify(this.initialGlobalLibraries.find(l => l.library_name == library.library_name))) {
                    changedLibraries.push(library);
                }
            });
            console.log("changedLibraries", changedLibraries);
            await this.librariesStore.saveGlobalLibrariesAccess(this.selectedUser.username, changedLibraries);

            if (this.rolesChanged) {
                let defaultRoleName = this.userRoles.find(role => role.enabled == 1).name;
                await this.rolesStore.saveDefaultRole(this.selectedUser.username, defaultRoleName);
                this.rolesChanged = false;
            }

            this.fetchData();
        },
        checkForChanges() {
            let changed = JSON.stringify(this.globalLibraries) != JSON.stringify(this.initialGlobalLibraries);
            console.log("changed", changed);
            this.thereAreGlobalLibrariesChanges = changed;
        },
        async fetchData() {
            //this.userLibraries = await this.store.getUserLibraries(this.selectedUser.username);

            this.users = await this.usersStore.getUsers();

            let result = await this.librariesStore.getGlobalLibraries(this.selectedUser.username);
            this.initialGlobalLibraries = JSON.parse(JSON.stringify(result));

            this.globalLibraries = result;
            let uResult = await this.librariesStore.getUserLibraries(this.selectedUser.username);
            this.userLibraries = uResult;    
            
            this.initialUserRoles = JSON.parse(JSON.stringify(this.userRoles));


            /*let roleData = await this.rolesStore.getUserRole(this.selectedUser.username);
            console.log("selected user", this.selectedUser, roleData);
            if (roleData) {
                this.userRole = roleData.role_name;
                for (let i = 0; i < this.userRoles.length; i++) {
                    this.userRoles[i].enabled = this.userRoles[i].name == this.userRole ? 1 : 0;
                }
            }*/

            this.checkForChanges();
        },
        async proceedPasswordReset() {
            let result = await this.usersStore.getUserAccessUrl(this.selectedUser.username);
            this.passwordResetLink = result.url;
            this.selectedPasswordResetView = 1;
            console.log(result);
        },
        async reloadSession() {
            if (!this.selectedUser) {
                toastTTS('error', this.t('info.select a user first'));
                return;
            }
            const result = await this.usersStore.reloadSession(this.selectedUser.username);
            if (result && result.message) {
                toastTTS('success', this.t('info.session reloaded'));
            }
        }
    },
    async mounted() {
        this.users = await this.usersStore.getUsers();
        if (this.authStore.user && this.authStore.user.username) {
            this.selectedUser = this.users.find(user => user.username == this.authStore.user.username);
        }
        this.roles = await this.rolesStore.getRoleNames();
   
    },    
    components: {
        DashboardTopNavigation,
        TabHeaderComponent,
        Button,
        VueFinalModal,
        NewLibrary,
        FontAwesomeIcon,
        VueMultiselect,
        LibraryAccess,
        UserRoles,
        BorderCard,
        RoleActionEnabled
    }
    
}

</script>

<style scoped>

@import '@/assets/css/containers.css';
@import '@/assets/css/inputs.css';
@import '@/assets/css/buttons.css';
@import '@/assets/css/paddings.css';

.user-select-container {
    width: 100%;
    max-width: 300px;
}

.libraries-container {
    display: ruby;
}

.library-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 300px;
    background-color: white;
    border-radius: 10px;
    margin: 10px;
    padding: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.library-card-header {

    font-size: 1.3rem;
    font-weight: bold;
}

.config-button {
    margin-right: 1.5rem;
    font-size: 1.5rem;
    cursor: pointer;
}

.user-select {
    width: 100%;
}

.mt-20 {
    margin-top: 20px;
}

.border-card {
    display: flex;
    flex-direction: column;
    font-size: 1rem;
}

.italics {
    font-style: italic;
}

.reset-password-link {
    text-wrap: wrap;
    overflow-wrap: anywhere;
}

.mb-1rem {
    margin-bottom: 1rem;
}

</style>