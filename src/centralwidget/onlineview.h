#ifndef ONLINEVIEW_H
#define ONLINEVIEW_H

#include "../def.h"
#include "QCefView.h"

class LoadingWidget;
class QuestionUpDownWidget;
class OnlineView : public QCefView
{
    Q_OBJECT
public:
    OnlineView(const OnlineItemInfo &itemInfo,
               const QCefSetting* setting,
               QWidget* parent = nullptr,
               Qt::WindowFlags f = Qt::WindowFlags());
    ~OnlineView();

    void loadConversation(const QString &chatId);

signals:
    void signalOnlineViewCreated(const MsgSendInfo& sendInfo);
    void signalOnlineViewDestroyed(const MsgSendInfo& sendInfo);
    void signalLoadStateChanged(bool isLoading);
    void signalInputPanelStatusRequested(const QString &eventName, const QString &url);
    void signalModelListUpdated(const QString &url,
                                const QList<WebModelInfo> &infoList);
    void signalConversationListUpdated(const QString &url,
                                       const QList<WebConversationInfo> &infoList);
    void signalConversationChanged(const QString &url,
                                   const QString &conversationId);
    void signalSettingBtnClicked(ESettingDialogTabType tabType, const QVariant &var = "");
    void signalOnlineViewRefreshed(const QString &url);
public slots:
    void slotTabBarRefreshBtnClicked();
protected:
    void resizeEvent(QResizeEvent *event) override;
    void dragEnterEvent(QDragEnterEvent *event) override;
    void dragMoveEvent(QDragMoveEvent *event) override;
    void dragLeaveEvent(QDragLeaveEvent *event) override;
    void dropEvent(QDropEvent *event) override;
private slots:
    void slotBeforeBrowse(const QCefBrowserId& browserId,
                       const QCefFrameId& frameId,
                       bool isMainFrame,
                       bool is_redirect);
    void slotLoadingStateChanged(const QCefBrowserId& browserId,
                                 bool isLoading,
                                 bool canGoBack,
                                 bool canGoForward);
    void slotLoadStart(const QCefBrowserId& browserId,
                       const QCefFrameId& frameId,
                       bool isMainFrame,
                       int transitionType);
    void slotLoadEnd(const QCefBrowserId& browserId,
                     const QCefFrameId& frameId,
                     bool isMainFrame,
                     int httpStatusCode);
    void slotLoadError(const QCefBrowserId& browserId,
                       const QCefFrameId& frameId,
                       bool isMainFrame,
                       int errorCode,
                       const QString& errorMsg,
                       const QString& failedUrl);
    void slotStatusMessage(const QString& message);
    void slotConsoleMessage(const QString& message, int level);
    void slotInvokeMethod(const QCefBrowserId& browserId,
                          const QCefFrameId& frameId,
                          const QString& method,
                          const QVariantList& arguments);
     void slotAddressChanged(const QCefFrameId& frameId, const QString& url);

    void slotInputPanelTextUpdated(const QString& text, const QStringList &modelList);
    void slotSendMsgBtnClicked(const QStringList &modelList);
    void slotInputBoxVisibleChanged(bool isVisible);
    void slotSidebarVisibleChanged(bool isVisible);
    void slotLoginBtnClicked();
    void slotNewChatBtnClicked();
    void slotUpQuestionBtnClicked();
    void slotDownQuestionBtnClicked();

    void slotAddImageBtnClicked(const QString &fileName);
    void slotAddFileBtnClicked(const QString &fileName);

    void slotInputPanelStatusUpdated(const QString &eventName,
                                     const InputPanelInfo &info,
                                     const QString &url);
    void slotSettingConfigThemeChanged(int theme);
    void slotSettingConfigLanguageChanged(int language);
    void slotWebViewProxyUsed(const QString &url, bool isUsed);
    void slotAppThemeChanged(const QString &themeMode);
private:
    void connectSignals();
    void injectScript(const QCefFrameId& frameId);
    void sendEvent(const QString &eventName, const QVariantList& arguments = {});

    void onWebMethodLoadEnded(const QVariantList &arguments);
    void onWebMethodModelListUpdated(const QVariantList &arguments);
    void onWebMethodConversationListUpdated(const QVariantList &arguments);
    void onWebMethodConversationChanged(const QVariantList &arguments);

    void setProxyAddressByConfig();
    void showLoadErrorDialog(int errorCode, const QString &errorMsg);

    void repositionUpDownWidget();
    void showWebUi();
private:
    MsgSendInfo                         mMsgSendInfo;
    QString                             mCurrentUrl;
    LoadingWidget                       *mLoadingWgt = nullptr;
    QuestionUpDownWidget                *mUpDownWgt = nullptr;
    QString                             mInjectScriptPath;
    QString                             mConversationId;
    QList<WebConversationInfo>          mWebConversationList;
    QTimer                              *mLoadEndTimer = nullptr;
};

#endif // ONLINEVIEW_H
