#ifndef LOADINGWIDGET_H
#define LOADINGWIDGET_H

#include <QWidget>

class LoadingWidget : public QWidget
{
    Q_OBJECT
public:
    explicit LoadingWidget(QWidget *parent = nullptr);

signals:

protected:
    void paintEvent(QPaintEvent *event) override;
    void resizeEvent(QResizeEvent *event) override;
    void showEvent(QShowEvent *event) override;
    void hideEvent(QHideEvent *event) override;
private slots:
    void slotTimeout();
private:
    void calculatePosition();
private:
    QColor              mPointColor;
    int                 mPointCount = 6;
    int                 mPointRaidus = 6;
    int                 mRotateRadius = 50;
    int                 mUnitDegree = 5;
    int                 mInterval = 50;

    QTimer              *mTimer = nullptr;
    QVector<int>        mRadianVec;
    QVector<QPointF>    mPointsVec;
};

#endif // LOADINGWIDGET_H
