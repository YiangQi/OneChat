#include "sidebarpanel.h"
#include "sidebarpanel/onlinepanel.h"
#include "signalbus/sidebarsignalbus.h"
#include <QStyleOption>
#include <QStackedLayout>
#include <QPainter>
#include <QShowEvent>
#include <QDebug>

SidebarPanel::SidebarPanel(QWidget *parent)
    : QWidget{parent}
{
    initUi();
    setConnections();
}

void SidebarPanel::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
}

void SidebarPanel::changeEvent(QEvent *event)
{
    if (event->type() == QEvent::LanguageChange)
    {
        qInfo() << "sidebar Panel language changed";
    }
    QWidget::changeEvent(event);
}

void SidebarPanel::slotMainWindowSplitterMoved(int pos, int index)
{
    Q_UNUSED(index);
    bool isVisible = pos != 0;
    ESidebarButtonType btnType = ESidebarButtonType::End;
    if (mStackLayout->currentWidget() == mOnlinePanel){
        btnType = ESidebarButtonType::Online;
    }
    if (btnType != ESidebarButtonType::End) {
        emit signalSidebarPanelShown(btnType, isVisible);
    }
}

void SidebarPanel::slotSidebarBtnClicked(ESidebarButtonType btnType, bool checked)
{
    Q_UNUSED(checked);
    if (btnType == ESidebarButtonType::Online)
    {
        mStackLayout->setCurrentWidget(mOnlinePanel);
    }
}

void SidebarPanel::initUi()
{
    mStackLayout = new QStackedLayout;
    mStackLayout->setContentsMargins(0, 0, 0, 0);
    mStackLayout->setSpacing(0);
    this->setLayout(mStackLayout);

    mOnlinePanel = new OnlinePanel(this);
    mStackLayout->addWidget(mOnlinePanel);
}

void SidebarPanel::setConnections()
{
    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalSidebarBtnClicked, this, &SidebarPanel::slotSidebarBtnClicked);
    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalMainWindowSplitterMoved, this, &SidebarPanel::slotMainWindowSplitterMoved);
    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalConversationListUpdated, mOnlinePanel, &OnlinePanel::slotConversationListUpdated);
    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalConversationChanged, mOnlinePanel, &OnlinePanel::slotConversationChanged);

    connect(this, &SidebarPanel::signalSidebarPanelShown, SidebarSignalBus::instance(), &SidebarSignalBus::signalSidebarPanelShown);
}
