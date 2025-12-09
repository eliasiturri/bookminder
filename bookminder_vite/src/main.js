import './assets/main.css'

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'
import { createVfm } from 'vue-final-modal'
const vfm = createVfm()
import 'vue-final-modal/style.css'

import { ObserveVisibility } from 'vue3-observe-visibility/src'


import VueSafeHTML from 'vue-safe-html';
import Vue3Toastify from 'vue3-toastify';

import VueLazyload from '@jambonn/vue-lazyload'

import Vue3TouchEvents from "vue3-touch-events";

import 'vue3-toastify/dist/index.css';
import en from './i18n/en.json'
import sv from './i18n/sv.json'
import es from './i18n/es.json'
const enMessages = Object.assign(en)
const svMessages = Object.assign(sv)
const esMessages = Object.assign(es)


const i18n = createI18n({
    locale: import.meta.env.VITE_DEFAULT_LOCALE, // <--- 1
    //fallbackLocale: import.meta.env.VITE_FALLBACK_LOCALE, // <--- 2
    fallbackLocale: 'en',
    legacy: false,
    messages: {
        en: enMessages,
        sv: svMessages,
        es: esMessages
    }
})




const app = createApp(App);

const pinia = createPinia();

pinia.use(piniaPluginPersistedstate)
app.use(pinia);
app.directive('observe-visibility', ObserveVisibility);

app.use(Vue3Toastify,
    {
      autoClose: 5000,
      transition: "slide",
    } 
);

app.use(vfm)

app.use(i18n);


app.use(VueLazyload, {
    preLoad: 1.3,
    attempt: 1
})

app.use(Vue3TouchEvents);




app.use(router);





//app.use(createPinia())
app.use(VueSafeHTML, {
    allowedTags: ['a', 'b', 'br', 'strong', 'i', 'em', 'mark', 'small', 'del', 'ins', 'sub', 'sup']
});

app.config.compilerOptions.isCustomElement = (tag) => ['foliate-view'].includes(tag);

app.mount('#app')
