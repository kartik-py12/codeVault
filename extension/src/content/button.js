import {installNavObserver,getNavObserver} from "./observers.js";

const IDS = {
  mount: 'code-vault-nav-mount',
  save: 'code-vault-save-btn',
  git: 'code-vault-add-btn'
};

let isReconciling = false;


function findAnchor(){
  const settings = document.getElementById('nav-setting-btn');
  return settings && settings.parentElement ? settings.parentElement : null;
}

function ensureMount(anchor){
  const mounts = document.querySelectorAll(`#${IDS.mount}`);
  mounts.forEach((el,idx) =>{
    if(idx>0) el.remove();
  });

  let mount = document.getElementById(IDS.mount);
  if(!mount){
    mount = document.createElement("div");
    mount.id = IDS.mount;
    mount.className = 'codeVault-btn-container';
    mount.style.display = 'flex';
    mount.style.gap = '8px';
    mount.style.alignItems = 'center';

    const setting = document.getElementById('nav-setting-btn');
    anchor.insertBefore(mount,setting);
  }

  return mount;  
}

function createSaveBtn(){
  const saveBtn = document.createElement("button");
  saveBtn.id = IDS.save;
  saveBtn.type = 'button';
  saveBtn.classList.add('codeVault-btn');
  saveBtn.title = "Save to CodeVault";

  const saveImg = document.createElement("img");
  saveImg.src = chrome.runtime.getURL("/icons/save.svg");
  saveImg.alt = 'Save to CodeVault';
  saveImg.width = 25;
  saveImg.classList.add('codeVault-btn-icon');

  saveBtn.appendChild(saveImg);
  return saveBtn;
}

function createGithubBtn(){
  const gitBtn = document.createElement("button");
  gitBtn.id = IDS.git;
  gitBtn.type = 'button';
  gitBtn.classList.add("codeVault-btn");
  gitBtn.title = "Sync to Github";

  const githubImg = document.createElement("img");
  githubImg.src = chrome.runtime.getURL("/icons/github.svg");
  githubImg.alt = 'Sync to Github';
  githubImg.width = 25;
  githubImg.classList.add("codeVault-btn-icon");

  gitBtn.appendChild(githubImg);
  return gitBtn;
}


export function reconcileBtns(){
  if(isReconciling) return;
  const anchor = findAnchor();

  if(!anchor) return;

  const navObserver = getNavObserver();
  if(navObserver) navObserver.disconnect();
  isReconciling = true;

  try{
    const mount = ensureMount(anchor);
    
    if(!document.getElementById(IDS.save)){
      mount.appendChild(createSaveBtn());
    }
    
    if(!document.getElementById(IDS.git)){ 
      mount.appendChild(createGithubBtn());
    }
  }finally{
    isReconciling = false;
    installNavObserver();
  }
}
