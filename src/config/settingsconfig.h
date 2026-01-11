#ifndef SETTINGSCONFIG_H
#define SETTINGSCONFIG_H

#include "../def.h"
#include <QJsonObject>

struct CommonSettingModel
{
    EAppThemeType       themeType = EAppThemeType::System;
    EAppLanuageType     languageType = EAppLanuageType::System;
};

struct ProxySettingModel
{
    bool                    isEnableProxy = false;
    QString                 proxyAddress;
    QList<QString>          enableProxyList;
};

struct DebugSettingModel
{
    bool    isOpenDevTool = false;
};

class SettingsConfig
{
public:
    static SettingsConfig &instance();

    CommonSettingModel &commonModel() {return mCommonModel;}
    ProxySettingModel &proxyModel() {return mProxyModel;}
    DebugSettingModel &debugModel() {return mDebugModel;}

    EAppThemeType appThemeType() const {return mCommonModel.themeType;}
    EAppLanuageType appLanguageType() const {return mCommonModel.languageType;}

    QString webviewCommonInjectScript() const {return mWebViewCommonInjectScript;}
    QString webviewDarkReaderScript() const {return mWebViewDarkReaderScript;}
    void init();
    void save();
private:
    SettingsConfig();

    void initWebViewCommonInjectScript();
    void initWebViewDarkReaderScript();

    void parseCommonModel(const QJsonObject &rootObj);
    void parseProxyModel(const QJsonObject &rootObj);

    void writeCommonModel(QJsonObject &rootObj);
    void writeProxyModel(QJsonObject &rootObj);
private:

    CommonSettingModel          mCommonModel;
    ProxySettingModel           mProxyModel;
    DebugSettingModel           mDebugModel;

    QString                     mWebViewCommonInjectScript;
    QString                     mWebViewDarkReaderScript;
};

#endif // SETTINGSCONFIG_H
