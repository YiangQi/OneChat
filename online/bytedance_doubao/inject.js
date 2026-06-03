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
    console.log('[Doubao] onInputTextChanged called:', text);
    const inputElement = document.querySelector('textarea.semi-input-textarea')
    if (inputElement) {
        const wasReadOnly = inputElement.readOnly;
        inputElement.readOnly = true;
        inputElement.blur();
        
        const nativeTextareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeTextareaSetter.call(inputElement, text);

        const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
        });
        inputElement.dispatchEvent(inputEvent);

        // 触发 change 事件以确保值被正确设置
        const changeEvent = new Event('change', { bubbles: true });
        inputElement.dispatchEvent(changeEvent);

        requestAnimationFrame(() => {
            inputElement.readOnly = wasReadOnly;
        });
    }
}

/**
 * When the client-side send button clicks, this event will be triggered.
 * You must implement this event handler to ensure the input field content can be properly submitted when the client-side send button is clicked.
 */
function onInputTextSended() {
    console.log('[Doubao] onInputTextSended called');
    const inputElement = document.querySelector('textarea.semi-input-textarea');
    if (inputElement) {
        // Doubao 使用 Enter 键发送消息
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        });
        inputElement.dispatchEvent(enterEvent);
    }
}


/**
 * When the client-side inputbox button in the toolbar clicks, this event will be triggered.
 * You can set the visibility of the inputbox in this event to ensure it remains consistent with the client-side button state.
 * @param {*} visible: Whether the inputbox is visible
 * @returns whether changing the visibility of sidebar success.
 */
function onInputBoxVisibleChanged(visible) {
    console.log('[Doubao] onInputBoxVisibleChanged called, visible:', visible);

    // 查找输入框的最外层容器
    // 根据调试结果，顶层容器是 level 8，包含 "input-guidance-input-container-min-height" 类名
    const textarea = document.querySelector('textarea.semi-input-textarea');
    if (textarea) {
        // 向上查找包含 "input-guidance-input-container" 的容器
        let container = textarea.parentElement;
        let level = 0;
        while (container && level < 15) {
            const className = container.className || '';
            // 查找包含 input-guidance-input-container 的容器
            if (className.includes('input-guidance-input-container')) {
                console.log('[Doubao] Found input container at level', level);
                container.style.display = visible ? '' : 'none';
                console.log('[Doubao] Input container display set to:', container.style.display);
                return true;
            }
            container = container.parentElement;
            level++;
        }

        // 如果没找到，尝试查找包含 "input" 和 "container" 的容器
        container = textarea.parentElement;
        level = 0;
        while (container && level < 15) {
            const className = container.className || '';
            if (className.includes('input') && className.includes('container')) {
                console.log('[Doubao] Found alternative input container at level', level);
                container.style.display = visible ? '' : 'none';
                return true;
            }
            container = container.parentElement;
            level++;
        }
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
    console.log('[Doubao] onSidebarVisibleChanged called, visible:', visible);

    // Doubao 使用 CSS 类来控制侧边栏状态
    // 查找 nav 元素，类名格式: left-side-U7A0kz left-side__expand-OIQFEm
    const navElement = document.querySelector('nav[class*="left-side"]');
    if (!navElement) {
        console.log('[Doubao] Nav element not found');
        return false;
    }

    const className = navElement.className;
    // 检查当前状态: left-side__expand 表示展开，left-side__collapse 表示收起
    const isExpanded = className.includes('left-side__expand');
    const isCollapsed = className.includes('left-side__collapse');

    console.log('[Doubao] Current nav state - expanded:', isExpanded, 'collapsed:', isCollapsed);

    // 如果状态已经匹配，直接返回
    if ((visible && isExpanded) || (!visible && isCollapsed)) {
        console.log('[Doubao] Sidebar already in target state');
        return true;
    }

    // 通过修改类名来切换状态
    // 类名格式: left-side-{随机字符} left-side__{expand|collapse}-{随机字符}
    if (visible) {
        // 将 collapse 改为 expand，使用正则确保正确替换
        navElement.className = className.replace(/left-side__collapse-[A-Za-z0-9]+/, 'left-side__expand-OIQFEm');
        console.log('[Doubao] Changed to expanded state, new className:', navElement.className);
    } else {
        // 将 expand 改为 collapse
        navElement.className = className.replace(/left-side__expand-[A-Za-z0-9]+/, 'left-side__collapse-OIQFEm');
        console.log('[Doubao] Changed to collapsed state, new className:', navElement.className);
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
 * @param {*} conversationTitle
 */
function onConversationClicked(conversationId, conversationTitle) {
    console.log('[Doubao] onConversationClicked called:', { conversationId, conversationTitle });

    // Doubao 的会话链接格式: /chat/{id}
    // 首先尝试通过 href 查找
    const sidebar = document.querySelector('#flow_chat_sidebar');
    if (sidebar) {
        // 查找所有链接
        const allLinks = sidebar.querySelectorAll('a[href*="/chat/"]');
        console.log(`[Doubao] Found ${allLinks.length} chat links`);

        for (let i = 0; i < allLinks.length; i++) {
            const link = allLinks[i];
            const href = link.getAttribute('href') || '';

            // 检查 href 是否包含 conversationId
            if (href.includes(conversationId) || href === `/chat/${conversationId}`) {
                console.log('[Doubao] Found matching conversation link, clicking:', href);
                link.click();
                return;
            }
        }

        // 如果通过 ID 没找到，尝试通过标题查找
        if (conversationTitle) {
            console.log('[Doubao] Trying to find by title:', conversationTitle);
            for (let i = 0; i < allLinks.length; i++) {
                const link = allLinks[i];
                const text = (link.textContent || '').trim();

                if (text === conversationTitle || text.includes(conversationTitle)) {
                    console.log('[Doubao] Found conversation by title, clicking');
                    link.click();
                    return;
                }
            }
        }
    }

    // 如果没找到链接，尝试直接导航
    console.log('[Doubao] No link found, navigating to:', `/chat/${conversationId}`);
    window.location.href = `/chat/${conversationId}`;
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
    console.log('[Doubao] onNewChatButtonClicked called');

    // 根据调试结果，"新对话" 是侧边栏的第二个子元素（index 1）
    // 它是一个 DIV，包含 "cursor-pointer" 类
    const sidebar = document.querySelector('#flow_chat_sidebar');
    if (sidebar && sidebar.children.length > 1) {
        const secondChild = sidebar.children[1];
        const text = (secondChild.textContent || '').trim();

        // 验证这是 "新对话" 元素
        if (text === '新对话' || secondChild.className.includes('cursor-pointer')) {
            console.log('[Doubao] Clicking new chat button');
            secondChild.click();
            return;
        }
    }

    // 如果没找到，尝试查找包含 "新对话" 文字的元素
    if (sidebar) {
        const allElements = sidebar.querySelectorAll('*');
        for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i];
            const text = (el.textContent || '').trim();

            if (text === '新对话') {
                const clickable = el.closest('div[onclick], div.cursor-pointer, a, button, [role="button]');
                if (clickable) {
                    console.log('[Doubao] Clicking new chat element by text');
                    clickable.click();
                    return;
                }
            }
        }
    }

    // 如果仍然没找到，尝试导航到根 URL
    console.log('[Doubao] No new chat button found, navigating to /chat/');
    window.location.href = '/chat/';
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
