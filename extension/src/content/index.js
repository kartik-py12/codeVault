import { reconcileBtns } from "./button.js";
import { installRouteHooks,installNavObserver } from "./observers.js";
import { runExtractor } from "./extractor/index.js";
function start(){
    reconcileBtns();
    installRouteHooks();
    installNavObserver();
    runExtractor();

}

if(document.readyState === 'loading'){
    document.addEventListener("DOMContentLoaded", start);
} else {
    start();
}