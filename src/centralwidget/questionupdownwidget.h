#ifndef QUESTIONUPDOWNWIDGET_H
#define QUESTIONUPDOWNWIDGET_H

#include <QWidget>

class QToolButton;
class QuestionUpDownWidget : public QWidget
{
    Q_OBJECT
public:
    explicit QuestionUpDownWidget(QWidget *parent = nullptr);
    void setUpBtnEnabled(bool isEnable);
    void setDownBtnEnabled(bool isEnable);
signals:
    void signalUpBtnClicked();
    void signalDownBtnClicked();
protected:
    void paintEvent(QPaintEvent *event) override;
private:
    void initUi();
    void setConnections();
private:
    QToolButton         *mUpBtn = nullptr;
    QToolButton         *mDownBtn = nullptr;
};

#endif // QUESTIONUPDOWNWIDGET_H
