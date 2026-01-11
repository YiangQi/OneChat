#ifndef INPUTPANELSIGNALBUS_H
#define INPUTPANELSIGNALBUS_H

#include "../def.h"
#include <QObject>

class InputPanelSignalBus : public QObject
{
    Q_OBJECT
public:
    static InputPanelSignalBus* instance()
    {
        static InputPanelSignalBus bus;
        return &bus;
    }
signals:
    void signalInputTextChanged(const QString &text, const QStringList &modelList);
    void signalSendMsgBtnClicked(const QStringList &modelList);
    void signalInputBoxVisibleChanged(bool isVisible);
    void signalSidebarVisibleChanged(bool isVisible);
    void signalLoginBtnClicked();
    void signalNewChatBtnClicked();
    void signalQuestionUpBtnClicked();
    void signalQuestionDownBtnClicked();
    void signalAddImageBtnClicked(const QString &fileName);
    void signalAddFileBtnClicked(const QString &fileName);

    void signalInputPanelStatusRequested(const QString &eventName, const QString &url);
    void signalInputPanelStatusUpdated(const QString &eventName,
                                       const InputPanelInfo &info,
                                       const QString &url);

private:
    explicit InputPanelSignalBus(QObject *parent = nullptr)
        : QObject{parent}
    {}

};

#endif // INPUTPANELSIGNALBUS_H
