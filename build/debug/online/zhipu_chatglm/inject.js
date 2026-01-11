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
    const btn = document.querySelector('#search-input-box .enter img');
    if (btn) {
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
        });

        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
        });

        btn.dispatchEvent(mouseDownEvent);
        btn.dispatchEvent(mouseUpEvent);
    }
}

/**
 * When the client-side inputbox button in the toolbar clicks, this event will be triggered.
 * You can set the visibility of the inputbox in this event to ensure it remains consistent with the client-side button state. 
 * @param {*} visible: Whether the inputbox is visible
 * @returns whether changing the visibility of sidebar success.
 */
function onInputBoxVisibleChanged(visible) {
    const textArea = document.querySelector('textarea');
    if (!textArea) {
        return false;
    }
    const divDom = textArea.closest('div[class="input-outer"]');
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
    const btnArea = document.querySelector('div[class="btn-area"]');

    if (!btnArea || btnArea.children.length < 1) {
        return false;
    }
    const expandBtn = btnArea.children[0];
    const svg = expandBtn.querySelector('svg');
    if (visible) {
        if (!svg.classList.contains("expand-icon")) {
            expandBtn.click();
        }
        return true;
    } else {
        if (svg.classList.contains("expand-icon")) {
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
    const loginBtn = document.querySelector('div[class="login-btn"]');
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
    const list = document.querySelectorAll('div[class="history-list"] div[class="title"]');
    if (list.length == 0) {
        return;
    }
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
    if (themeValue == 1 && localStorage["SKIN_MODE"] != '1') {
        localStorage["SKIN_MODE"] = '1';
        location.reload();
    } else if (themeValue == 2 && localStorage["SKIN_MODE"] != '2') {
        localStorage["SKIN_MODE"] = '2';
        location.reload();
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
    const button = document.querySelector('div[class*="create-session"]');
    if (button) {
        button.click();
    }
}

/**
 * When the client-side question up button is clicked, this event will be triggered.
 * You can implement this event handler to location the previous question.
 */
function onQuestionUpButtonClicked() {
    const container = document.querySelector('div[class*="chatScrollContainer"]');
    if (!container) {
        return;
    }
    const list = container.querySelectorAll('div[class*="conversation-item"]');
    if (list.length == 0) {
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
    const container = document.querySelector('div[class*="chatScrollContainer"]');
    if (!container) {
        return;
    }
    const list = container.querySelectorAll('div[class*="conversation-item"]');
    if (list.length == 0) {
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
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        // 拦截特定请求
        if (url.includes('/mainchat-api/conversation/recent_list')) {
            this.addEventListener('load', () => {
                _parseConversationList(this.responseText);
            });
        } else if (url.includes('/mainchat-api/conversation/messages')) {
            this.addEventListener('load', () => {
                _parseConversationDetail(this.responseText);
            });
        }
        // 放行请求
        originalOpen.apply(this, arguments);
    };
}

function _parseConversationList(response) {
    const conversationList = JSON.parse(response).result.conversation_list;
    let conversationArray = [];
    for (let con of conversationList) {
        let newCon = {};
        newCon.id = con.conversation_id;
        newCon.title = con.title;
        newCon.subTitle = con.title;
        conversationArray.push(newCon);
    }
    invokeBrowserMethod("webConversationListUpdated", conversationArray);
}

function _parseConversationDetail(response) {
    const id = JSON.parse(response).result.conversation_id;
    if (id) {
        invokeBrowserMethod("webConversationChanged", id);
    }
}