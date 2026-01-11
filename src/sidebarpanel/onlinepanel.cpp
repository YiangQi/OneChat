#include "onlinepanel.h"
#include "control/onlinetreeitemwidget.h"
#include "../config/onlinemodelconfig.h"
#include "../signalbus/sidebarsignalbus.h"
#include <QVBoxLayout>
#include <QTreeWidget>
#include <QEvent>
#include <QDebug>
#include <QLabel>
#include <QFile>

const int USER_ROLE_IDENTIFIER = Qt::UserRole + 1;
const int USER_ROLE_ONLINE_NAME = Qt::UserRole + 2;
const int USER_ROLE_ONLINE_ICON = Qt::UserRole + 3;
const int USER_ROLE_ONLINE_URL = Qt::UserRole + 4;
const int USER_ROLE_ONLINE_SCRIPT = Qt::UserRole + 5;

const int USER_ROLE_ONLINE_SUBITEM_ID = Qt::UserRole + 1;

OnlinePanel::OnlinePanel(QWidget *parent)
    : QWidget{parent}
{
    initUi();
    setConnections();

    initTreeData();
    retranslateUi();
}

void OnlinePanel::slotAppThemeChanged(const QString &themeMode)
{
    QFile file(":/qss/" + themeMode + "/onlinepanel.qss");
    if (file.open(QFile::ReadOnly))
    {
        QString qss = QLatin1String(file.readAll());
        this->setStyleSheet(qss);
        file.close();
    }
}

void OnlinePanel::slotConversationListUpdated(const QString &url,
                                              const QList<WebConversationInfo> &infoList)
{
    for(int i = 0; i < mOnlineTree->topLevelItemCount(); i++)
    {
        QTreeWidgetItem *item = mOnlineTree->topLevelItem(i);
        if (item != nullptr)
        {
            QString itemUrl = item->data(0, USER_ROLE_ONLINE_URL).toString();
            if (itemUrl == url)
            {
                deleteTopItemChildren(item);
                foreach(const auto &info, infoList)
                {
                    QTreeWidgetItem *subItem = new QTreeWidgetItem(item);
                    subItem->setText(0, info.title);
                    subItem->setToolTip(0, info.subTitle);
                    subItem->setData(0, USER_ROLE_ONLINE_SUBITEM_ID, info.id);
                    subItem->setForeground(0, QBrush(QColor(65, 65, 65)));
                }
                // item->setExpanded(true);
            }
        }
    }

}

void OnlinePanel::slotConversationChanged(const QString &url,
                                          const QString &conversationId)
{
    for(int i = 0; i < mOnlineTree->topLevelItemCount(); i++)
    {
        QTreeWidgetItem *item = mOnlineTree->topLevelItem(i);
        if (item != nullptr)
        {
            QString itemUrl = item->data(0, USER_ROLE_ONLINE_URL).toString();
            if (itemUrl == url)
            {
                for(int j = 0; j < item->childCount(); j++)
                {
                    QTreeWidgetItem *subItem = item->child(j);
                    if (subItem != nullptr)
                    {
                        QString id = subItem->data(0, USER_ROLE_ONLINE_SUBITEM_ID).toString();
                        subItem->setSelected(id == conversationId);
                    }
                }
                break;
            }
        }
    }
}

void OnlinePanel::slotOnlineViewDestroyed(const MsgSendInfo &msgSendInfo)
{
    slotOnlineViewItemRemoved(msgSendInfo.url);
}

void OnlinePanel::slotOnlineViewItemRemoved(const QString &url)
{
    for(int i = 0; i < mOnlineTree->topLevelItemCount(); i++)
    {
        QTreeWidgetItem *topItem = mOnlineTree->topLevelItem(i);
        QString topUrl = topItem->data(0, USER_ROLE_ONLINE_URL).toString();
        if (url == topUrl)
        {
            deleteTopItemChildren(topItem);
            break;
        }
    }
}

void OnlinePanel::changeEvent(QEvent *event)
{
    if (event->type() == QEvent::LanguageChange)
    {
        retranslateUi();
    }
    QWidget::changeEvent(event);
}

void OnlinePanel::slotItemClicked(QTreeWidgetItem *item, int column)
{
    if (item == nullptr) {
        return;
    }
    if (isTopLevelItem(item))
    {
        if (item->childCount() == 0)
        {
            OnlineItemInfo itemInfo;
            itemInfo.name = item->data(column, USER_ROLE_ONLINE_NAME).toString();
            itemInfo.icon = item->data(column, USER_ROLE_ONLINE_ICON).toString();
            itemInfo.url = item->data(column, USER_ROLE_ONLINE_URL).toString();
            itemInfo.script = item->data(column, USER_ROLE_ONLINE_SCRIPT).toString();
            emit signalPanelOnlineItemClicked(itemInfo);
        }
        else
        {
            item->setExpanded(!item->isExpanded());
        }
    }
    else
    {
        QTreeWidgetItem *parentItem = item->parent();
        if (parentItem == nullptr) {
            return;
        }
        unselectTreeItemChildren(parentItem);
        QString url = parentItem->data(0, USER_ROLE_ONLINE_URL).toString();
        QString chatId = item->data(0, USER_ROLE_ONLINE_SUBITEM_ID).toString();
        emit signalPanelConversationItemClicked(url, chatId);
    }
}

void OnlinePanel::initUi()
{
    mLayout = new QVBoxLayout;
    mLayout->setContentsMargins(0, 0, 0, 0);
    mLayout->setSpacing(0);
    this->setLayout(mLayout);

    initTitleUi();

    mOnlineTree = new QTreeWidget(this);
    mOnlineTree->setHeaderHidden(true);
    mOnlineTree->setSelectionMode(QAbstractItemView::MultiSelection);
    mLayout->addWidget(mOnlineTree);
}

void OnlinePanel::initTitleUi()
{
    QWidget *wgt = new QWidget;
    wgt->setObjectName(QStringLiteral("TitleWidget"));
    mLayout->addWidget(wgt);

    QHBoxLayout *hLayout = new QHBoxLayout;
    hLayout->setContentsMargins(0, 0, 0, 0);
    wgt->setLayout(hLayout);

    hLayout->addStretch();
    mTitleLbl = new QLabel(wgt);
    mTitleLbl->setObjectName(QStringLiteral("PanelTitleLabel"));
    hLayout->addWidget(mTitleLbl);
    hLayout->addStretch();
}

void OnlinePanel::initTreeData()
{
    const QVector<OnlineItemInfo> &modelList = OnlineModelConfig::instance().getModelList();
    foreach(const auto &itemInfo, modelList)
    {
        QTreeWidgetItem *item = new QTreeWidgetItem(mOnlineTree);
        item->setData(0, USER_ROLE_IDENTIFIER, "TopLevel");
        item->setData(0, USER_ROLE_ONLINE_NAME, itemInfo.name);
        item->setData(0, USER_ROLE_ONLINE_ICON, itemInfo.icon);
        item->setData(0, USER_ROLE_ONLINE_URL, itemInfo.url);
        item->setData(0, USER_ROLE_ONLINE_SCRIPT, itemInfo.script);
        item->setFlags(item->flags() & ~Qt::ItemIsSelectable);

        OnlineTreeItemWidget *itemWidget = new OnlineTreeItemWidget(itemInfo.name, itemInfo.icon, item, mOnlineTree);
        mOnlineTree->setItemWidget(item, 0, itemWidget);
        mOnlineTree->addTopLevelItem(item);
    }
}

void OnlinePanel::setConnections()
{
    connect(mOnlineTree, &QTreeWidget::itemClicked, this, &OnlinePanel::slotItemClicked);
    connect(this, &OnlinePanel::signalPanelOnlineItemClicked, SidebarSignalBus::instance(), &SidebarSignalBus::signalPanelOnlineItemClicked);
    connect(this, &OnlinePanel::signalPanelConversationItemClicked, SidebarSignalBus::instance(), &SidebarSignalBus::signalPanelConversationItemClicked);
    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalOnlineViewDestroyed, this, &OnlinePanel::slotOnlineViewDestroyed);
    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalOnlineViewRefreshed, this, &OnlinePanel::slotOnlineViewItemRemoved);
    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalAppThemeChanged, this, &OnlinePanel::slotAppThemeChanged);
}

void OnlinePanel::retranslateUi()
{
    mTitleLbl->setText(tr("Online AI website"));
}

bool OnlinePanel::isTopLevelItem(QTreeWidgetItem *item)
{
    for (int i = 0; i < mOnlineTree->topLevelItemCount(); i++)
    {
        QTreeWidgetItem *curItem = mOnlineTree->topLevelItem(i);
        if (curItem == item) {
            return true;
        }
    }
    return false;
}

void OnlinePanel::deleteTopItemChildren(QTreeWidgetItem *item)
{
    for(int i = item->childCount() - 1; i >= 0; i--)
    {
        QTreeWidgetItem *childItem = item->child(i);
        item->removeChild(childItem);
        delete childItem;
    }
}

void OnlinePanel::unselectTreeItemChildren(QTreeWidgetItem *item)
{
    for(int i = 0; i < item->childCount(); i++)
    {
        QTreeWidgetItem *subItem = item->child(i);
        if (subItem) {
            subItem->setSelected(false);
        }
    }
}
