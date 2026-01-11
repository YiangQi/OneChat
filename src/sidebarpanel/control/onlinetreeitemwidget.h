#ifndef ONLINETREEITEMWIDGET_H
#define ONLINETREEITEMWIDGET_H

#include <QWidget>

class QToolButton;
class QLabel;
class QTreeWidgetItem;
class OnlineTreeItemWidget : public QWidget
{
    Q_OBJECT
public:
    explicit OnlineTreeItemWidget(const QString &name,
                                  const QString &iconPath,
                                  QTreeWidgetItem *treeWidgetItem,
                                  QWidget *parent = nullptr);

signals:
protected:
    void paintEvent(QPaintEvent *event) override;
private:
    void initUi();

private:
    QTreeWidgetItem     *mTreeWidgetItem = nullptr;
    QLabel              *mIconLbl = nullptr;
    QLabel              *mNameLbl = nullptr;
    QString             mName;
    QString             mIconPath;
};

#endif // ONLINETREEITEMWIDGET_H
