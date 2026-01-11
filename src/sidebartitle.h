#ifndef SIDEBARTITLE_H
#define SIDEBARTITLE_H

#include "def.h"
#include <QWidget>
#include <QVariant>

class QVBoxLayout;
class QToolButton;
class SidebarTitle : public QWidget
{
    Q_OBJECT
public:
    explicit SidebarTitle(QWidget *parent = nullptr);

signals:
    void signalSidebarBtnClicked(ESidebarButtonType btnType, bool checked);
    void signalSettingBtnClicked(ESettingDialogTabType tabType, const QVariant &var = "");
protected:
    void paintEvent(QPaintEvent *event) override;

private slots:
    void slotAppThemeChanged(const QString &themeMode);
    void slotSidebarBtnClicked(bool checked);
    void slotSidebarPanelShown(ESidebarButtonType btnType, bool isVisible);
    void slotSettingBtnClicked();
private:
    void initUi();
    void initTopUi();
    void initBottomUi();

    void setConnections();
private:
    QString             mThemeMode;
    QVBoxLayout         *mLayout = nullptr;
    QToolButton         *mOnlineBtn = nullptr;
    QToolButton         *mSettingBtn = nullptr;
};

#endif // SIDEBARTITLE_H
