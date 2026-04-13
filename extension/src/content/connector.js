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

        chrome.runtime.sendMessage(
            {type:"FETCH_METADATA", titleSlug},
            async (response) => {
                if(response && response.success){
                    const finalPayload = {
                        stats: submissionStats,
                        userCode: code,
                        problemDetails: response.data
                    };

                    try {
                        const backendRes = await fetch("http://localhost:3000/api/sync",{
                            method:"POST",
                            headers:{
                                "Content-Type":"application/json"
                            },
                            body: JSON.stringify(finalPayload)
                        });

                        const result = await backendRes.json();
                        console.log("Backend response:", result);
                    } catch (error) {
                        console.error("Error sending data to backend:", error);
                    }
                }else{
console.error("❌ Failed to fetch problem metadata. Reason:", response?.error);                }
            }
        )
    })
}