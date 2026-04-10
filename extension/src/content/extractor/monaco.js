// src/content/monaco.js
const extractFromMonaco = () => {
    console.log("extracting from monacoo...");
    return new Promise((resolve) => {
        const messageListener = (event) => {
            if (event.source !== window || event.data?.type !== 'MONACO_EXTRACTED') return;
            
            window.removeEventListener('message', messageListener);

            if (event.data.success) {
                console.log("Successfully retrieved LeetCode from Main World:", event.data.payload);
                resolve(true); 
            } else {
                resolve(false);
            }
        };

        window.addEventListener('message', messageListener);

        const script = document.createElement('script');
        // Pointing to the compiled file Vite placed in the dist folder
        script.src = chrome.runtime.getURL('injected.js'); 
        
        script.onload = () => {
            script.remove(); // Keep the DOM clean
        };

        (document.head || document.documentElement).appendChild(script);
    });
}

export { extractFromMonaco };