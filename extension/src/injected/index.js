// This executes purely in the Main World, bypassing the Isolated World


// what needs to be done => 
    // create a wrapper around window.fetch such that we can intecept that netowork call from leetcode
    // and listins to submit success


const extractCode = () => {
    let editorData = "";
    if(window.monaco && window.monaco.editor){
        const models = window.monaco.editor.getModels();
        for(let i=0;i<models.length;i++){
            const currentContent = models[i].getValue().toString();
            if(currentContent.length > editorData.length){
                editorData = currentContent;
            }
        }
    }
    return editorData;
}

(function (){
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
        const resource = args[0];
        const url = typeof resource === "string" ? resource : resource.url;
        
        const response = await originalFetch.apply(this,args);

        if(url && url.includes('/submissions/detail/') && url.includes('/check/')){
            const clone = response.clone();

            clone.json().then(data => {
                console.log(data);
                if(data.state === "SUCCESS" && data.status_msg === "Accepted"){

                    //grab the code from Monaco
                    const code = extractCode();

                    window.postMessage({
                        type:"CODEVAULT_SUCCESS",
                        submissionStats:data,
                        code
                    },'*');

                    console.log(code);
                }
            }).catch(err => {
                console.error(err);
            });
        }
        return response;
    };
})();

