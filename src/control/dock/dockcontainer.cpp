#include "../../def.h"
#include "dockcontainer.h"
#include "dockwidget.h"
#include "dockfloatwidget.h"
#include "../osplitter.h"
#include "docksignalbus.h"
#include <QStyleOption>
#include <QPainter>
#include <QBoxLayout>
#include <QLabel>
#include <QDebug>
#include <QDragEnterEvent>
#include <QDragLeaveEvent>
#include <QCoreApplication>
#include <QEvent>
#include <QFile>
#include <QMimeData>
#include <QDrag>
#include <QTimer>

#ifdef _DEBUG
namespace {

void printWidgetTree(QWidget* widget, int depth = 0)
{
    if (!widget) return;
    if (depth > 3) return;
    QString indent(depth * 2, ' ');

    qDebug().noquote()
        << indent << QString::number(depth)
        << "└─" << widget->metaObject()->className()
        << "[" << widget->objectName() << "]"
        << "Geometry:" << widget->geometry()
        << "Visible:" << widget->isVisible();

    for (auto* child : widget->children())
    {
        QWidget* childWidget = qobject_cast<QWidget*>(child);
        if (childWidget) {
            printWidgetTree(childWidget, depth + 1);
        }
    }
}
}
#endif

bool DockContainer::sIsDragLeaveWindow = false;

DockContainer::DockContainer(QWidget *parent)
    : QWidget{parent}
{
    initUi();
    setAcceptDrops(true);
    connect(DockSignalBus::instance(), &DockSignalBus::signalAppThemeChanged, this, &DockContainer::slotAppThemeChanged);
#ifdef ADD_TEST_WIDGET_IN_DOCK
    testUi();
#endif

    qApp->installEventFilter(this);
}

DockContainer::~DockContainer()
{
    qInfo() << "widget count: " << this->findChildren<QWidget*>().count();
}

DockWidget* DockContainer::createDockWidget(const QString &title,
                                            QWidget *contentWgt,
                                            DockWidget *dstDockWidget,
                                            DockDirection direction)
{
    DockWidget *dockWgt = new DockWidget(title, contentWgt, this);
    setDockWidgetConnections(dockWgt);
    addDockWidget(dockWgt, dstDockWidget, direction);
    return dockWgt;
}

DockWidget *DockContainer::createDockWidget(const DockWidgetTabInfo &tabInfo,
                                            QWidget *contentWgt,
                                            DockWidget *dstDockWidget,
                                            DockDirection direction)
{
    DockWidget *dockWgt = new DockWidget(tabInfo, contentWgt, this);
    setDockWidgetConnections(dockWgt);
    addDockWidget(dockWgt, dstDockWidget, direction);
    return dockWgt;
}

bool DockContainer::isDockEmpty()
{
    return mMainLayout->count() == 0;
}

int DockContainer::getDockWidgetCount()
{
    return this->findChildren<DockWidget*>().count();
}

void DockContainer::updateStatusIfNoDockWidgetIncluded()
{
    if (mMainLayout->count() == 0) {
        emit signalNoDockWidgetIncluded();
    }
}

void DockContainer::slotAppThemeChanged(const QString &themeMode)
{
    mThemeMode = themeMode;
    QFile file(":/qss/" + themeMode + "/dockcontainer.qss");
    if (file.open(QFile::ReadOnly))
    {
        QString qss = QLatin1String(file.readAll());
        this->setStyleSheet(qss);
        file.close();
    }
}

void DockContainer::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);

}

bool DockContainer::eventFilter(QObject *watched, QEvent *event)
{
    if (event->type() == QEvent::MouseButtonRelease)
    {
        if (sIsDragLeaveWindow)
        {
            dragDockWidgetTab2NewWidget();
            sIsDragLeaveWindow = false;
        }
    }
    return QWidget::eventFilter(watched, event);
}

void DockContainer::dragEnterEvent(QDragEnterEvent *event)
{
    if (event->mimeData()->hasFormat(drag_mime_data_key)) {
        event->acceptProposedAction();
    }
    mDragFromDockWgt = reinterpret_cast<DockWidget*>(event->mimeData()->data(drag_mime_data_key).toULongLong());
    mDragToDockWgt = nullptr;
    sIsDragLeaveWindow = false;
    mDragToDirection = DockDirection::None;
    mShadowWgt->setVisible(true);
    mShadowWgt->raise();
}

void DockContainer::dragMoveEvent(QDragMoveEvent *event)
{
    if (!event->mimeData()->hasFormat(drag_mime_data_key))
    {
        return;
    }
#if QT_VERSION >= QT_VERSION_CHECK(6, 0, 0)
    QPoint pos = event->position().toPoint();
#else
    QPoint pos = event->pos();
#endif
    int x = pos.x();
    int y = pos.y();

    double rateX = (double)x / this->width();
    double rateY = (double)y / this->height();
    double factor = 1.f / 8.f;
    QRect rc;
    if (rateX < factor || rateY < factor || rateX > (1 - factor) || rateY > (1 - factor))
    {
        rc = getShadowRectByContainer(rateX, rateY, factor);
    }
    else
    {
        DockWidget *fromWgt = reinterpret_cast<DockWidget*>(event->mimeData()->data(drag_mime_data_key).toULongLong());
        rc = getShadowRectByDockWidget(pos, fromWgt);
    }
    mShadowWgt->setGeometry(rc);
}

void DockContainer::dragLeaveEvent(QDragLeaveEvent *event)
{
    Q_UNUSED(event);
    sIsDragLeaveWindow = true;
    mShadowWgt->setVisible(false);
}

void DockContainer::dropEvent(QDropEvent *event)
{
    if (event->mimeData()->hasFormat(drag_mime_data_key))
    {
        dragDockWidgetTab();
    }
    mShadowWgt->setVisible(false);
}

void DockContainer::initUi()
{
    mMainLayout = new QBoxLayout(QBoxLayout::LeftToRight);
    mMainLayout->setContentsMargins(0, 0, 0, 0);
    this->setLayout(mMainLayout);

    mShadowWgt = new QWidget(this);
    mShadowWgt->setObjectName(QStringLiteral("ShadowWidget"));
    mShadowWgt->setVisible(false);
    mShadowWgt->raise();
}


void DockContainer::testUi()
{
    QLabel *lbl1 = new QLabel("label 1");
    createDockWidget("label1", lbl1, nullptr, DockDirection::Right);

    QLabel *lbl2 = new QLabel("label 2");
    DockWidget* w2 = createDockWidget("label2", lbl2, nullptr, DockDirection::Top);

    QLabel *lbl4 = new QLabel("label 4");
    createDockWidget("label4", lbl4, nullptr, DockDirection::Left);

    // DockWidget *w4 = new DockWidget;
    // w4->setMinimumWidth(100);
    // w4->setStyleSheet("QWidget{background-color:red;}");
    // addDockWidget(w4, w3, DockDirection::Top);
}

void DockContainer::setDockWidgetConnections(DockWidget *dockWgt)
{
    connect(dockWgt, &DockWidget::signalSplitWidget, this, &DockContainer::slotSplitDockWidget);
    connect(dockWgt, &DockWidget::signalFloatWidget, this, &DockContainer::slotFloatDockWidget);
}

void DockContainer::addDockWidget(DockWidget *srcDockWidget,
                                  DockWidget *dstDockWidget,
                                  DockDirection direction)
{
    if (dstDockWidget == nullptr)
    {
        addDockWidget(srcDockWidget, direction);
    }
    else
    {
        OSplitter *splitter = qobject_cast<OSplitter*>(dstDockWidget->parentWidget());
        qInfo() << splitter;
        if (splitter)
        {
            OSplitter *subSplitter = createSplitter(direction, nullptr);

            int index = splitter->indexOf(dstDockWidget);
            splitter->replaceWidget(index, subSplitter);

            addWidget2Splitter(subSplitter, srcDockWidget, dstDockWidget, direction);
        }
        else if (this == dstDockWidget->parentWidget())
        {
            addDockWidget(srcDockWidget, direction);
        }

    }
    connect(srcDockWidget, &DockWidget::signalDockWidgetRemoved, this, &DockContainer::slotRemoveDockWidget);
}

void DockContainer::addDockWidget(DockWidget *srcDockWidget,
                                  DockDirection direction)
{
    if (mMainLayout->count() == 0)
    {
        mMainLayout->addWidget(srcDockWidget);
        return;
    }

    if (mMainLayout->count() > 1)
    {
        qFatal("The count of docker container's widget is error!");
    }
    QLayoutItem *layoutItem = mMainLayout->takeAt(0);
    QWidget *oldWgt = layoutItem->widget();
    delete layoutItem;

    OSplitter *splitter = createSplitter(direction, this);
    mMainLayout->addWidget(splitter);
    addWidget2Splitter(splitter, srcDockWidget, oldWgt, direction);
}

void DockContainer::addWidget2Splitter(OSplitter *splitter,
                                       QWidget *srcWidget,
                                       QWidget *dstWidget,
                                       DockDirection direction)
{
    switch (direction) {
    case DockDirection::Top:
    case DockDirection::Left:
        splitter->addWidget(srcWidget);
        splitter->addWidget(dstWidget);
        break;
    case DockDirection::Bottom:
    case DockDirection::Right:
        splitter->addWidget(dstWidget);
        splitter->addWidget(srcWidget);
        break;
    default:
        break;
    }
    QTimer::singleShot(0, [this]{
        adjustSplitterSize();
    });

}

void DockContainer::createDockFloatWidget(const DockWidgetTabInfo &tabInfo,
                                          QWidget *contentWgt)
{
    DockFloatWidget *floatWindow = new DockFloatWidget(mThemeMode);
    floatWindow->addNewDockWidget(tabInfo, contentWgt);
    floatWindow->resize(this->size());
    floatWindow->show();
}

void DockContainer::dragDockWidgetTab()
{
    if (mDragFromDockWgt == nullptr ||
        (mDragFromDockWgt == mDragToDockWgt && mDragToDockWgt->getDockTabCount() == 1) ||
        // (mDragFromDockWgt->getContainerDockWidgetCount() == 1 && mDragFromDockWgt->getDockContainer() == this) ||
        mDragToDirection == DockDirection::None) {
        return;
    }

    DockWidgetTabInfo tabInfo;
    DockContainer *dragFromParent = mDragFromDockWgt->getDockContainer();
    QWidget *contentWgt = mDragFromDockWgt->dragOutCurrentTab(tabInfo);

    if (mDragToDirection == DockDirection::Center)
    {
        if (mDragToDockWgt != nullptr)
        {
            mDragToDockWgt->addTab(tabInfo, contentWgt);
        }
    }
    else
    {
        createDockWidget(tabInfo, contentWgt, mDragToDockWgt, mDragToDirection);
    }
    mDragFromDockWgt->autoRemoveDockWidget(false);
    dragFromParent->updateStatusIfNoDockWidgetIncluded();
}

void DockContainer::dragDockWidgetTab2NewWidget()
{
    if (mDragFromDockWgt == nullptr) {
        return;
    }
    DockWidgetTabInfo tabInfo;
    QWidget *contentWgt = mDragFromDockWgt->dragOutCurrentTab(tabInfo);

    createDockFloatWidget(tabInfo, contentWgt);
    mDragFromDockWgt->autoRemoveDockWidget(false);
    updateStatusIfNoDockWidgetIncluded();
}

void DockContainer::removeDockWidget(DockWidget *srcDockWidget)
{
    OSplitter *splitter = qobject_cast<OSplitter*>(srcDockWidget->parentWidget());
    if (splitter)
    {
        srcDockWidget->setParent(nullptr);
        srcDockWidget->deleteLater();

        QList<QWidget*> subWidgetList = splitter->findChildren<QWidget*>("", Qt::FindDirectChildrenOnly);
        if (subWidgetList.count() == 0)
        {
            splitter->setParent(nullptr);
            splitter->deleteLater();
        }
        else if (subWidgetList.count() == 1)
        {
            OSplitter *parentSplitter = qobject_cast<OSplitter*>(splitter->parentWidget());
            if (parentSplitter != nullptr)
            {
                subWidgetList[0]->setParent(nullptr);
                int index = parentSplitter->indexOf(splitter);
                parentSplitter->replaceWidget(index, subWidgetList[0]);
                subWidgetList[0]->setVisible(true);
                splitter->setParent(nullptr);
                splitter->deleteLater();
            }
            else if (this == splitter->parentWidget())
            {
                subWidgetList[0]->setParent(nullptr);
                mMainLayout->removeWidget(splitter);
                splitter->setParent(nullptr);
                splitter->deleteLater();

                if (mMainLayout->count() == 0) {
                    mMainLayout->addWidget(subWidgetList[0]);
                    subWidgetList[0]->setVisible(true);
                } else {
                    qFatal("Main layout count error!");
                }
            }
            else
            {
                qFatal("Splitter status error!");
            }
        }
        else
        {
            qFatal("Splitter count error!");
        }
    }
    else if (this == srcDockWidget->parentWidget())
    {
        mMainLayout->removeWidget(srcDockWidget);
        srcDockWidget->setParent(nullptr);
        srcDockWidget->deleteLater();
    }

    QTimer::singleShot(0, [this]{
        adjustSplitterSize();
    });
    qInfo() << "widget count: " << this->findChildren<QWidget*>().count();
    qInfo() << "splitter count: " << this->findChildren<OSplitter*>().count();
}

OSplitter *DockContainer::createSplitter(DockDirection direction,
                                         QWidget *parent)
{
    Qt::Orientation orientation = direction == DockDirection::Top || direction == DockDirection::Bottom ? Qt::Orientation::Vertical : Qt::Orientation::Horizontal;
    OSplitter *splitter = new OSplitter(orientation, parent);
    splitter->setChildrenCollapsible(false);
    splitter->setOpaqueResize(false);
    splitter->setProperty(SPLITTER_ADDRESSS, QString::number((quint64)splitter));
    return splitter;
}

void DockContainer::adjustSplitterSize()
{
    if (!mMainLayout || mMainLayout->count() == 0) {
        return;
    }
    if (mMainLayout->count() > 1) {
        qFatal("The count of docker container's widget is error!");
        return;
    }
    QLayoutItem *layoutItem = mMainLayout->itemAt(0);
    OSplitter *splitter = qobject_cast<OSplitter*>(layoutItem->widget());
    if (splitter == nullptr) {
        return;
    }
    adjustSplitterSize(splitter);
}

void DockContainer::adjustSplitterSize(OSplitter *splitter)
{
    splitter->adjustSize();
    int count = 1;
    getSameOrientationSplitterCount(splitter, count);
    if (splitter->orientation() == Qt::Horizontal) {
        adjustSplitterSize(splitter, splitter->width() / (count + 1));
    } else {
        adjustSplitterSize(splitter, splitter->height() / (count + 1));
    }
    for(int i = 0; i < splitter->count(); i++)
    {
        OSplitter *subSplitter = qobject_cast<OSplitter*>(splitter->widget(i));
        if (subSplitter != nullptr /*&& subSplitter->orientation() != splitter->orientation()*/) {
            adjustSplitterSize(subSplitter);
        }
    }
}

int DockContainer::adjustSplitterSize(OSplitter *splitter, int length)
{
    if (splitter->count() != 2) {
        qFatal("The count of splitter widget is error!");
    }
    OSplitter *splitter0 = qobject_cast<OSplitter*>(splitter->widget(0));
    int size0 = length;
    if (splitter0 != nullptr && splitter0->orientation() == splitter->orientation())
    {
        size0 = adjustSplitterSize(splitter0, length);
    }
    int size1 = length;
    OSplitter *splitter1 = qobject_cast<OSplitter*>(splitter->widget(1));
    if (splitter1 != nullptr && splitter1->orientation() == splitter->orientation())
    {
        size1 = adjustSplitterSize(splitter1, length);
    }
    splitter->setSizes({size0, size1});
    return size0 + size1;
}

void DockContainer::getSameOrientationSplitterCount(OSplitter *splitter, int &count)
{
    if (splitter->count() != 2) {
        qFatal("The count of splitter widget is error!");
    }
    OSplitter *splitter0 = qobject_cast<OSplitter*>(splitter->widget(0));
    if (splitter0 != nullptr && splitter0->orientation() == splitter->orientation())
    {
        count++;
        getSameOrientationSplitterCount(splitter0, count);
    }
    OSplitter *splitter1 = qobject_cast<OSplitter*>(splitter->widget(1));
    if (splitter1 != nullptr && splitter1->orientation() == splitter->orientation())
    {
        count++;
        getSameOrientationSplitterCount(splitter1, count);
    }
}

QRect DockContainer::getShadowRectByContainer(double rateX, double rateY, double factor)
{
    int width = this->width();
    int height = this->height();
    double scaleFactor = factor * 2;
    mDragToDockWgt = nullptr;
    if (mDragFromDockWgt->getContainerDockWidgetCount() == 1 && mDragFromDockWgt->getDockContainer() == this) {
        return QRect(0, 0, 0, 0);
    }
    return getShadowRect(rateX,
                         rateY,
                         factor,
                         scaleFactor,
                         0,
                         0,
                         width,
                         height);
}

QRect DockContainer::getShadowRectByDockWidget(QPoint pos, DockWidget *dragFromDockWgt)
{
    QList<DockWidget*> dockList = this->findChildren<DockWidget*>();
    QRect rc;
    foreach(DockWidget *dockWgt, dockList)
    {
        QRect childRC = dockWgt->geometry();
        QPoint topLeft = dockWgt->parentWidget()->mapToGlobal(childRC.topLeft());
        topLeft = this->mapFromGlobal(topLeft);
        childRC.moveTopLeft(topLeft);
        if (childRC.contains(pos))
        {
            rc = childRC;
            mDragToDockWgt = dockWgt;
            break;
        }
    }
    if (dragFromDockWgt == mDragToDockWgt && mDragToDockWgt->getDockTabCount() == 1) {
        rc.setRect(0,0,0,0);
        return rc;
    }
    int width = rc.width();
    int height = rc.height();
    double rateX = (double)(pos.x() - rc.left()) / width;
    double rateY = (double)(pos.y() - rc.top()) / height;
    double factor = 1.f / 3.f;
    double scaleFactor = 0.5;
    return getShadowRect(rateX,
                         rateY,
                         factor,
                         scaleFactor,
                         rc.top(),
                         rc.left(),
                         width,
                         height);
}

QRect DockContainer::getShadowRect(double rateX,
                                   double rateY,
                                   double factor,
                                   double scaleFactor,
                                   int top,
                                   int left,
                                   int width,
                                   int height)
{
    QRect rc;
    if (rateX < factor && rateY < factor)
    {
        // top & left
        if (rateX < rateY)
        {
            rc.setRect(left, top, width * scaleFactor, height);
            mDragToDirection = DockDirection::Left;
        }
        else
        {
            rc.setRect(left, top, width, height * scaleFactor);
            mDragToDirection = DockDirection::Top;
        }
    }
    else if (rateX < factor && rateY > (1 - factor))
    {
        // left & bottom
        if (rateX < (1 - rateY))
        {
            rc.setRect(left, top, width * scaleFactor, height);
            mDragToDirection = DockDirection::Left;
        }
        else
        {
            rc.setRect(left, top + height * (1 - scaleFactor), width, height * scaleFactor);
            mDragToDirection = DockDirection::Bottom;
        }
    }
    else if (rateX > (1 - factor) && rateY < factor)
    {
        // top & right
        if ((1 - rateX) < rateY)
        {
            rc.setRect(left + width * (1 - scaleFactor), top, width * scaleFactor, height);
            mDragToDirection = DockDirection::Right;
        }
        else
        {
            rc.setRect(left, top, width, height * scaleFactor);
            mDragToDirection = DockDirection::Top;
        }
    }
    else if (rateX > (1 - factor) && rateY > (1 - factor))
    {
        // bottom & right
        if (rateX > rateY)
        {
            rc.setRect(left + width * (1 - scaleFactor), top, width * scaleFactor, height);
            mDragToDirection = DockDirection::Right;
        }
        else
        {
            rc.setRect(left, top + height * (1 - scaleFactor), width, height * scaleFactor);
            mDragToDirection = DockDirection::Bottom;
        }
    }
    else if (rateX < factor)
    {
        rc.setRect(left, top, width * scaleFactor, height);
        mDragToDirection = DockDirection::Left;
    }
    else if (rateY < factor)
    {
        rc.setRect(left, top, width, height * scaleFactor);
        mDragToDirection = DockDirection::Top;
    }
    else if (rateX > (1 - factor))
    {
        rc.setRect(left + width * (1 - scaleFactor), top, width * scaleFactor, height);
        mDragToDirection = DockDirection::Right;
    }
    else if (rateY > (1 - factor))
    {
        rc.setRect(left, top + height * (1 - scaleFactor), width, height * scaleFactor);
        mDragToDirection = DockDirection::Bottom;
    }
    else
    {
        rc.setRect(left, top, width, height);
        mDragToDirection = DockDirection::Center;
    }
    return rc;
}

void DockContainer::slotRemoveDockWidget(bool canRemoveParent)
{
    DockWidget *wgt = qobject_cast<DockWidget*>(sender());
    if (wgt == nullptr) {
        return;
    }
    removeDockWidget(wgt);
    if (canRemoveParent)
    {
        updateStatusIfNoDockWidgetIncluded();
    }
}

void DockContainer::slotSplitDockWidget(const DockWidgetTabInfo &tabInfo,
                                        QWidget *contentWgt,
                                        DockDirection direction)
{
    DockWidget *dstDockWgt = qobject_cast<DockWidget*>(sender());
    if (dstDockWgt != nullptr)
    {
        createDockWidget(tabInfo, contentWgt, dstDockWgt, direction);
    }
}

void DockContainer::slotFloatDockWidget(const DockWidgetTabInfo &tabInfo,
                                        QWidget *contentWgt)
{
    createDockFloatWidget(tabInfo, contentWgt);
    updateStatusIfNoDockWidgetIncluded();
}
