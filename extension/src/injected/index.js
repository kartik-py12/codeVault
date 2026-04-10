// src/injected/index.js

// This executes purely in the Main World, bypassing the Isolated World
(function() {
    try {
        if (window.monaco && window.monaco.editor) {
            const models = window.monaco.editor.getModels();
            
            const editorData = models.map(model => ({
                uri: model.uri.toString(),
                content: model.getValue()
            }));

            window.postMessage({ type: 'MONACO_EXTRACTED', success: true, payload: editorData }, '*');
        } else {
            window.postMessage({ type: 'MONACO_EXTRACTED', success: false }, '*');
        }
    } catch (e) {
        window.postMessage({ type: 'MONACO_EXTRACTED', success: false }, '*');
    }
})();