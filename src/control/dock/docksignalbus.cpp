#include "docksignalbus.h"

DockSignalBus *DockSignalBus::instance()
{
    static DockSignalBus bus;
    return &bus;
}

DockSignalBus::DockSignalBus(QObject *parent)
    : QObject{parent}
{}
