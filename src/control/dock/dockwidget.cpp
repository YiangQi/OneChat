#include "dockwidget.h"
#include "dockwidgettabbar.h"
#include "dockwidgetcornerwidget.h"
#include "dockcontainer.h"
#include "docktabbuttonwidget.h"
#include "../../def.h"
#include <QStyleOption>
#include <QPainter>
#include <QStackedWidget>
#include <QVBoxLayout>
#include <QDockWidget>
#include <QToolButton>
#include <QScrollArea>
#include <QScrollBar>
#include <QWheelEvent>
#include <QEvent>
#include <QDrag>
#include <QMimeData>
#include <QDebug>
#include <QTimer>
#include <QLabel>

DockWidget::DockWidget(DockContainer *dockContainer,
                       QWidget *parent)
    : QWidget{parent}
    , mParentContainer(dockContainer)
{
    initUi();
    setConnections();
    this->setMinimumSize({100, 100});
}

DockWidget::DockWidget(const DockWidgetTabInfo &tabInfo,
                       QWidget *contentWgt,
                       DockContainer *dockContainer,
                       QWidget *parent)
    : DockWidget(dockContainer, parent)
{
    this->addTab(tabInfo, contentWgt);
}

DockWidget::~DockWidget()
{
    qInfo() << "~DockWidget";
}

void DockWidget::addTab(const DockWidgetTabInfo &tabInfo, QWidget *contentWgt)
{
    addTab(tabInfo.tabIcon, tabInfo.tabText, contentWgt, tabInfo.tabRightButton);
}

void DockWidget::addTab(const QString &iconPath,
                        const QString &title,
                        QWidget *contentWgt,
                        QWidget *tabRightButton)
{
    mTabBar->addTab(title);
    mContentStack->addWidget(contentWgt);
    int index = mContentStack->indexOf(contentWgt);
    mTabBar->setCurrentIndex(index);

    QLabel *iconLbl = new QLabel(mTabBar);
    iconLbl->setProperty(DOCK_WIDGET_TAB_ICON_PATH, iconPath);
    iconLbl->setObjectName("IconTabButton");
    iconLbl->setScaledContents(true);
    iconLbl->setPixmap(QPixmap(iconPath));

    mTabBar->setTabButton(index, QTabBar::LeftSide, iconLbl);

    if (tabRightButton != nullptr){
        connect(qobject_cast<DockTabButtonWidget*>(tabRightButton), &DockTabButtonWidget::signalCloseBtnClicked, this, &DockWidget::slotTabBarCloseBtnClicked);
        mTabBar->setTabButton(index, QTabBar::RightSide, tabRightButton);
    }
    updateLayoutBtnStatus();
}

void DockWidget::addDockTabRightButton(int index, DockTabButtonWidget *tabBtnWgt)
{
    tabBtnWgt->setParent(mTabBar);
    connect(tabBtnWgt, &DockTabButtonWidget::signalCloseBtnClicked, this, &DockWidget::slotTabBarCloseBtnClicked);
    mTabBar->setTabButton(index, QTabBar::RightSide, tabBtnWgt);
}

QWidget *DockWidget::dragOutCurrentTab(DockWidgetTabInfo &tabInfo)
{
    int index = mTabBar->currentIndex();
    tabInfo.tabIcon = mTabBar->tabButton(index, QTabBar::LeftSide)->property(DOCK_WIDGET_TAB_ICON_PATH).toString();
    tabInfo.tabText = mTabBar->tabText(index);

    tabInfo.tabRightButton = mTabBar->tabButton(index, QTabBar::RightSide);
    tabInfo.tabRightButton->setParent(nullptr);
    disconnect(qobject_cast<DockTabButtonWidget*>(tabInfo.tabRightButton), &DockTabButtonWidget::signalCloseBtnClicked, this, &DockWidget::slotTabBarCloseBtnClicked);

    mTabBar->setTabButton(index, QTabBar::RightSide, nullptr);
    mTabBar->removeTab(index);

    QWidget *currentWgt = mContentStack->widget(index);
    mContentStack->removeWidget(currentWgt);
    currentWgt->setParent(nullptr);
    updateLayoutBtnStatus();

    return currentWgt;
}

int DockWidget::getContainerDockWidgetCount() const
{
    return mParentContainer->getDockWidgetCount();
}

int DockWidget::getDockTabCount() const
{
    return mTabBar->count();
}

void DockWidget::autoRemoveDockWidget(bool canRemoveParent)
{
    if (mTabBar->count() == 0) {
        emit signalDockWidgetRemoved(canRemoveParent);
    }
}

void DockWidget::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
}

bool DockWidget::eventFilter(QObject *obj, QEvent *event)
{
    if (event->type() == QEvent::Wheel && obj == mTabBarScrollArea->viewport())
    {
        QWheelEvent *wheelEvent = static_cast<QWheelEvent*>(event);
        int delta = wheelEvent->angleDelta().y();
        mTabBarScrollArea->horizontalScrollBar()->setValue(mTabBarScrollArea->horizontalScrollBar()->value() - delta);
        return true;
    }
    return QWidget::eventFilter(obj, event);
}

void DockWidget::initUi()
{
    QVBoxLayout *mLayout = new QVBoxLayout;
    mLayout->setContentsMargins(0, 0, 0, 0);
    mLayout->setSpacing(0);
    this->setLayout(mLayout);

    QHBoxLayout *hLayout = new QHBoxLayout;
    hLayout->setContentsMargins(0, 0, 0, 0);
    hLayout->setSpacing(0);
    mLayout->addLayout(hLayout);

    mTabBarScrollArea = new QScrollArea(this);
    mTabBarScrollArea->setVerticalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    mTabBarScrollArea->setWidgetResizable(true);
    mTabBarScrollArea->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);
    mTabBarScrollArea->viewport()->installEventFilter(this);
    hLayout->addWidget(mTabBarScrollArea);

    QWidget *tabWgt = new QWidget;
    tabWgt->setObjectName(QStringLiteral("TransparentWidgt"));
    mTabBarScrollArea->setWidget(tabWgt);

    QHBoxLayout *tabLayout = new QHBoxLayout;
    tabLayout->setContentsMargins(0, 0, 0, 0);
    tabLayout->setSpacing(0);
    tabWgt->setLayout(tabLayout);

    mTabBar = new DockWidgetTabBar(this);
    tabLayout->addWidget(mTabBar);
    tabLayout->addStretch();

    mTopRightCornerWidget = new DockWidgetCornerWidget(this);
    mTopRightCornerWidget->setSizePolicy(QSizePolicy::Fixed, QSizePolicy::Preferred);
    hLayout->addWidget(mTopRightCornerWidget);

    mContentStack = new QStackedWidget(this);
    mLayout->addWidget(mContentStack);
}

void DockWidget::setConnections()
{
    connect(mTabBar, &DockWidgetTabBar::currentChanged, this, &DockWidget::slotCurrentTabChanged);
    connect(mTabBar, &DockWidgetTabBar::tabMoved, this, &DockWidget::slotTabMoved);

    connect(mTopRightCornerWidget, &DockWidgetCornerWidget::signalDockSplitBtnClicked, this, &DockWidget::slotDockTabSplitted);
    connect(mTopRightCornerWidget, &DockWidgetCornerWidget::signalFloatBtnClicked, this, &DockWidget::slotDockTabFloated);
}

void DockWidget::updateLayoutBtnStatus()
{
    mTopRightCornerWidget->updateLayoutBtnStatus(mTabBar->count() > 1);
}

void DockWidget::closeTab(int index)
{
    if (index < 0) {
        return;
    }
    mTabBar->removeTab(index);
    QWidget *wgt = mContentStack->widget(index);
    mContentStack->removeWidget(wgt);
    wgt->setParent(nullptr);
    wgt->deleteLater();
    updateLayoutBtnStatus();

    autoRemoveDockWidget(true);
}

void DockWidget::slotCurrentTabChanged(int index)
{
    if (index < 0) {
        return;
    }
    mContentStack->setCurrentIndex(index);
}

void DockWidget::slotTabMoved(int from, int to)
{
    QWidget *fromWgt = mContentStack->widget(from);
    mContentStack->removeWidget(fromWgt);
    mContentStack->insertWidget(to, fromWgt);
}

void DockWidget::slotDockTabSplitted(DockDirection direction)
{
    DockWidgetTabInfo tabInfo;
    QWidget *contentWgt = this->dragOutCurrentTab(tabInfo);
    emit signalSplitWidget(tabInfo, contentWgt, direction);
    this->autoRemoveDockWidget(false);
}

void DockWidget::slotDockTabFloated()
{
    DockWidgetTabInfo tabInfo;
    QWidget *contentWgt = this->dragOutCurrentTab(tabInfo);
    emit signalFloatWidget(tabInfo, contentWgt);
    this->autoRemoveDockWidget(false);
}

void DockWidget::slotTabBarCloseBtnClicked()
{
    QWidget *sendWgt = qobject_cast<QWidget*>(sender());
    if (sendWgt == nullptr) {
        return;
    }
    for(int i = 0; i < mTabBar->count(); i++)
    {
        QWidget *wgt = mTabBar->tabButton(i, QTabBar::RightSide);
        if (wgt == sendWgt)
        {
            closeTab(i);
            break;
        }
    }
}


