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
            sendResponse({success:true, data: data.data.question});
        })
        .catch(err => {
            console.error(`graphql error: ${err.message}`);
            sendResponse({success:false,error: err.message});
        });

        return true; // Indicates that the response will be sent asynchronously
    }
})