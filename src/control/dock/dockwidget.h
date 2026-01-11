#ifndef DOCKWIDGET_H
#define DOCKWIDGET_H

#include <QTabWidget>
#include <QMap>
#include "dockdef.h"

class DockContainer;
class DockWidgetTabBar;
class DockWidgetCornerWidget;
class DockTabButtonWidget;
class QStackedWidget;
class QScrollArea;
class DockWidget : public QWidget
{
    Q_OBJECT

public:
    explicit DockWidget(DockContainer *dockContainer,
                        QWidget *parent = nullptr);

    DockWidget(const DockWidgetTabInfo &tabInfo,
               QWidget *contentWgt,
               DockContainer *dockContainer,
               QWidget *parent = nullptr);
    ~DockWidget();

    DockWidgetTabBar* getTabBar() {return mTabBar;}

    void addTab(const DockWidgetTabInfo &tabInfo,
                QWidget *contentWgt);
    void addTab(const QString &iconPath,
                const QString &title,
                QWidget *contentWgt,
                QWidget *tabRightButton = nullptr);

    void addDockTabRightButton(int index, DockTabButtonWidget *tabBtnWgt);

    QWidget* dragOutCurrentTab(DockWidgetTabInfo &tabInfo);
    int getContainerDockWidgetCount() const;
    int getDockTabCount() const;
    DockContainer* getDockContainer() const {return mParentContainer;}
    void autoRemoveDockWidget(bool canRemoveParent);
protected:
    void paintEvent(QPaintEvent *event) override;
    bool eventFilter(QObject* obj, QEvent* event) override;
signals:
    void signalDockWidgetRemoved(bool canRemoveParent);
    void signalSplitWidget(const DockWidgetTabInfo &tabInfo,
                           QWidget *contentWgt,
                           DockDirection direction);
    void signalFloatWidget(const DockWidgetTabInfo &tabInfo,
                           QWidget *contentWgt);
private:
    void initUi();
    void setConnections();

    void updateLayoutBtnStatus();

    void closeTab(int index);
private slots:
    void slotCurrentTabChanged(int index);
    void slotTabMoved(int from, int to);
    void slotDockTabSplitted(DockDirection direction);
    void slotDockTabFloated();

    void slotTabBarCloseBtnClicked();
private:
    DockContainer               *mParentContainer = nullptr;
    QScrollArea                 *mTabBarScrollArea = nullptr;
    DockWidgetTabBar            *mTabBar = nullptr;
    DockWidgetCornerWidget      *mTopRightCornerWidget  = nullptr;
    QStackedWidget              *mContentStack = nullptr;
};

#endif // DOCKWIDGET_H
