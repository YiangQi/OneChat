#ifndef DOCKTABBUTTONWIDGET_H
#define DOCKTABBUTTONWIDGET_H

#include <QWidget>

class QToolButton;
class DockTabButtonWidget : public QWidget
{
    Q_OBJECT
public:
    explicit DockTabButtonWidget(bool isShowRefreshBtn,
                                 QWidget *parent = nullptr);
    ~DockTabButtonWidget();

public slots:
    void slotSetRefreshBtnDisabled(bool isDisable);
signals:
    void signalRefreshBtnClicked();
    void signalCloseBtnClicked();
private:
    void initUi();
private:
    bool            isShowRefreshBtn = false;
    QToolButton     *mRefreshBtn = nullptr;
    QToolButton     *mCloseBtn = nullptr;
};

#endif // DOCKTABBUTTONWIDGET_H
