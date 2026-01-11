/**
 * When the page finishes loading (DOM completely loads), this event will be triggered.
 * You must call invokeBrowserMethod("webLoadEnded")within this method to instruct the client to hide the loading animation.
 * Otherwise, the animation will persist until timeout. 
 * Additionally, you may perform page initialization tasks here, such as hiding the sidebar, input fields, setting button states, theme colors, etc.
 * @param {object} args: Client-side initialization parameters.
 * @param {boolean} args.isInputBoxVisible: Whether to show the input box.
 * @param {boolean} args.isSidebarVisible: Whether to show the sidebar.
 * @param {boolean} args.isDeepThinkChecked: Whether to check the deep think button.
 * @param {boolean} args.isWebSearchChecked: Whether to check the websearch button.
 * @param {Number} args.appTheme: The client theme. 0 / system; 1 / light; 2 / dark.
 */
function onLoadEnded(args) {
    // TODO
    invokeBrowserMethod("webLoadEnded");
}

/**
 * When the url changed such as switching conversation, this event will be triggered.
 * You should set the status of button as same as 'onLoadEnded' event.
 * @param {object} args: Client-side initialization parameters.
 * @param {boolean} args.isInputBoxVisible: Whether to show the input box.
 * @param {boolean} args.isSidebarVisible: Whether to show the sidebar.
 * @param {boolean} args.isDeepThinkChecked: Whether to check the deep think button.
 * @param {boolean} args.isWebSearchChecked: Whether to check the websearch button.
 * @param {Number} args.appTheme: The client theme. 0 / system; 1 / light; 2 / dark.
 */
function onUrlChanged(args) {
    console.log(`onUrlChanged: ${JSON.stringify(args)}`);
    if (document.readyState !== "complete") {
        return
    }
    onAppThemeChanged(args.appTheme);
    onInputBoxVisibleChanged(args.isInputBoxVisible);
    onSidebarVisibleChanged(args.isSidebarVisible);
    onWebSearchButtonChecked(args.isWebSearchChecked);
}

/**
 * When the text in the client-side input box changes, this event will be triggered.
 * You must implement this event handler to ensure text synchronization between the page's input field and the client-side input control.
 * @param {string} text: all the text in the client-side input box.
 */
function onInputTextChanged(text) {
    // TODO
}

/**
 * When the client-side send button clicks, this event will be triggered.
 * You must implement this event handler to ensure the input field content can be properly submitted when the client-side send button is clicked.
 */
function onInputTextSended() {
   // TODO
}

/**
 * When the client-side inputbox button in the toolbar clicks, this event will be triggered.
 * You can set the visibility of the inputbox in this event to ensure it remains consistent with the client-side button state. 
 * @param {*} visible: Whether the inputbox is visible
 * @returns whether changing the visibility of sidebar success.
 */
function onInputBoxVisibleChanged(visible) {
    // TODO
    return true;
}

/**
 * When the client-side sidebar button in the toolbar clicks, this event will be triggered.
 * You can set the visibility of the sidebar in this event to ensure it remains consistent with the client-side button state.
 * @param {*} visible: Whether the sidebar is visible
 * @returns whether changing the visibility of sidebar success.
 */
function onSidebarVisibleChanged(visible) {
    // TODO
    return true;
}

/**
 * When the client-side login button is clicked, this event will be triggered.
 * If no user login, the login window need to be shown in this function.
 * The function need to be ignored if someone has logined.
 */
function onLoginButtonClicked() {
    //TODO
}

/**
 * When the client-side add image button is clicked, this event will be triggered.
 * @param {object} fileInfo: the file info
 * @param {ArrayBuffer} fileInfo.data: file data
 * @param {string} fileInfo.fileName: file name
 * @param {string} fileInfo.fileType: file type
 */
function onAddImageButtonClicked(fileInfo) {
    const file = new File([fileInfo.data], fileInfo.fileName, { type: fileInfo.type });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput = document.querySelector('button[class*="uploader-image"] input');
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * When the client-side add file button is clicked, this event will be triggered.
 * @param {object} fileInfo: the file info
 * @param {ArrayBuffer} fileInfo.data: file data
 * @param {string} fileInfo.fileName: file name
 * @param {string} fileInfo.fileType: file type
 */
function onAddFileButtonClicked(fileInfo) {
    const file = new File([fileInfo.data], fileInfo.fileName, { type: fileInfo.type });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    fileInput = document.querySelector('button[class*="uploader-pdf"] input');
    if (!fileInput) {
        const uploadBtn = document.querySelector('span[class*="upload-icon"]');
        uploadBtn.click();
        setTimeout(() => {
            // Hide upload menu
            const inputElement = document.querySelector('[contenteditable=true]');
            inputElement.click();
            //
            fileInput = document.querySelector('button[class*="uploader-pdf"] input');
            fileInput.files = dataTransfer.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }, 0);
    } else {
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

/**
 * When clicking on a sidebar conversation, this method will be invoked.
 * You must implement this method to ensure proper switching of conversations 
 * within the page when clicking on sidebar conversations.
 * @param {*} conversationId 
 * @param {*} conversationTitle
 */
function onConversationClicked(conversationId) {
    //TODO
}

/**
 * When the client theme is changed, this event will be triggered.
 * The webview theme need be changed when the client theme is changed.
 * @param {int} theme: 0 / system; 1 / light; 2 / dark;
 */
function onAppThemeChanged(theme) {
    const themeValue = Number(theme);
    const htmlDom = document.querySelector('html');
    if (themeValue == 1) {
        htmlDom.setAttribute('yb-theme-mode', 'light');
    } else if (themeValue == 2) {
        htmlDom.setAttribute('yb-theme-mode', 'dark');
    }
}

/**
 * When the client language is changed, this event will be triggered.
 * The webview language need be changed when the client language is changed.
 * @param {int} language: 0 / system; 1 / EN; 2 / ZH;
 */
function onAppLanguageChanged(language) {
    const langValue = Number(language);
    if (langValue == 1) {
        // EN
    } else if (langValue == 2) {
        // ZH
    } 
}

/**
 * When the client-side new chat button is clicked, this event will be triggered.
 * You can implement this event handler to ensure new chat is opened.
 */
function onNewChatButtonClicked() {

}

/**
 * When the client-side question up button is clicked, this event will be triggered.
 * You can implement this event handler to location the previous question.
 */
function onQuestionUpButtonClicked() {

}

/**
 * When the client-side question up button is clicked, this event will be triggered.
 * You can implement this event handler to location the next question.
 */
function onQuestionDownButtonClicked() {

}

/**
 * When the script executes, this method will be mounted to capture request data.
 * You need to capture the conversation list request within this method, 
 * then call 'invokeBrowserMethod("webConversationListUpdated", conversationArray);' 
 * to update the sidebar's conversation list.
 * You also need to capture the current conversation list in this method, 
 * then call 'invokeBrowserMethod("webConversationChanged", id);' 
 * to make the sidebar select the current conversation.
 */
function hookHttpsRequest() {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        if (url.includes('/api/conversation/list')) {
            this.addEventListener('load', () => {
                _parseConversationList(this.responseText);
            });
        } else if (url.includes('/api/model/list')) {
            this.addEventListener('load', () => {
                _parseModelList(this.responseText);
            });
        } else if (url.includes('/api/conversation/detail')) {
            this.addEventListener('load', () => {
                _parseConversationDetail(this.responseText);
            });
        }
        originalOpen.apply(this, arguments);
    };
}

function _parseConversationList(response) {
    const conversationList = JSON.parse(response).conversations;
    let conversationArray = [];
    for (let con of conversationList) {
        let newCon = {};
        newCon.id = con.id;
        newCon.title = con.title;
        newCon.subTitle = con.subTitle;
        newCon.modelId = con.chatModelId;
        conversationArray.push(newCon);
    }
    invokeBrowserMethod("webConversationListUpdated", conversationArray);
}

function _parseModelList(response) {
    const modelList = JSON.parse(response).modelList;
    let modelArray = [];
    for(let model of modelList) {
        let newModel = {}
        newModel.id = model.chatModelId;
        newModel.name = model.modelName;
        newModel.desc = model.modelDesc;
        modelArray.push(newModel)
    }
    invokeBrowserMethod("webModelListUpdated", modelArray);
}

function _parseConversationDetail(response) {
    const id = JSON.parse(response).id;
    invokeBrowserMethod("webConversationChanged", id);
}