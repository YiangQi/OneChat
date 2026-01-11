#ifndef CENTRALWIDGET_H
#define CENTRALWIDGET_H

#include "def.h"
#include "control/dock/dockcontainer.h"
#include "centralwidget/onlineview.h"
#include <QWidget>

class CentralWidget : public DockContainer
{
    Q_OBJECT
public:
    explicit CentralWidget(QWidget *parent = nullptr);
    void closeAllWebView();
signals:

protected:
    void paintEvent(QPaintEvent *event) override;

private slots:
    void slotPanelOnlineItemClicked(const OnlineItemInfo &itemInfo);
    void slotOnlineViewDestroyed(const MsgSendInfo &msgSendInfo);
    void slotPanelConversationItemClicked(const QString &url,
                                          const QString &chatId);
private:
    void setConnections();

private:
    QMap<QString, OnlineView*>     mOnlineViewMap;
};

#endif // CENTRALWIDGET_H
