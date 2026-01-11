#ifndef ONLINEMODELCONFIG_H
#define ONLINEMODELCONFIG_H

#include "../def.h"

enum class EModelLoadErrorType
{
    None,
    NotFound,
    OpenFailed,
    JsonParseError,
    JsonFormatError
};

class OnlineModelConfig
{
public:
    static OnlineModelConfig &instance();
    EModelLoadErrorType getErrorType() const {return mModelLoadErrorType;}
    const QVector<OnlineItemInfo> &getModelList() const {return mOnlineInfoList;}
private:
    OnlineModelConfig();
    void loadOnlineData();
    bool loadJsonArray(const QJsonArray &array);
private:
    QVector<OnlineItemInfo>         mOnlineInfoList;
    EModelLoadErrorType             mModelLoadErrorType = EModelLoadErrorType::None;
};

#endif // ONLINEMODELCONFIG_H
