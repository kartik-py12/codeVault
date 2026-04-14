chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.type === "FETCH_METADATA"){
        const query = `
        query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
                questionId
                title
                difficulty
                content
                hints
                topicTags{
                    name
                }
            }
        }`;

        fetch("https://leetcode.com/graphql",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                query,
                variables:{
                    titleSlug: request.titleSlug
                }
            })
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({
                success: true,
                data: {
                    ...data.data.question,
                    titleSlug: request.titleSlug
                }
            });
        })
        .catch(err => {
            console.error(`graphql error: ${err.message}`);
            sendResponse({success:false, error: err.message});
        });

        return true;
    }

    if (request.type === "SYNC_LEETCODE_DATA") {
        
        chrome.cookies.get({ url: 'http://localhost:5173', name: 'codevault_jwt' }, async (cookie) => {
            
            if (!cookie) {
                console.error("Sync Failed: User is not logged in to CodeVault.");
                sendResponse({ success: false, error: "Not logged in to CodeVault" });
                return;
            }

            const jwtToken = cookie.value;

            try {
                const backendRes = await fetch("http://localhost:3000/api/sync", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${jwtToken}` 
                    },
                    body: JSON.stringify(request.payload)
                });

                const result = await backendRes.json();
                console.log("Backend response:", result);
                
                if (backendRes.ok) {
                    sendResponse({ success: true, data: result });
                } else {
                    sendResponse({ success: false, error: result.error });
                }

            } catch (error) {
                console.error("❌ Network error sending data to backend:", error);
                sendResponse({ success: false, error: error.message });
            }
        });

        return true; // Indicates async response
    }
});