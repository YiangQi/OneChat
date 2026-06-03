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
    console.log('[Aliyun Tongyi] onLoadEnded args:' + JSON.stringify(args))
    onAppThemeChanged(args.appTheme);

    let maxCnt = 10;
    const timerId = setInterval(() => {
        console.log('[Aliyun Tongyi] onLoadEnded timer run, maxCnt:', maxCnt);
        if (maxCnt-- < 0) {
            console.log('[Aliyun Tongyi] onLoadEnded timeout, calling webLoadEnded');
            clearInterval(timerId);
            invokeBrowserMethod("webLoadEnded");
        }
        const inputBoxResult = onInputBoxVisibleChanged(args.isInputBoxVisible);
        const sidebarResult = onSidebarVisibleChanged(args.isSidebarVisible);
        console.log('[Aliyun Tongyi] onLoadEnded sync results:', { inputBoxResult, sidebarResult });
        if (inputBoxResult && sidebarResult) {
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
    const currentId = _getCurrentConversationIdFromUrl();
    if (currentId) {
        invokeBrowserMethod("webConversationChanged", currentId);
    }
    if (document.readyState !== "complete") {
        return
    }

    let maxCnt = 10;
    const timerId = setInterval(() => {
        console.log('onUrlChanged timer run');
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
    const editor = document.querySelector('div[contenteditable] p');
    if (!editor) return;

    const editableRoot = editor.closest('[contenteditable]');
    const previousContentEditable = editableRoot ? editableRoot.getAttribute('contenteditable') : null;
    if (editableRoot) {
        editableRoot.setAttribute('contenteditable', 'false');
        editableRoot.blur();
    }

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);

    editor.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'deleteContent',
        bubbles: true,
        cancelable: false
    }));

    setTimeout(() => {
        editor.dispatchEvent(new InputEvent('beforeinput', {
            inputType: 'insertText',
            data: text,
            bubbles: true,
            cancelable: false
        }));

        requestAnimationFrame(() => {
            if (!editableRoot) return;
            if (previousContentEditable === null) {
                editableRoot.removeAttribute('contenteditable');
            } else {
                editableRoot.setAttribute('contenteditable', previousContentEditable);
            }
        });
    }, 10);
}

/**
 * When the client-side send button clicks, this event will be triggered.
 * You must implement this event handler to ensure the input field content can be properly submitted when the client-side send button is clicked.
 */
function onInputTextSended() {
    const btn = document.querySelector('div[class*="operateBtn"]');
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
    const inputBoxElement = document.querySelector('div[class*="text-area-slot-container"]');
    if (inputBoxElement) {
        inputBoxElement.style.display = visible ? '' : 'none';
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
    console.log('[Aliyun Tongyi] onSidebarVisibleChanged called, visible:', visible);

    // 检查侧边栏容器的 transform 状态
    const transformContainer = document.querySelector('div[class*="translate-x"]');
    let isSidebarVisible = false;

    if (transformContainer) {
        // 检查是否有 -translate-x-full 类（表示侧边栏被隐藏）
        const classList = transformContainer.classList;
        isSidebarVisible = !classList.contains('-translate-x-full') &&
                          !classList.contains('translate-x-full') &&
                          !classList.contains('translate-x-[100%]') &&
                          !classList.contains('translate-x-[-100%]');
    }

    console.log('[Aliyun Tongyi] Current sidebar visible state:', isSidebarVisible, 'target:', visible);

    // 如果状态已经匹配，直接返回 true
    if (isSidebarVisible === visible) {
        console.log('[Aliyun Tongyi] Sidebar already in target state, returning true');
        return true;
    }

    // 需要切换状态
    if (visible) {
        // 需要显示侧边栏 - 点击 sidebarRight 或查找展开按钮
        const sidebarRight = document.querySelector('span[data-icon-type="qwpcicon-sidebarRight"]');
        if (sidebarRight) {
            console.log('[Aliyun Tongyi] Clicking sidebarRight to show sidebar');
            sidebarRight.click();
            return true;
        }

        // 尝试其他可能的选择器
        const expandButton = document.querySelector('button[aria-label*="展开"]') ||
                             document.querySelector('button[aria-label*="expand"]') ||
                             document.querySelector('button[title*="展开"]') ||
                             document.querySelector('button[title*="expand"]');
        if (expandButton) {
            console.log('[Aliyun Tongyi] Clicking expand button');
            expandButton.click();
            return true;
        }
    } else {
        // 需要隐藏侧边栏 - 点击 sidebarLeft 或查找折叠按钮
        const sidebarLeft = document.querySelector('span[data-icon-type="qwpcicon-sidebarLeft"]');
        if (sidebarLeft) {
            console.log('[Aliyun Tongyi] Clicking sidebarLeft to hide sidebar');
            // 可能有多个 sidebarLeft，找到可见的那个
            const allSidebarLeft = document.querySelectorAll('span[data-icon-type="qwpcicon-sidebarLeft"]');
            for (const btn of allSidebarLeft) {
                if (btn.offsetParent !== null) {
                    btn.click();
                    break;
                }
            }
            return true;
        }

        // 尝试其他可能的选择器
        const collapseButton = document.querySelector('button[aria-label*="收起"]') ||
                              document.querySelector('button[aria-label*="collapse"]') ||
                              document.querySelector('button[title*="收起"]') ||
                              document.querySelector('button[title*="collapse"]');
        if (collapseButton) {
            console.log('[Aliyun Tongyi] Clicking collapse button');
            collapseButton.click();
            return true;
        }
    }

    // Generic fallback for non-Tongyi pages
    console.log('[Aliyun Tongyi] No Tongyi icons found, trying generic fallback');
    const sidebar = document.querySelector('aside') ||
        document.querySelector('nav[class*="sidebar"]') ||
        document.querySelector('div[class*="sidebar"]') ||
        document.querySelector('div[class*="side-bar"]') ||
        document.querySelector('div[class*="sider"]') ||
        document.querySelector('div[class*="history"]');

    console.log('[Aliyun Tongyi] Found generic sidebar:', !!sidebar);
    if (!sidebar) {
        console.log('[Aliyun Tongyi] No sidebar found, returning false');
        return false;
    }

    const sidebarVisible = getComputedStyle(sidebar).display !== 'none' &&
        getComputedStyle(sidebar).visibility !== 'hidden' &&
        sidebar.getBoundingClientRect().width > 0;

    console.log('[Aliyun Tongyi] Generic sidebar visible:', sidebarVisible, 'target:', visible);

    if (visible === sidebarVisible) {
        console.log('[Aliyun Tongyi] Generic sidebar already in target state, returning true');
        return true;
    }

    // Find and click the toggle button
    const toggleButton = document.querySelector('button[aria-label*="侧边栏"]') ||
        document.querySelector('button[aria-label*="sidebar" i]') ||
        document.querySelector('button[title*="侧边栏"]') ||
        document.querySelector('button[title*="sidebar" i]') ||
        document.querySelector('[role="button"][aria-label*="侧边栏"]') ||
        document.querySelector('[role="button"][aria-label*="sidebar" i]') ||
        document.querySelector('[class*="sidebar"][role="button"]') ||
        document.querySelector('[class*="side-bar"][role="button"]') ||
        document.querySelector('[class*="collapse"][role="button"]') ||
        document.querySelector('[class*="expand"][role="button"]') ||
        document.querySelector('button[id*="sidebar"]') ||
        document.querySelector('button[id*="toggle"]');

    console.log('[Aliyun Tongyi] Found generic toggle button:', !!toggleButton);
    if (toggleButton) {
        console.log('[Aliyun Tongyi] Clicking generic toggle button');
        toggleButton.click();
        return true;
    }

    console.log('[Aliyun Tongyi] No toggle button found, returning false');
    return false;
}

/**
 * When the client-side login button is clicked, this event will be triggered.
 * If no user login, the login window need to be shown in this function.
 * The function need to be ignored if someone has logined.
 */
function onLoginButtonClicked() {
    const topNewBtn = document.querySelector('button[class*="desktop-no-drag"]');
    if (topNewBtn) {
        topNewBtn.click();
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
    const uploadBtn = document.querySelector('div[class*="optionBtn"]');
    uploadBtn.click();
    setTimeout(() => {
        const file = new File([fileInfo.data], fileInfo.fileName, { type: fileInfo.type });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput = document.querySelector('input[type="file"][accept*="png"]')
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    }, 100);
}

/**
 * When the client-side add file button is clicked, this event will be triggered.
 * @param {object} fileInfo: the file info
 * @param {ArrayBuffer} fileInfo.data: file data
 * @param {string} fileInfo.fileName: file name
 * @param {string} fileInfo.fileType: file type
 */
function onAddFileButtonClicked(fileInfo) {
    const uploadBtn = document.querySelector('div[class*="optionBtn"]');
    uploadBtn.click();
    setTimeout(() => {
        const file = new File([fileInfo.data], fileInfo.fileName, { type: fileInfo.type });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput = document.querySelector('input[type="file"][accept*="pdf"]')
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    }, 100);
}

/**
 * When clicking on a sidebar conversation, this method will be invoked.
 * You must implement this method to ensure proper switching of conversations 
 * within the page when clicking on sidebar conversations.
 * @param {*} conversationId 
 * @param {*} conversationTitle
 */
function onConversationClicked(conversationId, conversationTitle) {
    console.log('[Aliyun Tongyi] onConversationClicked called:', { conversationId, conversationTitle });

    // 首先确保侧边栏是展开的
    const transformContainer = document.querySelector('div[class*="translate-x"]');
    let isSidebarVisible = false;

    if (transformContainer) {
        const classList = transformContainer.classList;
        isSidebarVisible = !classList.contains('-translate-x-full') &&
                          !classList.contains('translate-x-full');
    }

    console.log('[Aliyun Tongyi] Sidebar visible before click:', isSidebarVisible);

    // 如果侧边栏不可见，先展开它
    if (!isSidebarVisible) {
        console.log('[Aliyun Tongyi] Sidebar is collapsed, expanding first');
        const sidebarRight = document.querySelector('span[data-icon-type="qwpcicon-sidebarRight"]');
        if (sidebarRight) {
            sidebarRight.click();
        }
    }

    // 等待侧边栏展开动画完成
    setTimeout(() => {
        console.log('[Aliyun Tongyi] Looking for conversation to click:', conversationTitle);

        // 查找历史会话项
        const scrollbar = document.querySelector('div[class*="sider-scrollbar"]');
        if (!scrollbar) {
            console.warn('[Aliyun Tongyi] No scrollbar found');
            return;
        }

        // 获取所有直接子元素
        const allItems = scrollbar.children;
        console.log(`[Aliyun Tongyi] Found ${allItems.length} items in scrollbar`);

        for (let i = 0; i < allItems.length; i++) {
            const item = allItems[i];
            const itemText = (item.textContent || '').trim();

            // 跳过太长的文本（可能是容器）或太短的文本（可能是分组标题）
            if (itemText.length > 100 || itemText.length < 5) continue;

            console.log(`[Aliyun Tongyi] Checking item [${i}]: "${itemText.substring(0, 30)}"`);

            // 检查文本是否匹配
            if (itemText === conversationTitle || itemText.includes(conversationTitle)) {
                console.log('[Aliyun Tongyi] Found matching conversation item');

                // 查找带有 cursor-pointer 类的可点击 div
                const clickableDiv = item.querySelector('div[class*="cursor-pointer"]');
                if (clickableDiv) {
                    console.log('[Aliyun Tongyi] Clicking cursor-pointer div');
                    clickableDiv.click();
                    return;
                }

                // 如果没有找到 cursor-pointer div，尝试点击其他可点击元素
                const button = item.querySelector('button, [role="button"], [onclick]');
                if (button) {
                    console.log('[Aliyun Tongyi] Clicking button element');
                    button.click();
                    return;
                }

                // 最后尝试：直接点击元素本身
                console.log('[Aliyun Tongyi] Clicking item directly');
                item.click();
                return;
            }
        }

        console.warn('[Aliyun Tongyi] Could not find conversation to click:', conversationTitle);
    }, 600);
}

/**
 * When the client theme is changed, this event will be triggered.
 * The webview theme need be changed when the client theme is changed.
 * @param {int} theme: 0 / system; 1 / light; 2 / dark;
 */
function onAppThemeChanged(theme) {
    const themeValue = Number(theme);
    if (themeValue == 1) {
        const sunSpan = document.querySelector('span[data-icon-type="qwpcicon-sun"]');
        if (sunSpan) {
            sunSpan.click();
        }
    } else if (themeValue == 2) {
        const moonSpan = document.querySelector('span[data-icon-type="qwpcicon-moon"]');
        if (moonSpan) {
            moonSpan.click();
        }
    }
}

/**
 * When the client-side new chat button is clicked, this event will be triggered.
 * You can implement this event handler to ensure new chat is opened.
 */
function onNewChatButtonClicked() {
    const sidebarNewBtn = document.querySelector('span[data-icon-type="qwpcicon-newDialogueMedium"]');
    const topNewBtn = document.querySelector('span[data-icon-type="qwpcicon-newDialogue"]');
    if (sidebarNewBtn) {
        sidebarNewBtn.click();
    } else if (topNewBtn) {
        topNewBtn.click();
    }
}

/**
 * When the client-side question up button is clicked, this event will be triggered.
 * You can implement this event handler to location the previous question.
 */
function onQuestionUpButtonClicked() {
    const list = document.querySelectorAll('div[class*="questionItem"]');
    const container = document.querySelector('div[class*="contentWrap"]');
    if (!container || list.length == 0) {
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
    const list = document.querySelectorAll('div[class*="questionItem"]');
    const container = document.querySelector('div[class*="contentWrap"]');
    if (!container || list.length == 0) {
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
        list[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        container.scrollTo({top: container.scrollHeight, behavior: 'smooth'});
        alert("Has been scrolled to bottom.");
    }
}
function _getCurrentConversationIdFromUrl() {
    const match = location.href.match(/(?:chat|session)[=/]([^/?#&]+)/i);
    return match ? decodeURIComponent(match[1]) : '';
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
            if (url.includes('/api/v2/session/page/list')) {
                const cloneResponse = response.clone();
                responseText = await cloneResponse.json();
                _parseConversationList(responseText);
            } else if (url.match('/api/v1/session/get')) {
                const cloneResponse = response.clone();
                responseText = await cloneResponse.json();
                _parseConversationDetail(responseText);
            }
        }
        return response;
    };
}

function _parseConversationList(response) {
    const conversationList = response.data.list;
    let conversationArray = [];
    for (let con of conversationList) {
        let newCon = {};
        newCon.id = con.session_id;
        newCon.title = con.title;
        newCon.subTitle = con.title;
        conversationArray.push(newCon);
    }
    invokeBrowserMethod("webConversationListUpdated", conversationArray);
}

function _parseConversationDetail(response) {
    const id = response.data.session_id;
    invokeBrowserMethod("webConversationChanged", id);
}
