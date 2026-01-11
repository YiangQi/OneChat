#ifndef SIDEBARPANEL_H
#define SIDEBARPANEL_H

#include "def.h"
#include <QWidget>

class OnlinePanel;
class QStackedLayout;
class SidebarPanel : public QWidget
{
    Q_OBJECT
public:
    explicit SidebarPanel(QWidget *parent = nullptr);

signals:
    void signalSidebarPanelShown(ESidebarButtonType btnType, bool isVisible);

protected:
    void paintEvent(QPaintEvent *event) override;
    void changeEvent(QEvent *event) override;
private slots:
    void slotMainWindowSplitterMoved(int pos, int index);
    void slotSidebarBtnClicked(ESidebarButtonType btnType, bool checked);

private:
    void initUi();
    void setConnections();
private:
    QStackedLayout      *mStackLayout = nullptr;

    OnlinePanel         *mOnlinePanel = nullptr;
};

#endif // SIDEBARPANEL_H
