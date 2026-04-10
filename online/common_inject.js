function invokeBrowserMethod(name, ...arg) {
    CallBridge.invoke(name, ...arg);
}

if (typeof hookHttpsRequest == "function") {
    hookHttpsRequest();
}

if (typeof onLoadEnded == "function") {
    CallBridge.addEventListener("loadEnded", onLoadEnded);
}
if (typeof onUrlChanged == "function") {
    CallBridge.addEventListener("urlChanged", onUrlChanged);
}
if (typeof onInputTextChanged == "function") {
    CallBridge.addEventListener("inputTextChanged", onInputTextChanged);
}
if (typeof onInputTextSended == "function") {
    CallBridge.addEventListener("inputTextSended", onInputTextSended);
}
if (typeof onInputBoxVisibleChanged == "function") {
    CallBridge.addEventListener("inputBoxVisibleChanged", onInputBoxVisibleChanged);
}
if (typeof onSidebarVisibleChanged == "function") {
    CallBridge.addEventListener("sidebarVisibleChanged", onSidebarVisibleChanged);
}
if (typeof onLoginButtonClicked == "function") {
    CallBridge.addEventListener("loginButtonClicked", onLoginButtonClicked);
}
if (typeof onAddImageButtonClicked == "function") {
    CallBridge.addEventListener("addImageButtonClicked", onAddImageButtonClicked);
}
if (typeof onAddFileButtonClicked == "function") {
    CallBridge.addEventListener("addFileButtonClicked", onAddFileButtonClicked);
}
if (typeof onConversationClicked == "function") {
    CallBridge.addEventListener("conversationClicked", onConversationClicked);
}
if (typeof onAppThemeChanged == "function") {
    CallBridge.addEventListener("appThemeChanged", onAppThemeChanged);
}
if (typeof onAppLanguageChanged == "function") {
    CallBridge.addEventListener("appLanguageChanged", onAppLanguageChanged);
}
if (typeof onNewChatButtonClicked == "function") {
    CallBridge.addEventListener("chatNewButtonClicked", onNewChatButtonClicked);
}
if (typeof onQuestionUpButtonClicked == "function") {
    CallBridge.addEventListener("questionUpButtonClicked", onQuestionUpButtonClicked);
}
if (typeof onQuestionDownButtonClicked == "function") {
    CallBridge.addEventListener("questionDownButtonClicked", onQuestionDownButtonClicked);
}