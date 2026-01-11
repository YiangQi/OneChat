#include "centralwidget.h"
#include "signalbus/centralsignalbus.h"
#include "signalbus/sidebarsignalbus.h"
#include "centralwidget/onlineview.h"
#include "control/dock/dockwidget.h"
#include "control/dock/docktabbuttonwidget.h"
#include "control/dock/dockwidgettabbar.h"
#include <QStyleOption>
#include <QPainter>
#include <QLabel>

CentralWidget::CentralWidget(QWidget *parent)
    : DockContainer{parent}
{
    setConnections();
}

void CentralWidget::closeAllWebView()
{
    for(auto it = mOnlineViewMap.begin(); it != mOnlineViewMap.end(); it++)
    {
        OnlineView *onlineView = it.value();
        onlineView->close();
    }
}

void CentralWidget::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
}

void CentralWidget::slotPanelOnlineItemClicked(const OnlineItemInfo &itemInfo)
{
    if (mOnlineViewMap.contains(itemInfo.url)) {
        return;
    }
    QCefSetting setting;
    setting.setWindowlessFrameRate(1000);
    QColor background(0, 0, 0, 0);
    setting.setBackgroundColor(background);

    OnlineView *webView = new OnlineView(itemInfo, &setting, this);
    webView->setProperty(DOCK_WIDGET_CONTENT_TYPE, (int)DockWidgetContentType::OnlineView);
    DockWidgetTabInfo tabInfo(itemInfo.icon, itemInfo.name);
    DockWidget *dockWgt = createDockWidget(tabInfo, webView, nullptr, DockDirection::Right);

    DockTabButtonWidget *tabBtnWgt = new DockTabButtonWidget(true, dockWgt->getTabBar());
    connect(tabBtnWgt, &DockTabButtonWidget::signalRefreshBtnClicked, webView, &OnlineView::slotTabBarRefreshBtnClicked);
    connect(webView, &OnlineView::signalLoadStateChanged, tabBtnWgt, &DockTabButtonWidget::slotSetRefreshBtnDisabled);
    dockWgt->addDockTabRightButton(0, tabBtnWgt);

    mOnlineViewMap.insert(itemInfo.url, webView);
}

void CentralWidget::slotOnlineViewDestroyed(const MsgSendInfo &msgSendInfo)
{
    if (mOnlineViewMap.contains(msgSendInfo.url)) {
        mOnlineViewMap.remove(msgSendInfo.url);
    }
}

void CentralWidget::slotPanelConversationItemClicked(const QString &url,
                                                     const QString &chatId)
{
    if (!mOnlineViewMap.contains(url)) {
        return;
    }
    mOnlineViewMap[url]->loadConversation(chatId);
}

void CentralWidget::setConnections()
{
    connect(CentralSignalBus::instance(), &CentralSignalBus::signalSidePanelOnlineItemClicked, this, &CentralWidget::slotPanelOnlineItemClicked);
    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalOnlineViewDestroyed, this, &CentralWidget::slotOnlineViewDestroyed);
    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalPanelConversationItemClicked, this, &CentralWidget::slotPanelConversationItemClicked);
}
