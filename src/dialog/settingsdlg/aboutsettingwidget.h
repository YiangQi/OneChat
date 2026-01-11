#ifndef ABOUTSETTINGWIDGET_H
#define ABOUTSETTINGWIDGET_H

#include <QWidget>

class AboutSettingWidget : public QWidget
{
    Q_OBJECT
public:
    explicit AboutSettingWidget(QWidget *parent = nullptr);

protected:
    void paintEvent(QPaintEvent *event) override;
    void changeEvent(QEvent *event) override;
signals:

private:
    void initUi();
    void retranslateUi();
};

#endif // ABOUTSETTINGWIDGET_H
