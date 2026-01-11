#include "osplitter.h"
#include "osplitterhandle.h"

OSplitter::OSplitter(QWidget *parent)
    : QSplitter(parent)
{
    this->setHandleWidth(4);
}

OSplitter::OSplitter(Qt::Orientation orientation, QWidget *parent)
    : QSplitter(orientation, parent)
{
    this->setHandleWidth(4);
}

QSplitterHandle *OSplitter::createHandle()
{
    return new OSplitterHandle(orientation(), this);
}
