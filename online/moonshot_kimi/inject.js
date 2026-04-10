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
    console.log('onLoadEnded args:' + JSON.stringify(args))
    onAppThemeChanged(args.appTheme);

    let maxCnt = 10;
    const timerId = setInterval(() => {
        if (maxCnt-- < 0) {
            clearInterval(timerId);
            invokeBrowserMethod("webLoadEnded");
        }
        if (onInputBoxVisibleChanged(args.isInputBoxVisible)
            && onSidebarVisibleChanged(args.isSidebarVisible)) {
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
    const timerId = setInterval(() => {
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
 * @param {string} text: all the text in the client-side input box.
 */
function onInputTextChanged(text) {
    const editor = document.querySelector('.chat-input-editor');
    if (!editor) return;

    editor.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);

    editor.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'deleteContent',
        bubbles: true,
        cancelable: true
    }));

    editor.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: text,
        bubbles: true,
        cancelable: true
    }));
}

/**
 * When the client-side send button clicks, this event will be triggered.
 * You must implement this event handler to ensure the input field content can be properly submitted when the client-side send button is clicked.
 */
function onInputTextSended() {
    const btn = document.querySelector('div[class="send-button-container"]');
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
    const divDom = document.querySelector('div[class="chat-editor"]');
    if (!divDom) {
        return false;
    }
    if (divDom) {
        divDom.style.display = visible ? 'block' : 'none';
        return true;
    }
    return true;
}

/**
 * When the client-side sidebar button in the toolbar clicks, this event will be triggered.
 * You can set the visibility of the sidebar in this event to ensure it remains consistent with the client-side button state.
 * @param {*} visible: Whether the sidebar is visible
 * @returns whether changing the visibility of sidebar success.
 */
function onSidebarVisibleChanged(visible) {
    const expandBtn = document.querySelector('div[class*="icon-button expand-btn"]');

    if (!expandBtn) {
        return false;
    }
    if (visible) {
        const sidebar = document.querySelector('div[class*="sidebar-placeholder"]');
        if (sidebar && !sidebar.classList.contains("fold")) {
            expandBtn.click();
        }
        return true;
    } else {
        const sidebar = document.querySelector('div[class*="sidebar-placeholder"]');
        if (sidebar && sidebar.classList.contains("fold")) {
            expandBtn.click();
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
    const loginBtn = document.querySelector('div[class*="user-info-container"]');
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
function onConversationClicked(conversationId, conversationTitle) {
    onSidebarVisibleChanged(true);
    setTimeout(() => {
        divDom = document.querySelector(`a[href="/chat/${conversationId}"]`);
        if (divDom) {
            divDom.click();
        }
    }, 500);
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
        htmlDom.classList.remove("dark");
        htmlDom.classList.add("light");
    } else if (themeValue == 2) {
        htmlDom.classList.remove("light");
        htmlDom.classList.add("dark");
    }
}

/**
 * When the client language is changed, this event will be triggered.
 * The webview language need be changed when the client language is changed.
 * @param {int} language: 0 / system; 1 / EN; 2 / ZH;
 */
function onAppLanguageChanged(language) {
    const langValue = Number(language);
    console.log(`lang: ${langValue}`)
    // TODO
}

/**
 * When the client-side new chat button is clicked, this event will be triggered.
 * You can implement this event handler to ensure new chat is opened.
 */
function onNewChatButtonClicked() {
    const button = a = document.querySelector('a[href="/"]');
    if (button) {
        button.click();
    }
}

/**
 * When the client-side question up button is clicked, this event will be triggered.
 * You can implement this event handler to location the previous question.
 */
function onQuestionUpButtonClicked() {
    const list = document.querySelectorAll('div[class*="chat-content-item-user"]');
    if (list.length == 0) {
        return;
    }
    const container = document.querySelector('div[class="chat-detail-main"]');
    if (!container) {
        return;
    }
    const scrollTop = container.scrollTop;
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
        container.scrollTo({ top: list[index].offsetTop, behavior: 'smooth' });
    } else {
        alert("Has been scrolled to top.");
    }
}

/**
 * When the client-side question up button is clicked, this event will be triggered.
 * You can implement this event handler to location the next question.
 */
function onQuestionDownButtonClicked() {
    const list = document.querySelectorAll('div[class*="chat-content-item-user"]');
    if (list.length == 0) {
        return;
    }
    const container = document.querySelector('div[class="chat-detail-main"]');
    if (!container) {
        return;
    }
    const scrollTop = container.scrollTop;
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
        container.scrollTo({ top: list[index].offsetTop, behavior: 'smooth' });
    } else {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
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
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const [url, config] = args;
        const response = await originalFetch.apply(this, args);
        if (url) {
            if (url.includes('/apiv2/kimi.chat.v1.ChatService/ListChats')) {
                const cloneResponse = response.clone();
                const responseText = await cloneResponse.json();
                _parseConversationList(responseText);
            } else if (url.includes('/apiv2/kimi.gateway.chat.v1.ChatService/GetChat')) {
                const cloneResponse = response.clone();
                const responseText = await cloneResponse.json();
                _parseConversationDetail(responseText);
            }
        }
        return response;
    };
}

function _parseConversationList(response) {
    const conversationList = response.chats;
    let conversationArray = [];
    for (let con of conversationList) {
        let newCon = {};
        newCon.id = con.id;
        newCon.title = con.name;
        newCon.subTitle = con.name;
        conversationArray.push(newCon);
    }
    invokeBrowserMethod("webConversationListUpdated", conversationArray);
}

function _parseConversationDetail(response) {
    const id = response.chat.id;
    if (id) {
        invokeBrowserMethod("webConversationChanged", id);
    }
}