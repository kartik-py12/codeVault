import { reconcileBtns } from "./button.js";
import { installRouteHooks,installNavObserver } from "./observers.js";
import { listenForExtraction } from "./connector.js";

function injectMainWorldScript(){
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("injected.js");
    script.onload = function(){
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
}


function start(){
    injectMainWorldScript();
    reconcileBtns();
    installRouteHooks();
    installNavObserver();
    listenForExtraction();
    // console.log("Content script initialized");

}

if(document.readyState === 'loading'){
    document.addEventListener("DOMContentLoaded", start);
} else {
    start();
}