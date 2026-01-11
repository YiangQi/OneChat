#include "settingsconfig.h"
#include <QCoreApplication>
#include <QJsonDocument>
#include <QMessageBox>
#include <QJsonObject>
#include <QJsonArray>
#include <QFileInfo>
#include <QFile>

const char* setting_json_name = "settings.json";
const char* common_obj_key = "common";
const char* common_theme_type_key = "themeType";
const char* common_language_type_key = "languageType";
const char* proxy_obj_key = "proxy";
const char* proxy_enable_proxy_key = "enableProxy";
const char* proxy_proxy_address_key = "proxyAddress";
const char* proxy_enable_url_key = "enableProxyOnlineUrl";

SettingsConfig &SettingsConfig::instance()
{
    static SettingsConfig config;
    return config;
}

void SettingsConfig::init()
{
    QString jsonPath = QCoreApplication::applicationDirPath() + "/" + setting_json_name;
    if (!QFileInfo::exists(jsonPath)) {
        return;
    }

    QFile rFile(jsonPath);
    if (!rFile.open(QFile::ReadOnly)) {
        return;
    }

    QByteArray content = rFile.readAll();
    rFile.close();

    QJsonParseError jsonError;
    QJsonDocument jsonDoc = QJsonDocument::fromJson(content, &jsonError);
    if (jsonError.error != QJsonParseError::NoError) {
        QString log = QObject::tr("Parse json failed! Error: ") + jsonError.errorString();
        QMessageBox::warning(nullptr,
                             QObject::tr("Error"),
                             log,
                             QMessageBox::Ok);
        return;
    }
    QJsonObject rootObj = jsonDoc.object();
    parseCommonModel(rootObj);
    parseProxyModel(rootObj);
}

void SettingsConfig::save()
{
    QJsonObject rootObj;
    writeCommonModel(rootObj);
    writeProxyModel(rootObj);

    QJsonDocument jsonDoc(rootObj);
    QString jsonPath = QCoreApplication::applicationDirPath() + "/" + setting_json_name;
    QFile wFile(jsonPath);
    if (!wFile.open(QFile::WriteOnly))
    {
        QMessageBox::warning(nullptr,
                             QObject::tr("Error"),
                             QObject::tr("Can not write setting configuraion: ") + jsonPath);
        return;
    }

    wFile.write(jsonDoc.toJson());
    wFile.close();
}

SettingsConfig::SettingsConfig()
{
    initWebViewCommonInjectScript();
    initWebViewDarkReaderScript();
}

void SettingsConfig::initWebViewCommonInjectScript()
{
    QString baseInjectFilePath = QCoreApplication::applicationDirPath() + "/online/common_inject.js";
    if (!QFileInfo::exists(baseInjectFilePath))
    {
        return;
    }
    QFile rFile(baseInjectFilePath);
    if (!rFile.open(QFile::ReadOnly)) {
        return;
    }
    mWebViewCommonInjectScript = rFile.readAll();
    rFile.close();
}

void SettingsConfig::initWebViewDarkReaderScript()
{
    QString darkReaderFilePath = QCoreApplication::applicationDirPath() + "/online/darkreader.min.js";
    if (!QFileInfo::exists(darkReaderFilePath))
    {
        return;
    }
    QFile rFile(darkReaderFilePath);
    if (!rFile.open(QFile::ReadOnly)) {
        return;
    }
    mWebViewDarkReaderScript = rFile.readAll();
    rFile.close();
}

void SettingsConfig::parseCommonModel(const QJsonObject &rootObj)
{
    if (!rootObj.contains(common_obj_key)) {
        return;
    }
    QJsonObject commonObj = rootObj[common_obj_key].toObject();
    if (commonObj.contains(common_theme_type_key))
    {
        int type = commonObj[common_theme_type_key].toInt();
        if (type < (int)EAppThemeType::End) {
            mCommonModel.themeType = (EAppThemeType)type;
        }
    }
    if (commonObj.contains(common_language_type_key))
    {
        int type = commonObj[common_language_type_key].toInt();
        if (type < (int)EAppLanuageType::End) {
            mCommonModel.languageType = (EAppLanuageType)type;
        }
    }
}

void SettingsConfig::parseProxyModel(const QJsonObject &rootObj)
{
    if (!rootObj.contains(proxy_obj_key)) {
        return;
    }
    QJsonObject proxyObj = rootObj[proxy_obj_key].toObject();
    if (proxyObj.contains(proxy_enable_proxy_key)) {
        mProxyModel.isEnableProxy = proxyObj[proxy_enable_proxy_key].toBool();
    }
    if (proxyObj.contains(proxy_proxy_address_key)) {
        mProxyModel.proxyAddress = proxyObj[proxy_proxy_address_key].toString();
    }
    if (proxyObj.contains(proxy_enable_url_key))
    {
        QJsonArray urlArray = proxyObj[proxy_enable_url_key].toArray();
        foreach(const auto &urlValue, urlArray)
        {
            mProxyModel.enableProxyList.append(urlValue.toString());
        }
    }
}

void SettingsConfig::writeCommonModel(QJsonObject &rootObj)
{
    QJsonObject commonObj;
    commonObj[common_theme_type_key] = (int)mCommonModel.themeType;
    commonObj[common_language_type_key] = (int)mCommonModel.languageType;
    rootObj[common_obj_key] = commonObj;
}

void SettingsConfig::writeProxyModel(QJsonObject &rootObj)
{
    QJsonObject proxyObj;
    proxyObj[proxy_enable_proxy_key] = mProxyModel.isEnableProxy;
    if (!mProxyModel.proxyAddress.isEmpty()) {
        proxyObj[proxy_proxy_address_key] = mProxyModel.proxyAddress;
    }
    if (mProxyModel.enableProxyList.size() > 0)
    {
        QJsonArray proxyArray;
        foreach(const auto& url, mProxyModel.enableProxyList)
        {
            proxyArray.push_back(url);
        }
        proxyObj[proxy_enable_url_key] = proxyArray;
    }
    rootObj[proxy_obj_key] = proxyObj;
}
