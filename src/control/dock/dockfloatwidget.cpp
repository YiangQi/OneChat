#include "dockfloatwidget.h"
#include "dockcontainer.h"
#include "dockwidget.h"
#include <QVBoxLayout>
#include <QStyleOption>
#include <QPainter>
#if defined(Q_OS_WIN)
#include <Windows.h>
#include <dwmapi.h>
#endif

DockFloatWidget::DockFloatWidget(const QString &themeMode)
    : QWidget{nullptr}
    , mThemeMode(themeMode)
{
    initUi();
    this->setAttribute(Qt::WA_DeleteOnClose, true);
    slotAppThemeChanged(themeMode);
}

void DockFloatWidget::addNewDockWidget(const DockWidgetTabInfo &tabInfo, QWidget *contentWgt)
{
    auto w = mDockContainer->createDockWidget(tabInfo, contentWgt, nullptr, DockDirection::Center);
    w->show();
}

void DockFloatWidget::slotAppThemeChanged(const QString &themeMode)
{
    mThemeMode = themeMode;
#if defined(Q_OS_WIN)
    BOOL dark = themeMode == "dark" ? TRUE : FALSE;
    DwmSetWindowAttribute((HWND)winId(), DWMWA_USE_IMMERSIVE_DARK_MODE, &dark, sizeof(dark));
#endif
}

void DockFloatWidget::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
}

void DockFloatWidget::initUi()
{
    mLayout = new QVBoxLayout;
    mLayout->setContentsMargins(0, 0, 0, 0);
    mLayout->setSpacing(0);
    this->setLayout(mLayout);

    mDockContainer = new DockContainer(this);
    mDockContainer->slotAppThemeChanged(mThemeMode);
    mLayout->addWidget(mDockContainer);

    connect(mDockContainer, &DockContainer::signalNoDockWidgetIncluded, this, &DockFloatWidget::close);
}
