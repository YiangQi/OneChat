#include "loadingwidget.h"
#include <QTimer>
#include <QtMath>
#include <QPainter>
#include <QStyleOption>
#include <QDebug>

LoadingWidget::LoadingWidget(QWidget *parent)
    : QWidget{parent}
{
    mPointColor = QColor(0, 127, 212);

    mTimer = new QTimer(this);
    mTimer->setInterval(mInterval);
    connect(mTimer, &QTimer::timeout, this, &LoadingWidget::slotTimeout);

    mRadianVec.resize(mPointCount);
    for(int i = 0; i < mRadianVec.count(); i++) {
        mRadianVec[i] = 360 + i * 15;
    }
    mPointsVec.resize(mPointCount);
}

void LoadingWidget::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QPainter painter(this);
    painter.save();

    QStyleOption opt;
    opt.initFrom(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &painter, this);

    for (int i = 0; i < mPointCount; ++i)
    {
        QColor brushColor = mPointColor;
        brushColor.setAlpha(255 * (mPointCount - i) / (float)mPointCount);
        painter.setBrush(brushColor);
        painter.setPen(brushColor);

        painter.drawEllipse(mPointsVec[i], mPointRaidus, mPointRaidus);
    }

    painter.restore();
}

void LoadingWidget::resizeEvent(QResizeEvent *event)
{
    calculatePosition();
    QWidget::resizeEvent(event);
}

void LoadingWidget::showEvent(QShowEvent *event)
{
    mTimer->start();
    QWidget::showEvent(event);
}

void LoadingWidget::hideEvent(QHideEvent *event)
{
    QWidget::hideEvent(event);
    mTimer->stop();
}

void LoadingWidget::slotTimeout()
{
    calculatePosition();
    repaint();
}

void LoadingWidget::calculatePosition()
{
    QPoint centerPoint = this->rect().center();
    for (int i = 0; i < mPointCount; i++)
    {
        if (mRadianVec[i] < 270) {
            mRadianVec[i] -= mUnitDegree * 3;
        } else {
            mRadianVec[i] -= mUnitDegree;
        }

        if (mRadianVec[i] < 0) {
            mRadianVec[i] = 360 + mRadianVec[i];
        } else {
            mRadianVec[i] %= 450;
        }
        float radian = qDegreesToRadians(float(mRadianVec[i]));
        mPointsVec[i] = QPointF(centerPoint.x() + mRotateRadius * qCos(radian), centerPoint.y() - mRotateRadius * qSin(radian));
    }
}
