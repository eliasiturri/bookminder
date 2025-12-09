import { useSettingsStore } from '../stores/settings';
import { toast } from 'vue3-toastify';

export const tts = (text, lang) => {
    let wTts = window.speechSynthesis || speechSynthesis;
    let utter = new SpeechSynthesisUtterance();
    utter.text = text;
    if (lang) {
        utter.lang = lang;
    }


    wTts.speak(utter);

    window.onbeforeunload = function(){
        wTts.cancel();
    }
};

export const toastTTS = (type, text) => {
    let speakAloud = useSettingsStore().errorAccessibility.speakToastAloud;
    let autoclose = useSettingsStore().errorAccessibility.closeToastAfter;
    let language = useSettingsStore().language;
    if (!language) { language = "en"; }

    if (speakAloud) { tts(text, language); }
    toast(text, {
        "type": type,
        "autoClose": autoclose,
        "transition": "slide"
    });
};