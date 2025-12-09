import { createRouter, createWebHistory } from 'vue-router'

import SearchView from '../views/SearchView.vue'
//import OperationsView from '../views/OperationsView.vue'
import PluginsView from '../views/PluginsView.vue'
import RepositoriesView from '../views/RepositoriesView.vue'
import LoginView from '../views/LoginView.vue'
import LogoutView from '../views/LogoutView.vue'
import DiscoverView from '../views/DiscoverView.vue'
import DiscoverByCategoryView from '../views/DiscoverByCategoryView.vue'
import HomeView from '../views/HomeView.vue'
import AdminLibrariesView from '../views/AdminLibrariesView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'
import AdminRolesView from '../views/AdminRolesView.vue'
import AdminAddUsersView from '../views/AdminAddUsersView.vue'
import UserProfileView from '../views/user/UserProfileView.vue'
//import UserProfileView from '../views/UserProfileView.vue'
import UploadView from '../views/user/UploadView.vue'
import ReaderView from '../views/ReaderView.vue'
import BookDetailsView from '../views/BookDetailsView.vue'
import BookListView from '../views/BookListView.vue'
import AuthorListView from '../views/AuthorListView.vue'
import UserSettingsView from '../views/user/UserSettingsView.vue'

import WelcomeUser from '../views/WelcomeUser.vue'

import { useSettingsStore } from '../stores/settings'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/search',
            name: 'search',
            meta: {
                requiresAuth: true
            },            
            component: SearchView
        },
        {
            path: '/upload',
            name: 'upload',
            meta: {
                requiresAuth: true
            },            
            component: UploadView
        },        
        {
            path: '/',
            name: 'home',
            meta: {
                requiresAuth: true
            },            
            component: HomeView
        },    
        {
            path: '/books/:libraryId?/:libraryName?',
            name: 'books',
            meta: {
                requiresAuth: true
            },            
            component: BookListView
        },     
        {
            path: '/books-by-author/:authorId?/:authorName?',
            name: 'books-by-author',
            meta: {
                requiresAuth: true
            },            
            component: BookListView
        },             
        {
            path: '/authors',
            name: 'authors',
            meta: {
                requiresAuth: true
            },            
            component: AuthorListView
        },                       
        {
            path: '/admin-libraries/:libraryType',
            name: 'admin-libraries',
            meta: {
                requiresAuth: true,
                admin: true
            },            
            component: AdminLibrariesView
        },      
        {
            path: '/admin-users',
            name: 'admin-users',
            meta: {
                requiresAuth: true,
                admin: true
            },            
            component: AdminUsersView
        },  
        {
            path: '/reader/:libraryId/:bookId/:formatId/:title',
            name: 'reader',
            meta: {
                requiresAuth: true,
                admin: false,
                noSidebar: true
            },            
            component: ReaderView
        },   
        {
            path: '/book/:libraryId/:bookId/:title',
            name: 'book',
            meta: {
                requiresAuth: true,
                admin: false,
                noSidebar: false
            },            
            component: BookDetailsView
        },                  
        {
            path: '/access-token',
            name: 'access-token',
            meta: {
                requiresAuth: false,
                admin: true,
                noSidebar: true,
                noTopBar: true
            },            
            component: WelcomeUser
        },    
        {
            path: '/user-profile',
            name: 'user-profile',
            meta: {
                requiresAuth: true,
            },            
            component: UserProfileView
        },      
        {
            path: '/user-settings',
            name: 'user-settings',
            meta: {
                requiresAuth: true,
            },            
            component: UserSettingsView
        },              
        {
            path: '/admin-add-user',
            name: 'admin-add-user',
            meta: {
                requiresAuth: true,
                admin: true
            },            
            component: AdminAddUsersView
        },           
        {
            path: '/admin-roles',
            name: 'admin-roles',
            meta: {
                requiresAuth: true,
                admin: true
            },            
            component: AdminRolesView
        },                   
        {
            path: '/discover',
            name: 'discover',
            meta: {
                requiresAuth: true
            },
            component: DiscoverView
        },
        {
            path: '/discover/:plugin/:categoryType/:category',
            name: 'discoverByCategory',
            meta: {
                requiresAuth: true
            },
            component: DiscoverByCategoryView
        },        
        {
            path: '/plugins',
            name: 'plugins',
            meta: {
                requiresAuth: true
            },
            component: PluginsView
        },
        {
            path: '/repositories',
            name: 'repositories',
            meta: {
                requiresAuth: true
            },            
            component: RepositoriesView
        },
        {
            path: '/login',
            name: 'login',
            meta: {
                requiresAuth: false,
                noSidebar: true
            },            
            component: LoginView
        },
        {
            path: '/logout',
            name: 'logout',
            meta: {
                requiresAuth: false,
                noSidebar: true
            },            
            component: LogoutView
        },
    ],
    scrollBehavior (to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
          } else {
            return { top: 0 }
          }
        }        
})

function getCookie(name) {
    const cookies = document.cookie.split(';');
    //console.log("cookies: ", cookies);
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
            return cookie.substring(name.length + 1);
        }
    }
    return null;
}

router.beforeEach((to, from, next) => {

    /*let toAcc = to.query.accessible;
    let fromAcc = from.query.accessible;

    if (toAcc == 'true' || toAcc == null || fromAcc == 'true' || fromAcc == null) {
        const settingsStore = useSettingsStore();
        for (const key in settingsStore.accessibility) {
            //settingsStore.setAccessibilityProperty(key, true);
        }
    } else if (toAcc == 'false') {
        const settingsStore = useSettingsStore();
        // TODO: FETCH THE SETTINGS AGAIN AND RESTORE ACCESSIBILITY SETTINGS      
    }*/

    if (to.matched.some(record => record.meta.requiresAuth)) {
        let token = getCookie('token');
        let session = getCookie('connect.sid');
        if (token) {
            // user is authenticated, proceed
            next();
            return;
        } else {
            // user is not authenticated, redirect to login
            next({ path: '/login' });
            return;
        }
    } else {
        // non protected route
        next();
    }
});

/*router.afterEach((to, from) => {
    console.log("router afterEach: ", to, from); 
});*/

export default router
