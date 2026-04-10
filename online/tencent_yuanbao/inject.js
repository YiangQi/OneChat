function onLoadEnded(args) {
    console.log('args:' + JSON.stringify(args))
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
                _hoverSidebar();
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
    if (document.readyState !== "complete") {
        return
    }
    onAppThemeChanged(args.appTheme);
    let maxCnt = 10;
    const timerId = setInterval(()=>{
        if (maxCnt-- < 0) {
            clearInterval(timerId);
        }
        if (onInputBoxVisibleChanged(args.isInputBoxVisible) 
            && onSidebarVisibleChanged(true)) {
            if (!args.isSidebarVisible) {
                _hoverSidebar();
            }
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
    const inputElement = document.querySelector('[contenteditable=true]');
    if (inputElement) {
        inputElement.focus();
        inputElement.innerHTML = text;
    }
}

/**
 * When the client-side send button clicks, this event will be triggered.
 * You must implement this event handler to ensure the input field content can be properly submitted when the client-side send button is clicked.
 */
function onInputTextSended() {
    const btn = document.querySelector('.icon-send');
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
    const inputBoxElement = document.querySelector('div[class*="common__input-box"]');
    if (inputBoxElement) {
        inputBoxElement.style.display = visible ? 'block' : 'none';
        return true;
    }
    return false;
}

/**
 * When the client-side sidebar button in the toolbar clicks, this event will be triggered.
 * You can set the visibility of the sidebar in this event to ensure it remains consistent with the client-side button state.
 * @param {*} visible: Whether the sidebar is visible
 * @returns whether changing the visibility of sidebar success.
 */
function onSidebarVisibleChanged(visible) {
    const showSidbarElement = document.querySelector('div[class$="__trigger--grey"]>span[class*="sidebar"]');
    if (!showSidbarElement) {
        return false;
    }
    if (visible) {
        if (showSidbarElement) {
            showSidbarElement.click();
            return true;
        }
    } else {
        const hideSidbarElement = document.querySelector('div[class$="__trigger"]>span[class*="sidebar"]');
        if (hideSidbarElement) {
            hideSidbarElement.click();
        }
        return true;
    }
    return false;
}

function _hoverSidebar() {
    const showSidbarElement = document.querySelector('div[class$="__trigger--grey"]>span[class*="sidebar"]');
    const mouseOverEvent = new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true
      });
    showSidbarElement.dispatchEvent(mouseOverEvent);

    const mouseOutEvent = new MouseEvent('mouseout', {
        bubbles: true,
        cancelable: true
    });
    showSidbarElement.dispatchEvent(mouseOutEvent);
    
    setTimeout(() => {
        onSidebarVisibleChanged(false);
    }, 500);
}

/**
 * When the client-side login button is clicked, this event will be triggered.
 * If no user login, the login window need to be shown in this function.
 * The function need to be ignored if someone has logined.
 */
function onLoginButtonClicked() {
    if (_isLogin()) {
        return;
    }
    const loginBtn = document.querySelector('div[class="yb-common-nav__ft__avatar"]');
    if (loginBtn) {
        loginBtn.click();
    }
}

function _isLogin() {
    const visitor_number = window.localStorage.visitor_number;
    const user_id = window.localStorage.yb_user_id;
    return !visitor_number.includes(user_id);
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
    conversationDom = document.querySelector(`div[data-item-id="${conversationId}"]`)
    if (conversationDom) {
        conversationDom.click();
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
        htmlDom.setAttribute('yb-theme-mode', 'system');
    } else if (themeValue == 1) {
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
    console.log(`lang: ${langValue}`)
    if (langValue == 1 && localStorage.app_lang != "en") {
        localStorage.app_lang = "en";
        location.reload();
    } else if (langValue == 2 && localStorage.app_lang != "zh-CN") {
        localStorage.app_lang = "zh-CN";
        location.reload();
    } 
}

/**
 * When the client-side new chat button is clicked, this event will be triggered.
 * You can implement this event handler to ensure new chat is opened.
 */
function onNewChatButtonClicked() {
    const spanList = document.querySelectorAll('div[class="yb-common-nav__trigger"]>span[class*="icon-yb-ic_newchat_20"]')
    if (spanList.length > 0) {
        spanList[0].click();
    }
}

/**
 * When the client-side question up button is clicked, this event will be triggered.
 * You can implement this event handler to location the previous question.
 */
function onQuestionUpButtonClicked() {
    const list = document.querySelectorAll('div[class*="agent-chat__list__item--human"]');
    const container = document.querySelector('div[class*="agent-chat__list__content-wrapper"]');
    if (!container || list.length == 0) {
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
    const list = document.querySelectorAll('div[class*="agent-chat__list__item--human"]');
    const container = document.querySelector('div[class*="agent-chat__list__content-wrapper"]');
    if (!container || list.length == 0) {
        return;
    }
    const scrollTop = container.scrollTop;
    let index = 0;
    for(let i = list.length - 1; i >= 0; i--) {
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
        if (url.includes('/api/user/agent/conversation/list')) {
            this.addEventListener('load', () => {
                _parseConversationList(this.responseText);
            });
        } else if (url.includes('/api/agent/model/list')) {
            this.addEventListener('load', () => {
                _parseModelList(this.responseText);
            });
        } else if (url.includes('/api/user/agent/conversation/v1/detail')) {
            this.addEventListener('load', () => {
                _parseConversationDetail(this.responseText);
            });
        }
        // 放行请求
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
    console.log('id: ' + id);
    invokeBrowserMethod("webConversationChanged", id);
}