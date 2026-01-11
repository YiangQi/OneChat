#ifndef DOCKSIGNALBUS_H
#define DOCKSIGNALBUS_H

#include <QObject>

class DockSignalBus : public QObject
{
    Q_OBJECT
public:
    static DockSignalBus *instance();
private:
    explicit DockSignalBus(QObject *parent = nullptr);

signals:
    void signalAppThemeChanged(const QString &themeMode);

};

#endif // DOCKSIGNALBUS_H
