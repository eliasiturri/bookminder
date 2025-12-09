import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
    state: () => {
        return {
            username: "",
            settings: {},
            orderSelectedArrow: undefined,
            orderState: {},
            language: "en",
            selectedTheme: "dark",
            theme: {
                light: {
                    logoColor: '#ffffff',
                    sidebarTextColor: '#ffffff',
                    sidebarBgColor: '#101010',
                    topbarTextColor: '#ffffff',
                    topbarBgColor: '#202020',
                    primaryBgColor: '#3b3b3b',
                    secondaryBgColor: '#3b3b3b',
                    primaryTextColor: '#000000',
                    secondaryTextColor: '##3b3b3b',
                    focusRingColor: '#000000'
                },
                dark: {
                    logoColor: '#ffffff',
                    sidebarTextColor: '#ffffff',
                    sidebarBgColor: '#101010',
                    topbarTextColor: '#ffffff',
                    topbarBgColor: '#202020',                    
                    primaryBgColor: '#3b3b3b',
                    secondaryBgColor: '#3b3b3b',
                    primaryTextColor: '#ffffff',
                    secondaryTextColor: '##3b3b3b',
                    focusRingColor: '#ffffff'
                },
                custom: {
                    logoColor: '#ffffff',
                    sidebarTextColor: '#ffffff',
                    sidebarBgColor: '#3b3b3b',
                    topbarTextColor: '#ffffff',
                    topbarBgColor: '#202020',                    
                    primaryBgColor: '#3b3b3b',
                    secondaryBgColor: '#3b3b3b',
                    primaryTextColor: '#ffffff',
                    secondaryTextColor: '##3b3b3b',
                    focusRingColor: '#ffffff'
                }
            },
            
            themeDefaults: {
                light: {
                    logoColor: '#ffffff',
                    sidebarTextColor: '#ffffff',
                    sidebarBgColor: '#101010',
                    topbarTextColor: '#ffffff',
                    topbarBgColor: '#202020',
                    primaryBgColor: '#3b3b3b',
                    secondaryBgColor: '#3b3b3b',
                    primaryTextColor: '#000000',
                    secondaryTextColor: '##3b3b3b',
                    focusRingColor: '#000000'
                },
                dark: {
                    logoColor: '#ffffff',
                    sidebarTextColor: '#ffffff',
                    sidebarBgColor: '#101010',
                    topbarTextColor: '#ffffff',
                    topbarBgColor: '#101010',                    
                    primaryBgColor: '#202020',
                    secondaryBgColor: '#3b3b3b',
                    primaryTextColor: '#ffffff',
                    secondaryTextColor: '##3b3b3b',
                    focusRingColor: '#ffffff'
                },
                custom: {
                    logoColor: '#ffffff',
                    sidebarTextColor: '#ffffff',
                    sidebarBgColor: '#3b3b3b',
                    topbarTextColor: '#ffffff',
                    topbarBgColor: '#202020',                    
                    primaryBgColor: '#3b3b3b',
                    secondaryBgColor: '#3b3b3b',
                    primaryTextColor: '#ffffff',
                    secondaryTextColor: '##3b3b3b',
                    focusRingColor: '#ffffff'
                }
            },
            themeDescription: {
                titles: {
                    light: 'Light Theme',
                    dark: 'Dark Theme',
                    custom: 'Custom Theme'
                },
                colors: {
                    logoColor: 'Logo Color',
                    sidebarTextColor: 'Sidebar Text Color',
                    sidebarBgColor: 'Sidebar Background Color',
                    topbarTextColor: 'Top Bar Text Color',
                    topbarBgColor: 'Top Bar Background Color',
                    primaryBgColor: 'Primary Background Color',
                    secondaryBgColor: 'Secondary Background Color',
                    primaryTextColor: 'Primary Text Color',
                    secondaryTextColor: 'Secondary Text Color',
                    focusRingColor: 'Focus Ring Color'
                }
            },
            accessibility: {
                fullyAccessible: false,
                avatarAccessible: false,
                homeAccessible: false,
                modalsAccessible: false,
                contrastAccessible: true,
                inputsAccessible: true,
            },
            accessibilityProperties: [
                'fullyAccessible', 
                'avatarAccessible', 
                'homeAccessible', 
                'modalsAccessible', 
                'contrastAccessible', 
                'inputsAccessible'
            ],
            errorAccessibility: {
                closeToastAfter: 5000,
                speakToastAloud: true,
            },
            behavior: {
                closeSidebarOnClick: true,
                maxWindowWidth: 800,
            },
            homeDisplay: {
                maxContinueReading: 16,
                maxRecentlyAdded: 16,
            }
                    
            
        };
    },
    getters: {

    },
    setters: {
        setUsername(username) {
            this.username = username;
        }
    },
    actions: {
        async updateSettings() {

            var data = await SettingsDataService.getSettings();
            var localLastModified = this.settings.lastModified;
            console.log("settings last mod local", localLastModified);
            console.log("server settings", data.settings);
            if (localLastModified == undefined || localLastModified < data.settings.lastModified || true == true) { // TODO: fix
                console.log('settings needs update', data.settings);
                this.settings = data.settings;
            }
        },
        updateBooksPerPage(n) {
            this.settings.booksPerPage = n;
        },
        updateSelectedArrow(v) {
            this.selectedArrow = v;
        },
        upateArrorOrder(e, v) {
            this.orderState[e] = v;
        },
        doSshowRatingOrTitle(value) {
            //this.settings.showRatingOrTitle = value;
        },
        async hideImport() {
            this.settings.show_import_calibre = false;
        },
        setLanguage(lang) {
            this.language = lang;
        },
        restoreThemeDefaults(themeKey) {
            console.log("themeKey", themeKey);
            for (var key in this.theme[themeKey]) {
                this.theme[themeKey][key] = this.themeDefaults[themeKey][key];
            }
        },
        reloadStateFromStorage() {
            // Get persisted data from localStorage
            const savedState = localStorage.getItem('settings'); // 'main' matches the store name
            if (savedState) {
                // Parse and overwrite the current state
                const parsedState = JSON.parse(savedState);
                Object.assign(this.$state, parsedState); // Merge the saved state into the current state
            }
        },   
        setAccessibilityProperty(prop, value) {
            this.accessibility[prop] = value;
        }     


    },
    persist: true
});
