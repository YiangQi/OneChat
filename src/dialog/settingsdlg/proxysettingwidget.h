#ifndef PROXYSETTINGWIDGET_H
#define PROXYSETTINGWIDGET_H

#include <QWidget>

class QCheckBox;
class QLineEdit;
class QTreeWidget;
class QTreeWidgetItem;
class QLabel;
class ProxySettingWidget : public QWidget
{
    Q_OBJECT
public:
    explicit ProxySettingWidget(QWidget *parent = nullptr);

signals:
    void signalWebViewProxyUsed(const QString &url, bool isUsed);
protected:
    void paintEvent(QPaintEvent *event) override;
    void changeEvent(QEvent *event) override;

private slots:
    void slotEnableProxyCBStateChanged(int state);
    void slotTreeWidgetItemClicked(QTreeWidgetItem *item);
    void slotLineEditEditFinished();
    void slotLineEditTextChanged(const QString &text);
private:
    void initUi();
    void initData();
    void retranslateUi();

    void setConnections();
private:
    QCheckBox               *mEnableProxyCB = nullptr;
    QLabel                  *mProxyLbl = nullptr;
    QLabel                  *mProxyTipLbl = nullptr;
    QLineEdit               *mLineEdit = nullptr;
    QLabel                  *mTreeLbl = nullptr;
    QTreeWidget             *mTreeWgt = nullptr;
    QTreeWidgetItem         *mOnlineTopItem = nullptr;
};

#endif // PROXYSETTINGWIDGET_H
