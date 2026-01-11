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
    console.log('args:' + JSON.stringify(args))
    onAppThemeChanged(args.appTheme);

    let maxCnt = 10;
    const timerId = setInterval(()=>{
        console.log('onLoadEnded timer run')
        if (maxCnt-- < 0) {
            clearInterval(timerId);
            invokeBrowserMethod("webLoadEnded");
        }
        if (onInputBoxVisibleChanged(args.isInputBoxVisible) 
            && onSidebarVisibleChanged(true)) {
            if (!args.isSidebarVisible) {
                setTimeout(() => {
                    onSidebarVisibleChanged(args.isSidebarVisible)
                }, 1000);
            }
            clearInterval(timerId);
            invokeBrowserMethod("webLoadEnded");
        }
    }, 100);
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
    const url = window.location.href;
    if (url.match("\/chat\/[0-9a-zA-Z]+$")) {
        const id = url.substring(url.lastIndexOf("/") + 1);
        invokeBrowserMethod("webConversationChanged", id);
    }

    let maxCnt = 10;
    const timerId = setInterval(()=>{
        if (maxCnt-- < 0) {
            clearInterval(timerId);
        }
        if (onInputBoxVisibleChanged(args.isInputBoxVisible) 
            && onSidebarVisibleChanged(args.isSidebarVisible)) {
            clearInterval(timerId);
        }
    }, 100);
}

/**
 * When the text in the client-side input box changes, this event will be triggered.
 * You must implement this event handler to ensure text synchronization between the page's input field and the client-side input control.
 * @param {*} text: all the text in the client-side input box.
 */
function onInputTextChanged(text) {
    const inputElement = document.querySelector('textarea[data-testid="chat_input_input"]')
    if (inputElement) {
        const nativeTextareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeTextareaSetter.call(inputElement, text);
        const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
        });
        inputElement.dispatchEvent(inputEvent);
    }
}

/**
 * When the client-side send button clicks, this event will be triggered.
 * You must implement this event handler to ensure the input field content can be properly submitted when the client-side send button is clicked.
 */
function onInputTextSended() {
    const btn = document.querySelector('button[data-testid="chat_input_send_button"]');
    if (btn) {
        btn.click();
    }
}


/**
 * When the client-side inputbox button in the toolbar clicks, this event will be triggered.
 * You can set the visibility of the inputbox in this event to ensure it remains consistent with the client-side button state. 
 * @param {*} visible: Whether the inputbox is visible
 * @returns whether changing the visibility of sidebar success.
 */
function onInputBoxVisibleChanged(visible) {
    const inputBoxElement = document.querySelector('div[data-testid="chat_input"]');
    if (inputBoxElement) {
        inputBoxElement.style.display = visible ? 'block' : 'none';
        const innnerDom = inputBoxElement.closest('div[class*="inner"]');
        if (innnerDom) {
            const divDom = innnerDom.closest('div[class*="container"]');
            if (divDom) {
                divDom.style.display = visible ? 'block' : 'none';
            }
        }
        return true;
    }
    return false;
}

/**
 * When the client-side sidebar button clicks, this event will be triggered.
 * You can set the visibility of the sidebar in this event to ensure it remains consistent with the client-side button state.
 * @param {*} visible: Whether the sidebar is visible
 * @returns whether changing the visibility of sidebar is success.
 */
function onSidebarVisibleChanged(visible) {
    const openBtn = document.querySelector('div[data-testid="siderbar_closed_status_btn"]');
    const closeBtn = document.querySelector('div[data-testid="siderbar_close_btn"]');
    if (!openBtn && !closeBtn) {
        return false;
    }
    if (visible) {
        if (openBtn) {
            openBtn.click();
        }
        return true;
    } else {
        if (closeBtn) {
            closeBtn.click();
        }
    }
    return true;
}

/**
 * When the client-side login button is clicked, this event will be triggered.
 * If no user login, the login window need to be shown in this function.
 * The function need to be ignored if someone has logined.
 */
function onLoginButtonClicked() {
    const btn = document.querySelector('button[data-testid="to_login_button"]');
    if (btn) {
        btn.click();
    }
}

/**
 * When the client-side add image button is clicked, this event will be triggered.
 * @param {object} fileInfo: the file info
 * @param {ArrayBuffer} fileInfo.data: file data
 * @param {string} fileInfo.fileName: file name
 * @param {string} fileInfo.fileType: file type
 */
function onAddImageButtonClicked(fileInfo) {
    let isShowInputBox = false;
    if (!_isInputBoxVisible()) {
        isShowInputBox = true;
        onInputBoxVisibleChanged(true);
    }
    setTimeout(() => {
        const file = new File([fileInfo.data], fileInfo.fileName, { type: fileInfo.type });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput = document.querySelector('input[data-testid="upload-file-input"]');
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        if (isShowInputBox) {
            onInputBoxVisibleChanged(false);
        }
    }, 1000);
}

/**
 * When the client-side add file button is clicked, this event will be triggered.
 * @param {object} fileInfo: the file info
 * @param {ArrayBuffer} fileInfo.data: file data
 * @param {string} fileInfo.fileName: file name
 * @param {string} fileInfo.fileType: file type
 */
function onAddFileButtonClicked(fileInfo) {
    let isShowInputBox = false;
    if (!_isInputBoxVisible()) {
        isShowInputBox = true;
        onInputBoxVisibleChanged(true);
    }

    setTimeout(() => {
        const file = new File([fileInfo.data], fileInfo.fileName, { type: fileInfo.type });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput = document.querySelector('input[data-testid="upload-file-input"]');
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));

        if (isShowInputBox) {
            onInputBoxVisibleChanged(false);
        }
    }, 1000);
}


function _isInputBoxVisible() {
    const inputBoxElement = document.querySelector('div[data-testid="chat_input"]');
    if (inputBoxElement) {
        return inputBoxElement.style.display != 'none';
    }
    return false;
}

/**
 * When clicking on a sidebar conversation, this method will be invoked.
 * You must implement this method to ensure proper switching of conversations 
 * within the page when clicking on sidebar conversations.
 * @param {*} conversationId 
 */
function onConversationClicked(conversationId) {
    id = `conversation_${conversationId}`;
    const a = document.querySelector(`a[id=${id}]`);
    if (a) {
        a.click();
    }
}

/**
 * When the client theme is changed, this event will be triggered.
 * The webview theme need be changed when the client theme is changed.
 * @param {int} theme: 0 / system; 1 / light; 2 / dark;
 */
function onAppThemeChanged(theme) {
    const themeValue = Number(theme);
    const htmlDom = document.querySelector('html');
    if (themeValue == 0) {
    } else if (themeValue == 1) {
        DarkReader.disable();
    } else if (themeValue == 2) {
        DarkReader.setFetchMethod(window.fetch);
        DarkReader.enable({
            brightness: 85,
            contrast: 90,
            sepia: 0
        });
    }
}

/**
 * When the client language is changed, this event will be triggered.
 * The webview language need be changed when the client language is changed.
 * @param {int} language: 0 / system; 1 / EN; 2 / ZH;
 */
function onAppLanguageChanged(language) {
    // TODO
    // const langValue = Number(language);
    // if (langValue == 1 && localStorage.i18nextLng != "en") {
    //     localStorage.i18nextLng = "en";
    //     location.reload();
    // } else if (langValue == 2 && localStorage.i18nextLng != "zh") {
    //     localStorage.i18nextLng = "zh";
    //     location.reload();
    // } 
}

/**
 * When the client-side new chat button is clicked, this event will be triggered.
 * You can implement this event handler to ensure new chat is opened.
 */
function onNewChatButtonClicked() {
    const newChatBtn = document.querySelector('button[data-testid="create_conversation_button"]');
    if (newChatBtn) {
        newChatBtn.click();
    } else {
        const divBtn = document.querySelector('div[data-testid="create_conversation_button"] svg').closest('div');
        if (divBtn) {
            divBtn.click();
        }
    }
}

/**
 * When the client-side question up button is clicked, this event will be triggered.
 * You can implement this event handler to location the previous question.
 */
function onQuestionUpButtonClicked() {
    const container = document.querySelector('div[data-testid="message-list"]');
    const interContainer = container.querySelector('div[class*="inter-"]');
    if (!container || !interContainer || interContainer.childNodes.length == 0) {
        return;
    }
    const msgList = interContainer.childNodes;
    const list = Array.from(msgList).filter((currentValue) => {
        return currentValue.querySelectorAll('div[data-testid="send_message"]').length == 1;
    });
    const scrollTop = container.scrollTop;
    let index = list.length - 1;
    for(let i = 0; i < list.length; i++) {
        if (parseInt(list[i].offsetTop) >= parseInt(scrollTop)) {
            index = i - 1;
            while (index > 0 && Math.abs(list[index].offsetTop - scrollTop) < 10) {
                index -= 1;
            }
            break;
        }
    }
    if (index >= 0 && index < list.length) {
        container.scrollTo({ behavior: 'smooth', top: list[index].offsetTop });
    } else {
        alert("Has been scrolled to top.");
    }
}

/**
 * When the client-side question up button is clicked, this event will be triggered.
 * You can implement this event handler to location the next question.
 */
function onQuestionDownButtonClicked() {
    const container = document.querySelector('div[data-testid="message-list"]');
    const interContainer = container.querySelector('div[class*="inter-"]');
    if (!container || !interContainer || interContainer.childNodes.length == 0) {
        return;
    }
    const msgList = interContainer.childNodes;
    const list = Array.from(msgList).filter((currentValue) => {
        return currentValue.querySelectorAll('div[data-testid="send_message"]').length == 1;
    });
    const scrollTop = container.scrollTop;
    let index = 0;
    for(let i = list.length - 1; i >= 0; i--) {
        if (parseInt(list[i].offsetTop) <= parseInt(scrollTop)) {
            index = i + 1;
            while (index < list.length && Math.abs(list[index].offsetTop - scrollTop) < 10) {
                index += 1;
            }
            break;
        }
    }
    if (index >= 0 && index < list.length) {
        container.scrollTo({ behavior: 'smooth', top: list[index].offsetTop });
    } else {
        container.scrollTo({top: container.scrollHeight, behavior: 'smooth'});
        alert("Has been scrolled to bottom.");
    }
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
        if (url.includes('/im/chain/recent_conv')) {
            this.addEventListener('load', () => {
                _parseLoginConversationList(this.responseText);
            });
        } else if (url.includes('/samantha/feed/tourist_get')) {
            this.addEventListener('load', () => {
                _parseVisitorConversationList(this.responseText);
            });
        } else if (url.includes('/alice/conversation/info')) {
            this.addEventListener('load', () => {
                _parseConversationDetail(this.responseText);
            });
        }
        originalOpen.apply(this, arguments);
    };
}

function _parseLoginConversationList(response) {
    const conversationList = JSON.parse(response).downlink_body.pull_recent_conv_chain_downlink_body.cells;
    let conversationArray = [];
    for (let conversation of conversationList) {
        let newCon = {};
        con = conversation.conversation
        newCon.id = con.conversation_id;
        newCon.title = con.name;
        newCon.subTitle = con.name;
        conversationArray.push(newCon);
    }
    invokeBrowserMethod("webConversationListUpdated", conversationArray);
}

function _parseVisitorConversationList(response) {
    const conversationList = JSON.parse(response).data.threads.thread_list;
    let conversationArray = [];
    for (let conversation of conversationList) {
        let newCon = {};
        con = conversation.conversation
        newCon.id = con.conversation_id;
        newCon.title = con.name;
        newCon.subTitle = con.name;
        newCon.modelId = "";
        conversationArray.push(newCon);
    }
    invokeBrowserMethod("webConversationListUpdated", conversationArray);
}

function _parseConversationDetail(response) {
    const id = JSON.parse(response).data.conversation.conversation_id;
    invokeBrowserMethod("webConversationChanged", id);
}