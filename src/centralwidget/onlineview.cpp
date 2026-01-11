#include "../def.h"
#include "onlineview.h"
#include "loadingwidget.h"
#include "questionupdownwidget.h"
#include "../signalbus/inputpanelsignalbus.h"
#include "../signalbus/sidebarsignalbus.h"
#include "../signalbus/settingsignalbus.h"
#include "../config/settingsconfig.h"
#include "../utils/utils.h"
#include <QResizeEvent>
#include <QMessageBox>
#include <QCoreApplication>
#include <QFileInfo>
#include <QDebug>
#include <QTimer>
#include <QMap>
#include <QAbstractButton>

OnlineView::OnlineView(const OnlineItemInfo &itemInfo,
                       const QCefSetting *setting,
                       QWidget *parent,
                       Qt::WindowFlags f)
    : QCefView(itemInfo.url, setting, parent, f)
    , mCurrentUrl(itemInfo.url)
    , mInjectScriptPath(itemInfo.script)
{
    mMsgSendInfo = itemInfo;
    mLoadingWgt = new LoadingWidget(this);
    mLoadingWgt->hide();

    mUpDownWgt = new QuestionUpDownWidget(this);
    mUpDownWgt->hide();

    connectSignals();
    this->setMouseTracking(true);
    this->setAcceptDrops(true);
    this->setEnableDragAndDrop(false);
    this->setAttribute(Qt::WA_DeleteOnClose, true);
    this->setMinimumSize({200, 200});
    setProxyAddressByConfig();

    mLoadEndTimer = new QTimer(this);
    connect(mLoadEndTimer, &QTimer::timeout, [this]{
        mLoadEndTimer->stop();
        showWebUi();
    });
    emit signalOnlineViewCreated(mMsgSendInfo);
}

OnlineView::~OnlineView()
{
    emit signalOnlineViewDestroyed(mMsgSendInfo);
}

void OnlineView::loadConversation(const QString &chatId)
{
    qInfo() << "chatId: " << chatId;
    foreach(const auto& chat, mWebConversationList)
    {
        if (chat.id == chatId)
        {
            QVariantList args = {chatId, chat.title};
            sendEvent(WEB_EVENT_CONVERSATION_CLICKED, args);
        }
    }
}

void OnlineView::slotTabBarRefreshBtnClicked()
{
    emit signalOnlineViewRefreshed(mMsgSendInfo.url);

    setProxyAddressByConfig();
    navigateToUrl(mCurrentUrl);
}

void OnlineView::resizeEvent(QResizeEvent *event)
{
    QSize size = event->size();
    if (size.width() == 0 || size.height() == 0) {
        return;
    }
    QCefView::resizeEvent(event);
    mLoadingWgt->resize(size);
    // qDebug() << mMsgSendInfo.url << size;
    repositionUpDownWidget();
}

void OnlineView::dragEnterEvent(QDragEnterEvent *event)
{
    qDebug() << "drag Enter";
}

void OnlineView::dragMoveEvent(QDragMoveEvent *event)
{
    qDebug() << "drag Move";
}

void OnlineView::dragLeaveEvent(QDragLeaveEvent *event)
{
    qDebug() << "drag Leave";
}

void OnlineView::dropEvent(QDropEvent *event)
{
    qDebug() << "drop Event";

}

void OnlineView::slotBeforeBrowse(const int &browserId,
                                  const QString &frameId,
                                  bool isMainFrame,
                                  bool is_redirect)
{
    if (isMainFrame)
    {
        mLoadingWgt->resize(this->size());
        mLoadingWgt->show();
        mLoadingWgt->raise();
        mLoadEndTimer->start(10000);
    }
}

void OnlineView::slotLoadingStateChanged(const int &browserId,
                                         bool isLoading,
                                         bool canGoBack,
                                         bool canGoForward)
{
    emit signalLoadStateChanged(isLoading);
}

void OnlineView::slotLoadStart(const int &browserId,
                               const QCefFrameId& frameId,
                               bool isMainFrame,
                               int transitionType)
{
    if (isMainFrame)
    {
        injectScript(frameId);
        mLoadingWgt->resize(this->size());
        mLoadingWgt->show();
        mLoadingWgt->raise();
        mLoadEndTimer->start(10000);
    }
}

void OnlineView::slotLoadEnd(const int &browserId,
                             const QCefFrameId& frameId,
                             bool isMainFrame,
                             int httpStatusCode)
{
    if (isMainFrame)
    {
        emit signalInputPanelStatusRequested(WEB_EVENT_LOAD_ENDED, mCurrentUrl);

        if (SettingsConfig::instance().debugModel().isOpenDevTool) {
            this->showDevTools();
        }

        mLoadEndTimer->start(10000);
    }
}

void OnlineView::slotLoadError(const int &browserId,
                               const QCefFrameId& frameId,
                               bool isMainFrame,
                               int errorCode,
                               const QString &errorMsg,
                               const QString &failedUrl)
{
    qInfo() << "errorCode: " << errorCode;
    qInfo() << "errorMsg: " << errorMsg;
    showWebUi();
    showLoadErrorDialog(errorCode, errorMsg);
}

void OnlineView::slotStatusMessage(const QString &message)
{

}

void OnlineView::slotConsoleMessage(const QString &message, int level)
{

}

void OnlineView::slotInvokeMethod(const int &browserId,
                                  const QCefFrameId &frameId,
                                  const QString &method,
                                  const QVariantList &arguments)
{
    if (method == WEB_METHOD_LOAD_ENDED) {
        onWebMethodLoadEnded(arguments);
    } else if (method == WEB_METHOD_MODEL_LIST_UPDATED) {
        onWebMethodModelListUpdated(arguments);
    } else if (method == WEB_METHOD_CONVERSATION_LIST_UPDATED) {
        onWebMethodConversationListUpdated(arguments);
    } else if (method == WEB_METHOD_CONVERSATION_CHANGED) {
        onWebMethodConversationChanged(arguments);
    }
}

void OnlineView::slotAddressChanged(const QCefFrameId &frameId, const QString &url)
{
    if (url.startsWith("http://") || url.startsWith("https://")) {
        mCurrentUrl = url;
    }
    emit signalInputPanelStatusRequested(WEB_EVENT_URL_CHANGED, mCurrentUrl);
}

void OnlineView::slotInputPanelTextUpdated(const QString &text, const QStringList &modelList)
{
    if (modelList.contains(mMsgSendInfo.url))
    {
        QVariantList args = {text};
        sendEvent(WEB_EVENT_INPUT_TEXT_CHANGED, args);
    }
}

void OnlineView::slotSendMsgBtnClicked(const QStringList &modelList)
{
    if (modelList.contains(mMsgSendInfo.url)) {
        sendEvent(WEB_EVENT_INPUT_TEXT_SEND);
    }
}

void OnlineView::slotInputBoxVisibleChanged(bool isVisible)
{
    QVariantList args = {isVisible};
    sendEvent(WEB_EVENT_INPUT_BOX_VISIBLE_CHANGED, args);
}

void OnlineView::slotSidebarVisibleChanged(bool isVisible)
{
    QVariantList args = {isVisible};
    sendEvent(WEB_EVENT_SIDEBAR_VISIBLE_CHANGED, args);
}

void OnlineView::slotLoginBtnClicked()
{
    sendEvent(WEB_EVENT_LOGIN_BTN_CLICKED);
}

void OnlineView::slotNewChatBtnClicked()
{
    sendEvent(WEB_EVENT_CHAT_NEW_BTN_CLICKED);
}

void OnlineView::slotUpQuestionBtnClicked()
{
    sendEvent(WEB_EVENT_QUESTION_UP_BTN_CLICKED);
}

void OnlineView::slotDownQuestionBtnClicked()
{
    sendEvent(WEB_EVENT_QUESTION_DOWN_BTN_CLICKED);
}

void OnlineView::slotAddImageBtnClicked(const QString &fileName)
{
    QFile file(fileName);
    if (!file.open(QFile::ReadOnly)) {
        QMessageBox::warning(this, tr("Error"), tr("Can not open file: ") + fileName);
        return;
    }
    QByteArray data = file.readAll();
    file.close();
    QFileInfo info(fileName);

    QVariantMap status;
    status.insert("data", data);
    status.insert("fileName", info.fileName());
    status.insert("type", "image/" + info.suffix());
    QVariantList args = {status};
    sendEvent(WEB_EVENT_ADD_IMAGE_BTN_CLICKED, args);
}

void OnlineView::slotAddFileBtnClicked(const QString &fileName)
{
    QFile file(fileName);
    if (!file.open(QFile::ReadOnly)) {
        QMessageBox::warning(this, tr("Error"), tr("Can not open file: ") + fileName);
        return;
    }
    QByteArray data = file.readAll();
    file.close();

    QFileInfo info(fileName);

    QVariantMap status;
    status.insert("data", data);
    status.insert("fileName", info.fileName());
    QVariantList args = {status};
    sendEvent(WEB_EVENT_ADD_FILE_BTN_CLICKED, args);
}

void OnlineView::slotInputPanelStatusUpdated(const QString &eventName,
                                             const InputPanelInfo &info, const QString &url)
{
    if (url != mCurrentUrl) {
        return;
    }
    QVariantMap status;
    status.insert("isSidebarVisible", info.isSidebarVisible);
    status.insert("isInputBoxVisible", info.isInputBoxVisible);
    EAppThemeType themeType = SettingsConfig::instance().appThemeType();
    if (themeType == EAppThemeType::System) {
        status.insert("appTheme", isSystemDarkTheme() ? (int)EAppThemeType::Dark : (int)EAppThemeType::Light);
    } else {
        status.insert("appTheme", (int)SettingsConfig::instance().appThemeType());
    }
    status.insert("appLanguage", (int)SettingsConfig::instance().appLanguageType());
    status.insert("url", mCurrentUrl);
    QVariantList args = {status};
    sendEvent(eventName, args);
}

void OnlineView::slotSettingConfigThemeChanged(int theme)
{
    if (theme == (int)EAppThemeType::System) {
        theme = isSystemDarkTheme() ? (int)EAppThemeType::Dark : (int)EAppThemeType::Light;
    }
    // qInfo() << "theme: " << theme;
    QVariantList args = {theme};
    sendEvent(WEB_EVENT_APP_THEME_CHANGED, args);
}

void OnlineView::slotSettingConfigLanguageChanged(int language)
{
    if (language == (int)EAppLanuageType::System)
    {
        QLocale::Language localeLanguage = QLocale::system().language();
        if (localeLanguage == QLocale::Chinese) {
            language = (int)EAppLanuageType::ZH;
        } else {
            language = (int)EAppLanuageType::EN;
        }
    }
    // qInfo() << "language: " << language;
    QVariantList args = {language};
    sendEvent(WEB_EVENT_APP_LANGUAGE_CHANGED, args);
}

void OnlineView::slotWebViewProxyUsed(const QString &url, bool isUsed)
{
    if (url != mMsgSendInfo.url) {
        return;
    }
    if (isUsed) {
        setProxyAddressByConfig();
    } else {
        setProxyAddress("");
    }
    navigateToUrl(mCurrentUrl);
}

void OnlineView::slotAppThemeChanged(const QString &themeMode)
{
    slotSettingConfigThemeChanged(themeMode == APP_THEME_LIGHT_KEY ? (int)EAppThemeType::Light : (int)EAppThemeType::Dark);
}

void OnlineView::connectSignals()
{
    connect(this, &QCefView::beforeBrowse, this, &OnlineView::slotBeforeBrowse);
    connect(this, &QCefView::loadingStateChanged, this, &OnlineView::slotLoadingStateChanged);
    connect(this, &QCefView::loadStart, this, &OnlineView::slotLoadStart);
    connect(this, &QCefView::loadEnd, this, &OnlineView::slotLoadEnd);
    connect(this, &QCefView::loadError, this, &OnlineView::slotLoadError);

    connect(this, &QCefView::addressChanged, this, &OnlineView::slotAddressChanged);
    connect(this, &QCefView::statusMessage, this, &OnlineView::slotStatusMessage);
    connect(this, &QCefView::consoleMessage, this, &OnlineView::slotConsoleMessage);
    connect(this, &QCefView::invokeMethod, this, &OnlineView::slotInvokeMethod);

    connect(InputPanelSignalBus::instance(), &InputPanelSignalBus::signalInputTextChanged, this, &OnlineView::slotInputPanelTextUpdated);
    connect(InputPanelSignalBus::instance(), &InputPanelSignalBus::signalSendMsgBtnClicked, this, &OnlineView::slotSendMsgBtnClicked);
    connect(InputPanelSignalBus::instance(), &InputPanelSignalBus::signalInputBoxVisibleChanged, this, &OnlineView::slotInputBoxVisibleChanged);
    connect(InputPanelSignalBus::instance(), &InputPanelSignalBus::signalSidebarVisibleChanged, this, &OnlineView::slotSidebarVisibleChanged);
    connect(InputPanelSignalBus::instance(), &InputPanelSignalBus::signalLoginBtnClicked, this, &OnlineView::slotLoginBtnClicked);
    connect(InputPanelSignalBus::instance(), &InputPanelSignalBus::signalAddImageBtnClicked, this, &OnlineView::slotAddImageBtnClicked);
    connect(InputPanelSignalBus::instance(), &InputPanelSignalBus::signalAddFileBtnClicked, this, &OnlineView::slotAddFileBtnClicked);
    connect(InputPanelSignalBus::instance(), &InputPanelSignalBus::signalNewChatBtnClicked, this, &OnlineView::slotNewChatBtnClicked);
    connect(InputPanelSignalBus::instance(), &InputPanelSignalBus::signalQuestionUpBtnClicked, this, &OnlineView::slotUpQuestionBtnClicked);
    connect(InputPanelSignalBus::instance(), &InputPanelSignalBus::signalQuestionDownBtnClicked, this, &OnlineView::slotDownQuestionBtnClicked);

    connect(this, &OnlineView::signalInputPanelStatusRequested, InputPanelSignalBus::instance(), &InputPanelSignalBus::signalInputPanelStatusRequested);
    connect(InputPanelSignalBus::instance(), &InputPanelSignalBus::signalInputPanelStatusUpdated, this, &OnlineView::slotInputPanelStatusUpdated);

    connect(this, &OnlineView::signalConversationListUpdated, SidebarSignalBus::instance(), &SidebarSignalBus::signalConversationListUpdated);
    connect(this, &OnlineView::signalConversationChanged, SidebarSignalBus::instance(), &SidebarSignalBus::signalConversationChanged);
    connect(this, &OnlineView::signalOnlineViewCreated, SidebarSignalBus::instance(), &SidebarSignalBus::signalOnlineViewCreated);
    connect(this, &OnlineView::signalOnlineViewDestroyed, SidebarSignalBus::instance(), &SidebarSignalBus::signalOnlineViewDestroyed);
    connect(this, &OnlineView::signalOnlineViewRefreshed, SidebarSignalBus::instance(), &SidebarSignalBus::signalOnlineViewRefreshed);

    connect(this, &OnlineView::signalSettingBtnClicked, SettingSignalBus::instance(), &SettingSignalBus::signalSettingBtnClicked);
    connect(SettingSignalBus::instance(), &SettingSignalBus::signalSettingConfigThemeChanged, this, &OnlineView::slotSettingConfigThemeChanged);
    connect(SettingSignalBus::instance(), &SettingSignalBus::signalSettingConfigLanguageChanged, this, &OnlineView::slotSettingConfigLanguageChanged);
    connect(SettingSignalBus::instance(), &SettingSignalBus::signalWebViewProxyUsed, this, &OnlineView::slotWebViewProxyUsed);

    connect(mUpDownWgt, &QuestionUpDownWidget::signalUpBtnClicked, this, &OnlineView::slotUpQuestionBtnClicked);
    connect(mUpDownWgt, &QuestionUpDownWidget::signalDownBtnClicked, this, &OnlineView::slotDownQuestionBtnClicked);

    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalAppThemeChanged, this, &OnlineView::slotAppThemeChanged);
}

void OnlineView::injectScript(const QCefFrameId& frameId)
{
    QString darkReaderScript = SettingsConfig::instance().webviewDarkReaderScript();
    if (darkReaderScript.isEmpty()) {
        QMessageBox::warning(this, tr("Error"), tr("Can not find dark reader script! The web maybe not change dark theme success!"));
    }
    QString content = darkReaderScript + "\n";

    content += SettingsConfig::instance().webviewCommonInjectScript() + "\n";
    if (content.isEmpty()) {
        QMessageBox::warning(this, tr("Error"), tr("Can not find common inject! The web can not be controlled by OneChat!"));
        return;
    }

    QFile rFile(mInjectScriptPath);
    if (!rFile.open(QFile::ReadOnly)) {
        return;
    }
    content += rFile.readAll() + "\n";
    rFile.close();

    this->executeJavascript(frameId, content, "");
}

void OnlineView::sendEvent(const QString &eventName, const QVariantList &arguments)
{
    QCefEvent event(eventName);
    if (arguments.length() > 0) {
        event.setArguments(arguments);
    }
    this->triggerEvent(event);
}

void OnlineView::onWebMethodLoadEnded(const QVariantList &arguments)
{
    showWebUi();
    if (mLoadEndTimer && mLoadEndTimer->isActive()) {
        mLoadEndTimer->stop();
    }
}

void OnlineView::onWebMethodModelListUpdated(const QVariantList &arguments)
{
    if(arguments.size() != 1) {
        return;
    }

    QList<WebModelInfo> webModelList;
    foreach(const auto& arg, arguments[0].toList())
    {
        WebModelInfo info;
        QMap<QString, QVariant> map = arg.toMap();
        info.id = map["id"].toString();
        info.name = map["name"].toString();
        info.desc = map["desc"].toString();
        webModelList.append(info);
    }
    emit signalModelListUpdated(mMsgSendInfo.url, webModelList);
}

void OnlineView::onWebMethodConversationListUpdated(const QVariantList &arguments)
{
    if(arguments.size() != 1) {
        return;
    }
    mWebConversationList.clear();
    foreach(const auto& arg, arguments[0].toList())
    {
        WebConversationInfo info;
        QMap<QString, QVariant> map = arg.toMap();
        info.id = map["id"].toString();
        info.title = map["title"].toString();
        info.subTitle = map["subTitle"].toString();
        mWebConversationList.append(info);
    }
    emit signalConversationListUpdated(mMsgSendInfo.url, mWebConversationList);
    if (!mConversationId.isEmpty()) {
        emit signalConversationChanged(mMsgSendInfo.url, mConversationId);
    }
}

void OnlineView::onWebMethodConversationChanged(const QVariantList &arguments)
{
    qDebug() << "arguments: " << arguments;
    if(arguments.size() != 1) {
        return;
    }
    mConversationId = arguments[0].toString();
    emit signalConversationChanged(mMsgSendInfo.url, mConversationId);
}

void OnlineView::setProxyAddressByConfig()
{
    ProxySettingModel &proxyModel = SettingsConfig::instance().proxyModel();
    if (proxyModel.isEnableProxy &&
        !proxyModel.proxyAddress.isEmpty() &&
        proxyModel.enableProxyList.contains(mMsgSendInfo.url))
    {
        this->setProxyAddress(proxyModel.proxyAddress);
    }
    else
    {
        this->setProxyAddress("");
    }
}

void OnlineView::showLoadErrorDialog(int errorCode, const QString &errorMsg)
{
    QMessageBox msgBox = QMessageBox(QMessageBox::Information,
                                     tr("Load Error"),
                                     "\n" + tr("Error Code: ") + QString::number(errorCode) + "\n" + tr("Error Msg: ") + errorMsg +
                                         "\n" + tr("Do you need to reload using a proxy?"),
                                     QMessageBox::Yes | QMessageBox::Retry | QMessageBox::No, this);
    msgBox.button(QMessageBox::Yes)->setText(tr("Use Proxy"));
    msgBox.button(QMessageBox::Retry)->setText(tr("Reload"));
    msgBox.button(QMessageBox::No)->setText(tr("Cancel"));
    int res = msgBox.exec();
    if (res == QMessageBox::Yes)
    {
        ProxySettingModel &proxyModel = SettingsConfig::instance().proxyModel();
        if (proxyModel.isEnableProxy && !proxyModel.proxyAddress.isEmpty())
        {
            if (proxyModel.enableProxyList.contains(mMsgSendInfo.url))
            {
                QMessageBox::warning(this,
                                     tr("Error"),
                                     tr("Proxy is enabled! Please ensure the proxy address is useful!"));
                emit signalSettingBtnClicked(ESettingDialogTabType::Proxy, mMsgSendInfo.url);
            }
            else
            {
                proxyModel.enableProxyList.append(mMsgSendInfo.url);
                SettingsConfig::instance().save();

                setProxyAddress(proxyModel.proxyAddress);
                browserReload();
            }
        }
        else
        {
            emit signalSettingBtnClicked(ESettingDialogTabType::Proxy, mMsgSendInfo.url);
        }
    }
    else if (res == QMessageBox::Retry)
    {
        browserReload();
    }
}

void OnlineView::repositionUpDownWidget()
{
    mUpDownWgt->move(this->size().width() - mUpDownWgt->width() - 15, this->size().height() / 2);
}

void OnlineView::showWebUi()
{
    if (mLoadingWgt->isVisible()) {
        mLoadingWgt->hide();
    }
    mUpDownWgt->show();
    repositionUpDownWidget();
}
