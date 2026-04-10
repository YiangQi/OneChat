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
        if (maxCnt-- < 0) {
            clearInterval(timerId);
            invokeBrowserMethod("webLoadEnded");
        }
        if (onInputBoxVisibleChanged(args.isInputBoxVisible) 
            && onSidebarVisibleChanged(args.isInputBoxVisible)) {
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
    console.log(`onUrlChanged: ${JSON.stringify(args)} ready: ${document.readyState}`);
    let maxCnt = 10;
    const timerId = setInterval(()=>{
        if (maxCnt-- < 0) {
            clearInterval(timerId);
        }
        if (onInputBoxVisibleChanged(args.isInputBoxVisible) 
            && onSidebarVisibleChanged(args.isInputBoxVisible)) {
            clearInterval(timerId);
        }
    }, 100);
}

/**
 * When the text in the client-side input box changes, this event will be triggered.
 * You must implement this event handler to ensure text synchronization between the page's input field and the client-side input control.
 * @param {string} text: all the text in the client-side input box.
 */
function onInputTextChanged(text) {
    const inputElement = document.querySelector('.ql-editor.textarea');
    if (inputElement) {
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.value = text;
        inputElement.dispatchEvent(inputEvent);
        inputElement.querySelector('p').textContent = text;
    }
}

/**
 * When the client-side send button clicks, this event will be triggered.
 * You must implement this event handler to ensure the input field content can be properly submitted when the client-side send button is clicked.
 */
function onInputTextSended() {
    const btn = document.querySelector('button[class*="send-button"]');
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
    const textareaDom = document.querySelector('input-area-v2');
    if (!textareaDom) {
        return false;
    }
    textareaDom.style.display = visible ? 'block' : 'none';
    return true;
}

/**
 * When the client-side sidebar button in the toolbar clicks, this event will be triggered.
 * You can set the visibility of the sidebar in this event to ensure it remains consistent with the client-side button state.
 * @param {*} visible: Whether the sidebar is visible
 * @returns whether changing the visibility of sidebar success.
 */
function onSidebarVisibleChanged(visible) {
    const sidebar = document.querySelector('div[class*="sidenav-with-history-container"]');
    const menuDom = document.querySelector('button[data-test-id="side-nav-menu-button"]');
    if (!sidebar || !menuDom) {
        return false;
    }
    if (visible) {
        if (sidebar.classList.contains("collapsed")) {
            menuDom.click();
        }
        return true;
    } else {
        if (sidebar.classList.contains("expanded")) {
            menuDom.click();
        }
        return true;
    }
}

/**
 * When the client-side login button is clicked, this event will be triggered.
 * If no user login, the login window need to be shown in this function.
 * The function need to be ignored if someone has logined.
 */
function onLoginButtonClicked() {
    const loginBtn = document.querySelector('a[href*="accounts.google.com"]')
    if (loginBtn) {
        loginBtn.click();
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
    // TODO
    return true;
}

/**
 * When the client-side add file button is clicked, this event will be triggered.
 * @param {object} fileInfo: the file info
 * @param {ArrayBuffer} fileInfo.data: file data
 * @param {string} fileInfo.fileName: file name
 * @param {string} fileInfo.fileType: file type
 */
function onAddFileButtonClicked(fileInfo) {
    // TODO
    return true;
}

/**
 * When clicking on a sidebar conversation, this method will be invoked.
 * You must implement this method to ensure proper switching of conversations 
 * within the page when clicking on sidebar conversations.
 * @param {*} conversationId 
 * @param {*} conversationTitle
 */
function onConversationClicked(conversationId, conversationTitle) {
    const container = document.querySelector('div[class*="sidenav-with-history-container"]');
    if (!container) {
        return;
    }
    const list = container.querySelectorAll('div[data-test-id="conversation"]');
    let conversationArray = [];
    for (let child of list) {
        if(conversationTitle === child.innerText) {
            child.click();
        }
    }
}

/**
 * When the client theme is changed, this event will be triggered.
 * The webview theme need be changed when the client theme is changed.
 * @param {int} theme: 0 / system; 1 / light; 2 / dark;
 */
function onAppThemeChanged(theme) {
    const themeValue = Number(theme);
    if (themeValue == 1 && localStorage["Bard-Color-Theme"] != 'Bard-Light-Theme') {
        localStorage["Bard-Color-Theme"] = 'Bard-Light-Theme';
        location.reload();
    } else if (themeValue == 2 && localStorage["Bard-Color-Theme"] != 'Bard-Dark-Theme') {
        localStorage["Bard-Color-Theme"] = 'Bard-Dark-Theme';
        location.reload();
    }
}

/**
 * When the client-side new chat button is clicked, this event will be triggered.
 * You can implement this event handler to ensure new chat is opened.
 */
function onNewChatButtonClicked() {
    const btn = document.querySelector('side-nav-action-button[data-test-id="new-chat-button"]');
    if (btn && btn.children && btn.children.length > 0) {
        btn.children[0].click();
    }
}

/**
 * When the client-side question up button is clicked, this event will be triggered.
 * You can implement this event handler to location the previous question.
 */
function onQuestionUpButtonClicked() {
    const container = document.querySelector('infinite-scroller[data-test-id="chat-history-container"]');
    if (!container) {
        return;
    }
    const list = container.querySelectorAll('div[class*="conversation-container"]');
    const scrollTop = container.scrollTop + 16;
    let index = list.length - 1;
    for (let i = 0; i < list.length; i++) {
        if (parseInt(list[i].offsetTop) >= parseInt(scrollTop)) {
            index = i - 1;
            while (index > 0 && Math.abs(list[index].offsetTop - scrollTop) < 5) {
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
    const container = document.querySelector('infinite-scroller[data-test-id="chat-history-container"]');
    if (!container) {
        return;
    }
    const list = container.querySelectorAll('div[class*="conversation-container"]');
    const scrollTop = container.scrollTop + 16;
    let index = 0;
    for (let i = list.length - 1; i >= 0; i--) {
        if (parseInt(list[i].offsetTop) <= parseInt(scrollTop)) {
            index = i + 1;
            while (index < list.length && Math.abs(list[index].offsetTop - scrollTop) < 5) {
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
        // 拦截特定请求
        if (url.includes('/data/batchexecute')) {
            this.addEventListener('load', () => {
                setTimeout(() => {
                    parseConversationList();
                }, 1500);
            });
        } 
        // 放行请求
        originalOpen.apply(this, arguments);
    };
}


function parseConversationList() {
    const container = document.querySelector('conversations-list');
    if (!container) {
        return;
    }
    const list = container.querySelectorAll('div[data-test-id="conversation"]');
    let conversationArray = [];
    let selectId = "";
    for (let child of list) {
        let newCon = {};
        title = child.innerText;
        newCon.id = Math.random().toString(36).slice(-8);
        newCon.title = title;
        newCon.subTitle = title;
        conversationArray.push(newCon);
        if(child.classList.contains("selected")) {
            selectId = newCon.id;
        }
    }
    invokeBrowserMethod("webConversationListUpdated", conversationArray);
    if (selectId) {
        invokeBrowserMethod("webConversationChanged", selectId);
    }
}
