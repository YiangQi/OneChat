#ifndef DOCKWIDGETCORNERWIDGET_H
#define DOCKWIDGETCORNERWIDGET_H

#include "dockdef.h"
#include <QWidget>

class QToolButton;
class DockWidget;
class DockWidgetCornerWidget : public QWidget
{
    Q_OBJECT
public:
    explicit DockWidgetCornerWidget(DockWidget *parent = nullptr);
    void updateLayoutBtnStatus(bool isVisible);
protected:
    void paintEvent(QPaintEvent *event) override;
signals:
    void signalFloatBtnClicked();
    void signalDockSplitBtnClicked(DockDirection direction);
private:
    void initUi();
private slots:
    void slotLayoutBtnClicked();
    void slotMenuItemClicked(QAction *action);
private:
    DockWidget          *mParentDock = nullptr;
    QToolButton         *mLayoutBtn = nullptr;
    QToolButton         *mFloatBtn = nullptr;
};

#endif // DOCKWIDGETCORNERWIDGET_H
