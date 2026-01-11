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
    const timerId = setInterval(()=>{
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
    const inputElement = document.querySelector('form #prompt-textarea');
    if (inputElement) {
      inputElement.innerHTML = '';
      const p = document.createElement('p');
      p.textContent = text;
      inputElement.appendChild(p);
    }
}

/**
 * When the client-side send button clicks, this event will be triggered.
 * You must implement this event handler to ensure the input field content can be properly submitted when the client-side send button is clicked.
 */
function onInputTextSended() {
    const btn = document.querySelector('button[id="composer-submit-button"]');
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
    const textareaDom = document.querySelector('textarea');
    if (!textareaDom) {
        return false;
    }
    const divDom = textareaDom.closest('div[class*="text-base"]')
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
    const showSidbarElement1 = document.querySelector('div[id="stage-sidebar-tiny-bar"]');
    const hideSidbarElement1 = document.querySelector('button[data-testid="close-sidebar-button"]');
    const showSidbarElement2 = document.querySelector('button[data-testid="open-sidebar-button"]');

    if (!showSidbarElement1 && !showSidbarElement2 && !hideSidbarElement1) {
        return false;
    }
    if (visible) {
        const showSidbarElement = document.querySelector('div[id="stage-sidebar-tiny-bar"]');
        if (showSidbarElement) {
            showSidbarElement.click();
        } else {
            const showSidbarElement2 = document.querySelector('button[data-testid="open-sidebar-button"]');
            if (showSidbarElement2) {
                showSidbarElement2.click();
            }
        }
        return true;
    } else {
        const hideSidbarElement = btn = document.querySelector('button[data-testid="close-sidebar-button"]');
        if (hideSidbarElement) {
            hideSidbarElement.click();
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
    const loginBtn = document.querySelector('button[data-testid="login-button"]');
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
        divDom = document.querySelector(`a[href="/c/${conversationId}"]`);
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
    if (themeValue == 1 && localStorage.theme != "light") {
        localStorage.theme = "light";
        location.reload();
    } else if(themeValue == 2 && localStorage.theme != "dark") {
        localStorage.theme = "dark";
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
    const button = a = document.querySelector('a[data-testid="create-new-chat-button"]');
    if (button) {
        button.click();
    } else {
        const showSidbarElement = document.querySelector('button[data-testid="open-sidebar-button"]');
        if (showSidbarElement) {
            showSidbarElement.click();
            setTimeout(() => {
                const button = a = document.querySelector('a[data-testid="create-new-chat-button"]');
                if (button) {
                    button.click();
                }
            }, 500);
        }
    }
}

/**
 * When the client-side question up button is clicked, this event will be triggered.
 * You can implement this event handler to location the previous question.
 */
function onQuestionUpButtonClicked() {
    const list = document.querySelectorAll('article[data-turn="user"]');
    if (list.length == 0 || !list[0].parentElement) {
        return;
    }
    const container = document.querySelector('div[data-scroll-root="true"]');
    if (!container) {
        return;
    }
    const scrollTop = container.scrollTop;
    let index = list.length - 1;
    for(let i = 0; i < list.length; i++) {
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
    const list = document.querySelectorAll('article[data-turn="user"]');
    if (list.length == 0 || !list[0].parentElement) {
        return;
    }
    const container = document.querySelector('div[data-scroll-root="true"]');
    if (!container) {
        return;
    }
    const scrollTop = container.scrollTop;
    let index = 0;
    for(let i = list.length - 1; i >= 0; i--) {
        if (parseInt(list[i].offsetTop) <= parseInt(scrollTop)) {
            index = i + 1;
            while (index < list.length && Math.abs(list[index].offsetTop - scrollTop) < 100) {
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
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const [req, config] = args;
        const url = req.url;
        const response = await originalFetch.apply(this, args);
        if (url) {
            if (url.includes('/backend-api/conversations')) {
                const cloneResponse = response.clone();
                responseText = await cloneResponse.json();
                _parseConversationList(responseText);
            } else if (url.includes('/backend-api/conversation')) {
                const cloneResponse = response.clone();
                responseText = await cloneResponse.json();
                _parseConversationDetail(responseText);
            }
        }
        return response;
    };
}

function _parseConversationList(response) {
    const conversationList = response.items;
    let conversationArray = [];
    for (let con of conversationList) {
        let newCon = {};
        newCon.id = con.id;
        newCon.title = con.title;
        newCon.subTitle = con.title;
        conversationArray.push(newCon);
    }
    invokeBrowserMethod("webConversationListUpdated", conversationArray);
}

function _parseConversationDetail(response) {
    const id = response.conversation_id;
    if (id) {
        invokeBrowserMethod("webConversationChanged", id);
    }
}