#ifndef SIDEBARSIGNALBUS_H
#define SIDEBARSIGNALBUS_H

#include "../def.h"
#include <QObject>
#include <QVariant>

class SidebarSignalBus : public QObject
{
    Q_OBJECT
public:
    static SidebarSignalBus* instance()
    {
        static SidebarSignalBus bus;
        return &bus;
    }
signals:
    void signalAppThemeChanged(const QString &themeMode);
    void signalMainWindowSplitterMoved(int pos, int index);

    void signalSidebarBtnClicked(ESidebarButtonType btnType, bool checked);
    void signalSidebarPanelShown(ESidebarButtonType btnType, bool isVisible);

    void signalPanelOnlineItemClicked(const OnlineItemInfo &itemInfo);
    void signalPanelConversationItemClicked(const QString &url,
                                            const QString &chatId);

    void signalConversationListUpdated(const QString &url,
                                       const QList<WebConversationInfo> &infoList);
    void signalConversationChanged(const QString &url,
                                   const QString &conversationId);

    void signalOnlineViewCreated(const MsgSendInfo &msgSendInfo);
    void signalOnlineViewDestroyed(const MsgSendInfo &msgSendInfo);
    void signalOnlineViewRefreshed(const QString &url);
private:
    SidebarSignalBus(QObject *parent = nullptr)
        : QObject{parent}
    {
    }
};

#endif // SIDEBARSIGNALBUS_H
