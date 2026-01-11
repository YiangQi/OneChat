#include "dockwidgetcornerwidget.h"
#include "dockwidget.h"
#include "dockcontainer.h"
#include "dockdef.h"
#include <QStyleOption>
#include <QPainter>
#include <QHBoxLayout>
#include <QToolButton>
#include <QMenu>

DockWidgetCornerWidget::DockWidgetCornerWidget(DockWidget *parent)
    : QWidget{parent}
    , mParentDock(parent)
{
    initUi();
}

void DockWidgetCornerWidget::updateLayoutBtnStatus(bool isVisible)
{
    mLayoutBtn->setVisible(isVisible);
}

void DockWidgetCornerWidget::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
}

void DockWidgetCornerWidget::initUi()
{
    QHBoxLayout *mLayout = new QHBoxLayout;
    mLayout->setContentsMargins(0, 0, 0, 0);
    mLayout->addStretch();
    this->setLayout(mLayout);

    mLayout->addSpacing(5);
    mLayoutBtn = new QToolButton(this);
    mLayoutBtn->setObjectName(QStringLiteral("LayoutButton"));
    mLayout->addWidget(mLayoutBtn);

    mFloatBtn = new QToolButton(this);
    mFloatBtn->setObjectName(QStringLiteral("FloatButton"));
    mLayout->addWidget(mFloatBtn);
    mLayout->addSpacing(5);

    connect(mLayoutBtn, &QToolButton::clicked, this, &DockWidgetCornerWidget::slotLayoutBtnClicked);
    connect(mFloatBtn, &QToolButton::clicked, this, &DockWidgetCornerWidget::signalFloatBtnClicked);
}

void DockWidgetCornerWidget::slotLayoutBtnClicked()
{
    QString themeMode = mParentDock->getDockContainer()->getThemeMode();
    QMenu *menu = new QMenu(this);
    connect(menu, &QMenu::triggered, this, &DockWidgetCornerWidget::slotMenuItemClicked);

    QAction *leftAction = new QAction(QIcon(":/img/" + themeMode + "/layout_left"), tr("Split to Left"), menu);
    leftAction->setData((int)DockDirection::Left);
    menu->addAction(leftAction);

    QAction *topAction = new QAction(QIcon(":/img/" + themeMode + "/layout_top"), tr("Split to Top"), menu);
    topAction->setData((int)DockDirection::Top);
    menu->addAction(topAction);

    QAction *rightAction = new QAction(QIcon(":/img/" + themeMode + "/layout_right"), tr("Split to Right"), menu);
    rightAction->setData((int)DockDirection::Right);
    menu->addAction(rightAction);

    QAction *bottomAction = new QAction(QIcon(":/img/" + themeMode + "/layout_bottom"), tr("Split to Bottom"), menu);
    bottomAction->setData((int)DockDirection::Bottom);
    menu->addAction(bottomAction);

    menu->adjustSize();

    QPoint pos = mLayoutBtn->geometry().bottomRight();
    pos.setX(pos.x() - menu->width());

    menu->exec(this->mapToGlobal(pos));
    delete menu;
}

void DockWidgetCornerWidget::slotMenuItemClicked(QAction *action)
{
    DockDirection direction = (DockDirection)action->data().toInt();
    emit signalDockSplitBtnClicked(direction);
}
