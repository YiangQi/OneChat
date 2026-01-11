#include "dockdef.h"
#include "dockwidgettabbar.h"
#include <QMouseEvent>
#include <QApplication>
#include <QDrag>
#include <QMimeData>
#include <QDebug>

DockWidgetTabBar::DockWidgetTabBar(DockWidget *parentDockWidget,
                                   QWidget *parent)
    : QTabBar(parent)
    , parentDockWgt(parentDockWidget)
{
    initUi();
    this->installEventFilter(this);
}

bool DockWidgetTabBar::eventFilter(QObject *obj, QEvent *event)
{
    if (event->type() == QEvent::Wheel) {
        event->setAccepted(false);
        return true;
    }
    return QTabBar::eventFilter(obj, event);
}

void DockWidgetTabBar::mousePressEvent(QMouseEvent *event)
{
    if (event->buttons() & Qt::LeftButton)
    {
        mStartPos = event->pos();
        grabTabImage(mStartPos);
    }
    QTabBar::mousePressEvent(event);
}

void DockWidgetTabBar::mouseReleaseEvent(QMouseEvent *event)
{
    QTabBar::mouseReleaseEvent(event);
}

void DockWidgetTabBar::mouseMoveEvent(QMouseEvent *event)
{
    if (!(event->buttons() & Qt::LeftButton)) {
        return;
    }

    if ((event->pos() - mStartPos).manhattanLength() < QApplication::startDragDistance()) {
        return;
    }

    if (event->pos().y() > this->height() || event->pos().y() < 0)
    {
        QMouseEvent mouseEvent(QEvent::MouseButtonRelease, QPoint(0, 40), Qt::LeftButton, Qt::NoButton, Qt::NoModifier);
        QCoreApplication::sendEvent(this, &mouseEvent);

        QDrag *drag = new QDrag(this);
        QMimeData *mimeData = new QMimeData;

        mimeData->setData(drag_mime_data_key, QByteArray::number((qulonglong)parentDockWgt));
        drag->setMimeData(mimeData);

        drag->setPixmap(mDragPixmap);
        drag->setHotSpot(mOffsetPos);
        drag->exec();

        delete drag;
    }

    QTabBar::mouseMoveEvent(event);
}

void DockWidgetTabBar::initUi()
{
    this->setMovable(true);
    this->setExpanding(true);
    this->setDrawBase(false);
    this->setUsesScrollButtons(false);
    this->setIconSize({16,16});
}

void DockWidgetTabBar::grabTabImage(QPoint pos)
{
    int index = tabAt(pos);
    if (index < 0) {
        mDragPixmap = QPixmap();
    }
    QRect rect = tabRect(index);
    mOffsetPos = pos - rect.topLeft();
    mDragPixmap = QPixmap(rect.size());
    mDragPixmap.fill(Qt::transparent);
    this->render(&mDragPixmap, QPoint(), QRegion(rect));
}
