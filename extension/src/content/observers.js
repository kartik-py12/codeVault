import { reconcileBtns } from "./button.js";


function debounce(fn,wait){
    let timeout = null;
    return function(...args){
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            fn(...args);
        }, wait);
    }
}

const debouncedReconcile = debounce(reconcileBtns,120);

let navObserver = null;

export function getNavObserver(){
  return navObserver;
}

export function installRouteHooks(){
  const originalPush = history.pushState;
  const originalReplace = history.replaceState;

  function onRouteChange(){
    debouncedReconcile();
    installNavObserver();
  }

  history.pushState = function(...args){
    const ret = originalPush.apply(this,args);
    onRouteChange();
    return ret;
  }

  history.replaceState = function(...args){
    const ret = originalReplace.apply(this,args);
    onRouteChange();
    return ret;
  };

  window.addEventListener("popstate",onRouteChange);
}


function findObserveredRoot(){
  return document.querySelector('nav') || document.body;
}

export function installNavObserver(){
  const root = findObserveredRoot();
  if(!root) return;

  if(navObserver) navObserver.disconnect();

  navObserver = new MutationObserver(() => {
    debouncedReconcile();
  });

  navObserver.observe(root,{
    childList:true,
    subtree:true
    });
  }