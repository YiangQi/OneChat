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
    console.log('args:' + JSON.stringify(args));
    if (!window.location.href.startsWith("https://grok.com")) {
        invokeBrowserMethod("webLoadEnded");
        return;
    }
    onAppThemeChanged(args.appTheme);

    let maxCnt = 10;
    const timerId = setInterval(()=>{
        if (maxCnt-- < 0) {
            clearInterval(timerId);
            invokeBrowserMethod("webLoadEnded");
            _addNavibarObserver();
        }
        if (onInputBoxVisibleChanged(args.isInputBoxVisible) 
            && onSidebarVisibleChanged(args.isSidebarVisible)) {
            clearInterval(timerId);
            invokeBrowserMethod("webLoadEnded");
            _addNavibarObserver();
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
    if (url.match("\/c\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")) {
        const id = url.substring(url.lastIndexOf("/") + 1);
        invokeBrowserMethod("webConversationChanged", id);
    }
    if (!window.location.href.startsWith("https://grok.com")) {
        return;
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
 * @param {string} text: all the text in the client-side input box.
 */
function onInputTextChanged(text) {
    const inputElement = document.querySelector('div[contenteditable=true]');
    if (inputElement) {
        const p = inputElement.querySelector('p');
        p.textContent = text;
    }
}

/**
 * When the client-side send button clicks, this event will be triggered.
 * You must implement this event handler to ensure the input field content can be properly submitted when the client-side send button is clicked.
 */
function onInputTextSended() {
    const btn = document.querySelector('button[type="submit"]');
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
    const form = document.querySelector('form');
    if (!form) {
        return false;
    }
    form.style.display = visible ? 'block' : 'none';
    return true;
}

/**
 * When the client-side sidebar button in the toolbar clicks, this event will be triggered.
 * You can set the visibility of the sidebar in this event to ensure it remains consistent with the client-side button state.
 * @param {*} visible: Whether the sidebar is visible
 * @returns whether changing the visibility of sidebar success.
 */
function onSidebarVisibleChanged(visible) {
    const button = document.querySelector('button[data-sidebar="trigger"]');
    if (!button) {
        return false;
    }
    const svg = button.querySelector('svg');
    if (visible) {
        if (!svg.classList.contains("rotate-180")) {
            button.click();
        }
    } else {
        if (svg.classList.contains("rotate-180")) {
            button.click();
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
    const loginBtn = document.querySelector('a[href*="sign-in"]');
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
function onConversationClicked(conversationId) {
    onSidebarVisibleChanged(true);
    setTimeout(() => {
        const aDom = document.querySelector(`a[href*="${conversationId}"]`);
        if (aDom && aDom.children.length > 0) {
            aDom.children[0].click();
        }
    }, 0);
}

/**
 * When the client theme is changed, this event will be triggered.
 * The webview theme need be changed when the client theme is changed.
 * @param {int} theme: 0 / system; 1 / light; 2 / dark;
 */
function onAppThemeChanged(theme) {
    const themeValue = Number(theme);
    if (!window.localStorage) {
        return;
    }
    if (themeValue == 1 && localStorage.theme != "light") {
        localStorage.theme = "light";
        location.reload();
    } else if(themeValue == 2 && localStorage.theme != "dark") {
        localStorage.theme = "dark";
        location.reload();
    }
}

/**
 * When the client-side new chat button is clicked, this event will be triggered.
 * You can implement this event handler to ensure new chat is opened.
 */
function onNewChatButtonClicked() {
    const divDom = document.querySelector('a[href="/"]');
    if (divDom) {
        divDom.click();
    }
}

/**
 * When the client-side question up button is clicked, this event will be triggered.
 * You can implement this event handler to location the previous question.
 */
function onQuestionUpButtonClicked() {
    let list = document.querySelectorAll('div[class*="items-end"]');
    if (list.length == 0) {
        return;
    }
    list = Array.from(list).filter((dom) => {
        return dom.id.startsWith("response");
    });
    if (!list[0].parentElement || !list[0].parentElement.parentElement) {
        return;
    }
    const div = document.querySelector('div[id="last-reply-container"]');
    list = [...list, div];
    const container = list[0].parentElement.parentElement;
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
    let list = document.querySelectorAll('div[class*="items-end"]');
    if (list.length == 0) {
        return;
    }
    list = Array.from(list).filter((dom) => {
        return dom.id.startsWith("response");
    });
    if (!list[0].parentElement || !list[0].parentElement.parentElement) {
        return;
    }
    const div = document.querySelector('div[id="last-reply-container"]');
    list = [...list, div];
    const container = list[0].parentElement.parentElement;
    const scrollTop = container.scrollTop + 80;
    let index = 0;
    for(let i = list.length - 1; i >= 0; i--) {
        if (parseInt(list[i].offsetTop) <= parseInt(scrollTop) + 10) {
            index = i + 1;
            while (index < list.length && Math.abs(list[index].offsetTop - scrollTop) < 10) {
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

function _hideNavigatorMenu() {
    const btn = document.querySelector('button[aria-label*="Navigate to"]');
    if (!btn) {
        return;
    }
    const div = btn.parentElement;
    if (!div) {
        return;
    }
    div.style.display = "none";
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
            if (url.includes('/rest/app-chat/conversations?pageSize')) {
                const cloneResponse = response.clone();
                responseText = await cloneResponse.json();
                _parseConversationList(responseText);
            }
        }
        return response;
    };
}

function _parseConversationList(response) {
    if (!response.conversations) {
        return;
    }
    const conversationList = response.conversations;
    if (conversationList.length == 0) {
        return;
    }
    let conversationArray = [];
    for (let con of conversationList) {
        let newCon = {};
        newCon.id = con.conversationId;
        newCon.title = con.title;
        newCon.subTitle = con.subTitle;
        conversationArray.push(newCon);
    }
    invokeBrowserMethod("webConversationListUpdated", conversationArray);
}


function _addNavibarObserver() {
    const targetNode = document.querySelector('div[data-testid="drop-container"]');
    const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                if (mutation.addedNodes.length > 0) {
                    const btn = document.querySelector('button[aria-label*="Navigate to"]');
                    if (btn) {
                        _hideNavigatorMenu();
                    }
                }
            }
        }
    });

    const config = { childList: true, subtree: true };
    observer.observe(targetNode, config);
}