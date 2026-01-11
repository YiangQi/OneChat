#ifndef CENTRALSIGNALBUS_H
#define CENTRALSIGNALBUS_H

#include "../def.h"
#include <QObject>

class CentralSignalBus : public QObject
{
    Q_OBJECT
public:
    static CentralSignalBus *instance()
    {
        static CentralSignalBus bus;
        return &bus;
    }
signals:
    void signalSidePanelOnlineItemClicked(const OnlineItemInfo &itemInfo);
    void signalSetProxyInConfigDialogClicked(const QString &url);
private:
    explicit CentralSignalBus(QObject *parent = nullptr)
        : QObject{parent}
    {}
};

#endif // CENTRALSIGNALBUS_H
