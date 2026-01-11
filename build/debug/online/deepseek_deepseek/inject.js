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
    console.log('onLoadEnded:' + JSON.stringify(args));
    console.log(document.readyState);

    onAppThemeChanged(args.appTheme);
    onAppLanguageChanged(args.appLanguage);

    let maxCnt = 10;
    const timerId = setInterval(()=>{
        if (maxCnt-- < 0) {
            clearInterval(timerId);
            invokeBrowserMethod("webLoadEnded");
        }
        if (onInputBoxVisibleChanged(args.isInputBoxVisible) 
            && onSidebarVisibleChanged(true)) {
            if (!args.isSidebarVisible) {
                setTimeout(() => {
                    onSidebarVisibleChanged(false);
                }, 500);
            }
            _hideScrollAreaBar();
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
    let maxCnt = 10;
    const timerId = setInterval(()=>{
        if (maxCnt-- < 0) {
            clearInterval(timerId);
        }
        if (onInputBoxVisibleChanged(args.isInputBoxVisible) 
            && onSidebarVisibleChanged(args.isSidebarVisible)) {
            _hideScrollAreaBar();
            clearInterval(timerId);
        }
    }, 100);
}


function _hideScrollAreaBar() {
    const scrollDiv = document.querySelector('div[style*="scroll-nav-page"]');
    if (scrollDiv) {
        scrollDiv.style.display = 'none';
    }
}

/**
 * When the text in the client-side input box changes, this event will be triggered.
 * You must implement this event handler to ensure text synchronization between the page's input field and the client-side input control.
 * @param {*} text: all the text in the client-side input box.
 */
function onInputTextChanged(text) {
    const inputElement = document.querySelector('textarea')
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
    const btnSvgPath = document.querySelector('path[d*="M8.3125 0.981587C8.66767 1.0545 8.97902 1.20558 9.2627 1.43374C9.48724"]');
    const btn = btnSvgPath.closest('div');
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
    const inputElement = document.querySelector('textarea')
    if (!inputElement || !inputElement.parentElement ) {
        return false;
    }
    const inputBoxElement = inputElement.parentElement.parentElement ? inputElement.parentElement.parentElement.parentElement : null;
    if (inputBoxElement) {
        inputBoxElement.style.display = visible ? 'block' : 'none';
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
    const pathDomList = document.querySelectorAll('path[d*="M9.67272 0.522827C10.8339 0.522827 11.76 0.522701 12.4963 0.60248C13.2453 0.683644 13.8789"]');
    if (pathDomList.length > 2 || pathDomList.length == 0) {
        return false;
    }
    const divDom = pathDomList[0].closest('div[role="button"]');
    if (!divDom) {
        return false;
    }
    if (visible) {
        if (pathDomList.length == 2) {
            divDom.click();
        }
    } else {
        if (pathDomList.length == 1) {
            divDom.click();
        }
    }
    return true;
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
    fileInput = document.querySelector('input[type="file"]');
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
    fileInput = document.querySelector('input[type="file"]');
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * When clicking on a sidebar conversation, this method will be invoked.
 * You must implement this method to ensure proper switching of conversations 
 * within the page when clicking on sidebar conversations.
 * @param {*} conversationId 
 * @param {*} conversationTitle
 */
function onConversationClicked(conversationId) {
    const aDom = document.querySelector(`a[href*="${conversationId}"]`);
    if (aDom && aDom.children.length > 0) {
        aDom.children[0].click();
    }
}

/**
 * When the client theme is changed, this event will be triggered.
 * The webview theme need be changed when the client theme is changed.
 * @param {int} theme: 0 / system; 1 / light; 2 / dark;
 */
function onAppThemeChanged(theme) {
    const themeValue = Number(theme);
    const bodyDom = document.querySelector('body');
    if (themeValue == 0) {
    } else if (themeValue == 1) {
        bodyDom.removeAttribute('data-ds-dark-theme');
        bodyDom.classList.replace('dark', 'light')
    } else if (themeValue == 2) {
        bodyDom.classList.replace('light', 'dark')
        bodyDom.setAttribute('data-ds-dark-theme', 'dark');
    }
}

/**
 * When the client language is changed, this event will be triggered.
 * The webview language need be changed when the client language is changed.
 * @param {int} language: 0 / system; 1 / EN; 2 / ZH;
 */
function onAppLanguageChanged(language) {
    const langValue = Number(language);
    const localStr = localStorage["__appKit_@deepseek/chat_localePreference"]
    let localObj = {};
    if (localStr) {
        localObj = JSON.parse(localStr);
    } else {
        localObj = {
            "value": "",
            "__version": "0"
        }
    }
    if (langValue == 1 && localObj["value"] != "en_US") {
        localObj["value"] = "en_US";
        localStorage["__appKit_@deepseek/chat_localePreference"] = JSON.stringify(localObj);
        location.reload();
    } else if (langValue == 2 && localObj["value"] != "zh_CN") {
        localObj["value"] = "zh_CN";
        localStorage["__appKit_@deepseek/chat_localePreference"] = JSON.stringify(localObj);
        location.reload();
    } 
}

/**
 * When the client-side new chat button is clicked, this event will be triggered.
 * You can implement this event handler to ensure new chat is opened.
 */
function onNewChatButtonClicked() {
    const pathList = document.querySelectorAll('path[d*="M8 0.599609C3.91309 0.599609 0.599609 3.91309 0.599609 8C0.599609 9.13376 0.855461 10.2098 1.3125 11.1719L1.5918 11.7588L2.76562"]');
    if (!pathList || pathList.length == 0) {
        return;
    }
    pathList[0].closest('div').click();
}

/**
 * When the client-side question up button is clicked, this event will be triggered.
 * You can implement this event handler to location the previous question.
 */
function onQuestionUpButtonClicked() {
    const msgList = document.querySelectorAll('div[class*="ds-message"]');
    if (msgList.length == 0) {
        return;
    }
    const list = Array.from(msgList).filter((currentValue) => {
        return currentValue.querySelectorAll('div[class*="markdown"]').length == 0;
    });
    const container = list[0].closest('div[class*="ds-scroll-area"]');
    if (!container) {
        return;
    }
    const scrollTop = container.scrollTop;
    let index = list.length - 1;
    for(let i = 0; i < list.length; i++) {
        if (parseInt(list[i].parentElement.offsetTop) >= parseInt(scrollTop)) {
            index = i - 1;
            while (index > 0 && Math.abs(list[index].parentElement.offsetTop - scrollTop) < 5) {
                index -= 1;
            }
            break;
        }
    }
    if (index >= 0 && index < list.length) {
        list[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        alert("Has been scrolled to top.");
    }
}

/**
 * When the client-side question up button is clicked, this event will be triggered.
 * You can implement this event handler to location the next question.
 */
function onQuestionDownButtonClicked() {
    const msgList = document.querySelectorAll('div[class*="ds-message"]');
    if (msgList.length == 0) {
        return;
    }
    const list = Array.from(msgList).filter((currentValue) => {
        return currentValue.querySelectorAll('div[class*="markdown"]').length == 0;
    });

    const container = list[0].closest('div[class*="ds-scroll-area"]');
    if (!container) {
        return;
    }
    const scrollTop = container.scrollTop;
    let index = 0;
    for(let i = list.length - 1; i >= 0; i--) {
        console.log(`${list[i].parentElement.offsetTop} ${scrollTop}`)
        if (parseInt(list[i].parentElement.offsetTop) <= parseInt(scrollTop)) {
            index = i + 1;
            while (index < list.length && Math.abs(list[index].parentElement.offsetTop - scrollTop) < 5) {
                index += 1;
            }
            break;
        }
    }
    if (index >= 0 && index < list.length) {
        list[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        if (url.includes('/api/v0/chat_session/fetch_page')) {
            this.addEventListener('load', () => {
                _parseConversationList(this.responseText);
            });
        } else if (url.includes('/api/v0/chat/history_messages')) {
            _parseConversationChanged(url);
        }
        originalOpen.apply(this, arguments);
    };
}

function _parseConversationList(response) {
    const conversationList = JSON.parse(response).data.biz_data.chat_sessions;
    let conversationArray = [];
    for(let con of conversationList) {
        let newCon = {};
        newCon.id = con.id;
        newCon.title = con.title;
        newCon.subTitle = con.title;
        conversationArray.push(newCon);
    }
    invokeBrowserMethod("webConversationListUpdated", conversationArray);
}

function _parseConversationChanged(url) {
    const queryStr = url.substring(url.indexOf('?') + 1);
    const queryList = queryStr.split('&');
    for(let query of queryList) {
        const keyValue = query.split('=');
        if (keyValue[0] === "chat_session_id") {
            id = keyValue[1];
            invokeBrowserMethod("webConversationChanged", id);
        }
    }
}