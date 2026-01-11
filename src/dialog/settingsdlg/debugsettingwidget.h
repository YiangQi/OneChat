#ifndef DEBUGSETTINGWIDGET_H
#define DEBUGSETTINGWIDGET_H

#include <QWidget>

class QCheckBox;
class DebugSettingWidget : public QWidget
{
    Q_OBJECT
public:
    explicit DebugSettingWidget(QWidget *parent = nullptr);

signals:

protected:
    void paintEvent(QPaintEvent *event) override;
    void changeEvent(QEvent *event) override;

private slots:
    void slotEnableDevtoolsCBStateChanged(int state);
private:
    void initUi();
    void initData();
    void retranslateUi();
    void setConnections();
private:
    QCheckBox       *mEnableDevToolsCB = nullptr;
};

#endif // DEBUGSETTINGWIDGET_H
