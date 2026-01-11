#ifndef SETTINGSDLG_H
#define SETTINGSDLG_H

#include <QDialog>
#include <QVariant>
#include "../../def.h"

class QHBoxLayout;
class QScrollArea;
class QToolButton;
class QStackedWidget;
class CommonSettingWidget;
class ProxySettingWidget;
class DebugSettingWidget;
class AboutSettingWidget;
class SettingsDlg : public QDialog
{
    Q_OBJECT
public:
    SettingsDlg(ESettingDialogTabType tabType,
                const QVariant &info,
                QWidget *parent = nullptr);
public slots:
    void slotAppThemeChanged(const QString &themeMode);
\
protected:
    void paintEvent(QPaintEvent *event) override;
    void changeEvent(QEvent *event) override;
private:
    void slotSidebarBtnClicked();
private:
    void initUi();
    void initSidebarUi();
    void initContentUi();
    void setConnections();
    void initData();
    void retranslateUi();
private:
    QHBoxLayout             *mLayout = nullptr;
    QWidget                 *mSidebarWgt = nullptr;
    QStackedWidget          *mContentStack = nullptr;

    QToolButton             *mCommonSettingBtn = nullptr;
    QToolButton             *mProxySettingBtn = nullptr;
    QToolButton             *mDebugSettingBtn = nullptr;
    QToolButton             *mAboutSettingBtn = nullptr;

    CommonSettingWidget     *mCommonSettingWgt = nullptr;
    ProxySettingWidget      *mProxySettingWgt = nullptr;
    DebugSettingWidget      *mDebugSettingWgt = nullptr;
    AboutSettingWidget      *mAboutSettingWgt = nullptr;

    ESettingDialogTabType    mDefaultTabType = ESettingDialogTabType::End;
    QVariant                 mDefaultInfo;
};

#endif // SETTINGSDLG_H
