#include "osplitterhandle.h"
#include <QPainter>
#include <QStyleOption>
#include <QDebug>

OSplitterHandle::OSplitterHandle(Qt::Orientation orientation, QSplitter *parent)
    : QSplitterHandle(orientation, parent)
{
    this->setProperty("orientation", (int)orientation);
    if (orientation == Qt::Horizontal) {
        this->setFixedWidth(4);
    } else {
        this->setFixedHeight(4);
    }
}

void OSplitterHandle::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter painter(this);
    if (opt.state & QStyle::State_MouseOver) {
        painter.fillRect(rect(), palette().highlight());
    } else {
        painter.fillRect(rect(), palette().window());
    }
}
