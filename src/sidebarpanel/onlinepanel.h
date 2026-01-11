#ifndef ONLINEPANEL_H
#define ONLINEPANEL_H

#include "../def.h"
#include <QWidget>

class QLabel;
class QVBoxLayout;
class QTreeWidget;
class QTreeWidgetItem;
class OnlinePanel : public QWidget
{
    Q_OBJECT
public:
    explicit OnlinePanel(QWidget *parent = nullptr);

signals:
    void signalPanelOnlineItemClicked(const OnlineItemInfo &itemInfo);
    void signalPanelConversationItemClicked(const QString &url,
                                            const QString &chatId);
public slots:
    void slotAppThemeChanged(const QString &themeMode);
    void slotConversationListUpdated(const QString &url,
                                     const QList<WebConversationInfo> &infoList);
    void slotConversationChanged(const QString &url,
                                 const QString &conversationId);
    void slotOnlineViewDestroyed(const MsgSendInfo& msgSendInfo);
    void slotOnlineViewItemRemoved(const QString& url);
protected:
    void changeEvent(QEvent *event) override;
private slots:
    void slotItemClicked(QTreeWidgetItem *item, int column);
private:
    void initUi();
    void initTitleUi();
    void initTreeData();
    void setConnections();
    void retranslateUi();

    bool isTopLevelItem(QTreeWidgetItem *item);
    void deleteTopItemChildren(QTreeWidgetItem *item);
    void unselectTreeItemChildren(QTreeWidgetItem *item);
private:
    QVBoxLayout         *mLayout = nullptr;
    QLabel              *mTitleLbl = nullptr;
    QTreeWidget         *mOnlineTree = nullptr;
};

#endif // ONLINEPANEL_H
