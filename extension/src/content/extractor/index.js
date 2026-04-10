import { extractFromMonaco } from "./monaco.js";

export async function runExtractor() {
    console.log("Extractor running... searching for Monaco...");
    
    // Wait for the Promise to resolve (either true or false)
    const isSuccess = await extractFromMonaco();
    
    if (!isSuccess) {
        console.log("Monaco not found yet. Retrying in 2 seconds...");
        // If it failed, wait 2 seconds and try again
        setTimeout(() => {
            runExtractor();
        }, 2000);
    } else {
        console.log("Extraction loop complete! Data captured.");
    }
}