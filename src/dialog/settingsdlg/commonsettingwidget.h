#ifndef COMMONSETTINGWIDGET_H
#define COMMONSETTINGWIDGET_H

#include <QWidget>

class QLabel;
class QComboBox;
class CommonSettingWidget : public QWidget
{
    Q_OBJECT
public:
    explicit CommonSettingWidget(QWidget *parent = nullptr);

signals:
protected:
    void paintEvent(QPaintEvent *event) override;
    void changeEvent(QEvent *event) override;

private:
    void initUi();
    void initData();
    void retranslateUi();
    void setConnections();
private slots:
    void slotThemeCbbCurrentIndexChanged(int index);
    void slotLanguageCbbCurrentIndexChanged(int index);
private:
    QLabel          *mThemeLbl = nullptr;
    QComboBox       *mThemeCbb = nullptr;
    QLabel          *mLanguageLbl = nullptr;
    QComboBox       *mLanguageCbb = nullptr;
};

#endif // COMMONSETTINGWIDGET_H
