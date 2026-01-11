#ifndef SETTINGSIGNALBUS_H
#define SETTINGSIGNALBUS_H

#include "../def.h"
#include <QObject>
#include <QVariant>

class SettingSignalBus: public QObject
{
    Q_OBJECT
public:
    static SettingSignalBus *instance()
    {
        static SettingSignalBus bus;
        return &bus;
    }
signals:
    void signalSettingConfigThemeChanged(int theme);
    void signalSettingConfigLanguageChanged(int language);
    void signalSettingBtnClicked(ESettingDialogTabType tabType, const QVariant &var = "");
    void signalWebViewProxyUsed(const QString &url, bool isUsed);

private:
    SettingSignalBus(QObject *parent = nullptr)
        : QObject{parent}
    {}
};

#endif // SETTINGSIGNALBUS_H
