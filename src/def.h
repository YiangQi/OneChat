#ifndef DEF_H
#define DEF_H

#include <QObject>

inline const char* SPLITTER_ADDRESSS = "splitter_address";
inline const char* DOCK_WIDGET_CONTENT_TYPE = "dock_widget_content_type";

inline const char* WEB_EVENT_LOAD_ENDED = "loadEnded";
inline const char* WEB_EVENT_URL_CHANGED = "urlChanged";
inline const char* WEB_EVENT_SIDEBAR_VISIBLE_CHANGED = "sidebarVisibleChanged";
inline const char* WEB_EVENT_INPUT_TEXT_CHANGED = "inputTextChanged";
inline const char* WEB_EVENT_INPUT_TEXT_SEND = "inputTextSended";
inline const char* WEB_EVENT_INPUT_BOX_VISIBLE_CHANGED = "inputBoxVisibleChanged";
inline const char* WEB_EVENT_DEEP_THINK_BTN_CHECKED = "deepThinkButtonChecked";
inline const char* WEB_EVENT_WEB_SEARCH_BTN_CHECKED = "webSearchButtonChecked";
inline const char* WEB_EVENT_LOGIN_BTN_CLICKED = "loginButtonClicked";
inline const char* WEB_EVENT_ADD_IMAGE_BTN_CLICKED = "addImageButtonClicked";
inline const char* WEB_EVENT_ADD_FILE_BTN_CLICKED = "addFileButtonClicked";
inline const char* WEB_EVENT_CONVERSATION_CLICKED = "conversationClicked";
inline const char* WEB_EVENT_APP_THEME_CHANGED = "appThemeChanged";
inline const char* WEB_EVENT_APP_LANGUAGE_CHANGED = "appLanguageChanged";
inline const char* WEB_EVENT_CHAT_NEW_BTN_CLICKED = "chatNewButtonClicked";
inline const char* WEB_EVENT_QUESTION_UP_BTN_CLICKED = "questionUpButtonClicked";
inline const char* WEB_EVENT_QUESTION_DOWN_BTN_CLICKED = "questionDownButtonClicked";

inline const char* WEB_METHOD_LOAD_ENDED = "webLoadEnded";
inline const char* WEB_METHOD_MODEL_LIST_UPDATED = "webModelListUpdated";
inline const char* WEB_METHOD_CONVERSATION_LIST_UPDATED = "webConversationListUpdated";
inline const char* WEB_METHOD_CONVERSATION_CHANGED = "webConversationChanged";
inline const char* WEB_METHOD_CURRENT_QUESTION_CHANGED = "webConversationCurrentQuestionChanged";

inline const char* APP_THEME_LIGHT_KEY = "light";
inline const char* APP_THEME_DARK_KEY = "dark";

enum class ESidebarButtonType
{
    Online,
    End
};

enum class ESettingDialogTabType {
    Common,
    Proxy,
    Debug,
    End
};

enum class DockWidgetContentType {
    OnlineView
};

enum class EAppThemeType {
    System,
    Light,
    Dark,
    End
};

enum class EAppLanuageType {
    System,
    EN,
    ZH,
    End
};

struct OnlineItemInfo {
    QString     name;
    QString     url;
    QString     icon;
    QString     script;
};

struct MsgSendInfo {
    QString name;
    QString url;
    QString icon;

    void operator=(const OnlineItemInfo &itemInfo)
    {
        this->name = itemInfo.name;
        this->icon = itemInfo.icon;
        this->url = itemInfo.url;
    }
};

struct InputPanelInfo {
    bool    isSidebarVisible = false;
    bool    isInputBoxVisible = false;
};

struct WebModelInfo {
    QString         id;
    QString         name;
    QString         desc;

    QString toString() {
        return QString("id: %1"
                       " name: %2"
                       " desc: %3").arg(id, name, desc);
    }
};

struct WebConversationInfo {
    QString         id;
    QString         title;
    QString         subTitle;

    QString toString() {
        return QString("id: %1"
                       " title: %2"
                       " subTitle: %3").arg(id, title, subTitle);
    }
};

#endif // DEF_H
