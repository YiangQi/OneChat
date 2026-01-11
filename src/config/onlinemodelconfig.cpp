#include "onlinemodelconfig.h"
#include <QCoreApplication>
#include <QFileInfo>
#include <QJsonDocument>
#include <QJsonArray>
#include <QJsonObject>
#include <QDebug>

OnlineModelConfig &OnlineModelConfig::instance()
{
    static OnlineModelConfig config;
    return config;
}

OnlineModelConfig::OnlineModelConfig()
{
    loadOnlineData();
}

void OnlineModelConfig::loadOnlineData()
{
    QString path = QCoreApplication::applicationDirPath() + "/online/online.json";
    if (!QFileInfo::exists(path)) {
        qWarning() << "Can not find path: " << path;
        mModelLoadErrorType = EModelLoadErrorType::NotFound;
        return;
    }

    QFile file(path);
    if (!file.open(QIODevice::ReadOnly))
    {
        qWarning() << "Can not open file: " << path;
        mModelLoadErrorType = EModelLoadErrorType::OpenFailed;
        return;
    }

    QByteArray data = file.readAll();
    QJsonParseError parseError;
    QJsonDocument jsonDoc = QJsonDocument::fromJson(data, &parseError);
    if (parseError.error != QJsonParseError::NoError)
    {
        qWarning() << path << " parse error: " << parseError.errorString();
        mModelLoadErrorType = EModelLoadErrorType::JsonParseError;
        return;
    }

    if (!jsonDoc.isArray()) {
        qWarning() << path << " json fomat error!";
        mModelLoadErrorType = EModelLoadErrorType::JsonFormatError;
        return;
    }

    QJsonArray array = jsonDoc.array();
    if(!loadJsonArray(array)) {
        qWarning() << path << " json data parse error!";
        mModelLoadErrorType = EModelLoadErrorType::JsonParseError;
        return;
    }
}

bool OnlineModelConfig::loadJsonArray(const QJsonArray &array)
{
    try
    {
        foreach(auto item, array)
        {
            if (item.isNull()) {
                continue;
            }
            QJsonObject itemInfo = item.toObject();
            OnlineItemInfo onlineItemInfo;
            if (itemInfo.contains("name")) {
                onlineItemInfo.name = itemInfo["name"].toString();
            }
            if (itemInfo.contains("url")) {
                onlineItemInfo.url = itemInfo["url"].toString();
            }
            if (itemInfo.contains("icon"))
            {
                onlineItemInfo.icon = itemInfo["icon"].toString();
                if (QFileInfo(onlineItemInfo.icon).isRelative()) {
                    onlineItemInfo.icon = QCoreApplication::applicationDirPath() + "/online/" + onlineItemInfo.icon;
                }
            }
            if (itemInfo.contains("script"))
            {
                onlineItemInfo.script = itemInfo["script"].toString();
                if (QFileInfo(onlineItemInfo.script).isRelative()) {
                    onlineItemInfo.script = QCoreApplication::applicationDirPath() + "/online/" + onlineItemInfo.script;
                }
            }
            if (onlineItemInfo.name.isEmpty() ||
                onlineItemInfo.url.isEmpty() ||
                !QFileInfo::exists(onlineItemInfo.icon) ||
                !QFileInfo::exists(onlineItemInfo.script))
            {
                continue;
            }
            mOnlineInfoList.push_back(onlineItemInfo);
        }
    }
    catch(std::exception exception)
    {
        qWarning() << "Catch exception: " << exception.what();
        return false;
    }
    return true;
}
