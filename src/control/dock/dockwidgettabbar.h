#ifndef DOCKWIDGETTABBAR_H
#define DOCKWIDGETTABBAR_H

#include <QTabBar>

class QToolButton;
class DockWidget;
class DockWidgetTabBar : public QTabBar
{
    Q_OBJECT
public:
    explicit DockWidgetTabBar(DockWidget *parentDockWidget,
                     QWidget *parent = nullptr);
protected:
    bool eventFilter(QObject* obj, QEvent* event) override;
    void mousePressEvent(QMouseEvent *event) override;
    void mouseReleaseEvent(QMouseEvent *event) override;
    void mouseMoveEvent(QMouseEvent *event) override;
private:
    void initUi();

    void grabTabImage(QPoint pos);
private:
    QPoint              mStartPos;
    QPoint              mOffsetPos;
    QPixmap             mDragPixmap;

    DockWidget          *parentDockWgt = nullptr;
};

#endif // DOCKWIDGETTABBAR_H
