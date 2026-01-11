#ifndef DOCKCONTAINER_H
#define DOCKCONTAINER_H

#include <QWidget>
#include "dockdef.h"

class OSplitter;
class DockWidget;
class QBoxLayout;
class DockWidgetTitleTab;
class DockWidgetContentTab;
class DockContainer : public QWidget
{
    Q_OBJECT
public:
    explicit DockContainer(QWidget *parent = nullptr);
    ~DockContainer();

    DockWidget* createDockWidget(const QString& title,
                                 QWidget* contentWgt,
                                 DockWidget *dstDockWidget,
                                 DockDirection direction);

    DockWidget* createDockWidget(const DockWidgetTabInfo &tabInfo,
                                 QWidget *contentWgt,
                                 DockWidget *dstDockWidget,
                                 DockDirection direction);

    bool isDockEmpty();
    int getDockWidgetCount();
    void updateStatusIfNoDockWidgetIncluded();
    QString getThemeMode() const {return mThemeMode;}
public slots:
    void slotAppThemeChanged(const QString &themeMode);
signals:
    void signalNoDockWidgetIncluded();
protected:
    void paintEvent(QPaintEvent *event) override;
    bool eventFilter(QObject *watched, QEvent *event) override;

    void dragEnterEvent(QDragEnterEvent *event) override;
    void dragMoveEvent(QDragMoveEvent *event) override;
    void dragLeaveEvent(QDragLeaveEvent *event) override;
    void dropEvent(QDropEvent *event) override;
private:
    void initUi();
    void testUi();

    void setDockWidgetConnections(DockWidget *dockWgt);

    void addDockWidget(DockWidget *srcDockWidget,
                       DockWidget *dstDockWidget,
                       DockDirection direction);

    void addDockWidget(DockWidget *srcDockWidget,
                       DockDirection direction);

    void addWidget2Splitter(OSplitter *splitter,
                            QWidget *srcWidget,
                            QWidget *dstWidget,
                            DockDirection direction);

    void createDockFloatWidget(const DockWidgetTabInfo &tabInfo,
                               QWidget *contentWgt);

    void dragDockWidgetTab();
    void dragDockWidgetTab2NewWidget();
    void removeDockWidget(DockWidget *srcDockWidget);

    OSplitter* createSplitter(DockDirection direction,
                              QWidget* parent = nullptr);

    void adjustSplitterSize();
    void adjustSplitterSize(OSplitter *splitter);
    int adjustSplitterSize(OSplitter *splitter, int length);
    void getSameOrientationSplitterCount(OSplitter *splitter, int &count);

    QRect getShadowRectByContainer(double rateX,
                                   double rateY,
                                   double factor);
    QRect getShadowRectByDockWidget(QPoint pos, DockWidget *dragDockWgt);
    QRect getShadowRect(double rateX,
                        double rateY,
                        double factor,
                        double scaleFactor,
                        int top,
                        int left,
                        int width,
                        int height);
private slots:
    void slotRemoveDockWidget(bool canRemoveParent);
    void slotSplitDockWidget(const DockWidgetTabInfo &tabInfo,
                             QWidget *contentWgt,
                             DockDirection direction);
    void slotFloatDockWidget(const DockWidgetTabInfo &tabInfo,
                             QWidget *contentWgt);
private:
    static bool         sIsDragLeaveWindow;
    QBoxLayout          *mMainLayout = nullptr;
    QWidget             *mShadowWgt = nullptr;
    DockWidget          *mDragFromDockWgt = nullptr;
    DockWidget          *mDragToDockWgt = nullptr;
    DockDirection       mDragToDirection;
    QString             mThemeMode;
};

#endif // DOCKCONTAINER_H
