function getTitleSlug(){
    const pathParts = window.location.pathname.split("/");
    const problemIndex = pathParts.indexOf("problems");
    return (problemIndex !== -1 && pathParts.length > problemIndex+1)
        ? pathParts[problemIndex+1]
        : null; 
}

export function listenForExtraction(){
    window.addEventListener('message',(event) => {
        
        if (event.origin !== "https://leetcode.com") return;
        if (event.data?.type !== "CODEVAULT_SUCCESS") return;
        
        console.log("Received message:", event.data);

        const {submissionStats,code} = event.data;
        const titleSlug = getTitleSlug();
        console.log(`Extracted titleSlug: ${titleSlug}`);

        if(!titleSlug) return;

        // 1. Fetch metadata from background
        chrome.runtime.sendMessage(
            {type:"FETCH_METADATA", titleSlug},
            (response) => {
                if(response && response.success){
                    const finalPayload = {
                        stats: submissionStats,
                        userCode: code,
                        problemDetails: response.data
                    };

                    // 2. 🛡️ Send payload to background script to attach JWT and sync to backend
                    chrome.runtime.sendMessage(
                        { type: "SYNC_LEETCODE_DATA", payload: finalPayload },
                        (syncResponse) => {
                            if (syncResponse && syncResponse.success) {
                                console.log("✅ Successfully synced to CodeVault backend!");
                            } else {
                                console.error("❌ Backend sync failed:", syncResponse?.error);
                            }
                        }
                    );

                } else {
                    console.error("❌ Failed to fetch problem metadata. Reason:", response?.error);
                }
            }
        )
    });
}