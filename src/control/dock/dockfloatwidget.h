#ifndef DOCKFLOATWIDGET_H
#define DOCKFLOATWIDGET_H

#include "dockdef.h"
#include <QWidget>

class DockContainer;
class QVBoxLayout;
class DockFloatWidget : public QWidget
{
    Q_OBJECT
public:
    explicit DockFloatWidget(const QString &themeMode);

    void addNewDockWidget(const DockWidgetTabInfo &tabInfo,
                          QWidget *contentWgt);
public slots:
    void slotAppThemeChanged(const QString &themeMode);
signals:
protected:
    void paintEvent(QPaintEvent *event) override;
private:
    void initUi();

private:
    QVBoxLayout     *mLayout = nullptr;
    DockContainer   *mDockContainer = nullptr;
    QString         mThemeMode;
};

#endif // DOCKFLOATWIDGET_H
