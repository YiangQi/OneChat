#ifndef INPUTPANEL_H
#define INPUTPANEL_H

#include "def.h"
#include <QWidget>

class InputTextEdit;
class QToolButton;
class QLabel;
class QComboBox;
class QStandardItemModel;
class QStandardItem;
class InputPanel : public QWidget
{
    Q_OBJECT
public:
    explicit InputPanel(QWidget *parent = nullptr);

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

    void signalInputPanelStatusUpdated(const QString &eventName,
                                       const InputPanelInfo &info,
                                       const QString &url);
public slots:
    void slotInputPanelStatusRequested(const QString &eventName, const QString &url);
    void slotAppThemeChanged(const QString &themeMode);
    void slotOnlineViewCreated(const MsgSendInfo &msgSendInfo);
    void slotOnlineViewDestroyed(const MsgSendInfo &msgSendInfo);
protected:
    void paintEvent(QPaintEvent *event) override;
    void changeEvent(QEvent *event) override;
    bool eventFilter(QObject *obj, QEvent *event) override;
private slots:
    void slotTextEditTextChanged();
    void slotSendMsgBtnClicked();
    void slotAddFileBtnClicked();
    void slotAddImageBtnClicked();
private:
    void initUi();
    void initHeaderUi();
    void initBottomUi();
    void setConnections();
    void retranslateUi();
    void resetSendToCbbModel();
    void updateSendToCbbModelState(QStandardItem *item);
private:
    QWidget             *mMainWgt = nullptr;
    QWidget             *mHeaderWgt = nullptr;
    QWidget             *mBottomWgt = nullptr;
    InputTextEdit       *mTextEdit = nullptr;

    QToolButton         *mLoginBtn = nullptr;
    QToolButton         *mSidebarUnfoldBtn = nullptr;
    QToolButton         *mShowInputBtn = nullptr;
    QToolButton         *mChatNewBtn = nullptr;
    QToolButton         *mQuestionUpBtn = nullptr;
    QToolButton         *mQuestionDownBtn = nullptr;
    QLabel              *mSendToLbl = nullptr;
    QComboBox           *mSendToCbb = nullptr;
    QStandardItemModel  *mSendToCbbModel = nullptr;
    QStringList         mSendToModelList;

    QToolButton         *mSendMsgBtn = nullptr;
    QToolButton         *mAddFileBtn = nullptr;
    QToolButton         *mAddImageBtn = nullptr;
};

#endif // INPUTPANEL_H
