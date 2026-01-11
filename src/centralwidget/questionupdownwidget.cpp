#include "questionupdownwidget.h"
#include <QVBoxLayout>
#include <QToolButton>
#include <QPainter>
#include <QStyleOption>

QuestionUpDownWidget::QuestionUpDownWidget(QWidget *parent)
    : QWidget{parent}
{
    initUi();
    setConnections();
}

void QuestionUpDownWidget::setUpBtnEnabled(bool isEnable)
{
    mUpBtn->setEnabled(isEnable);
}

void QuestionUpDownWidget::setDownBtnEnabled(bool isEnable)
{
    mDownBtn->setEnabled(isEnable);
}

void QuestionUpDownWidget::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QPainter painter(this);
    painter.save();

    QStyleOption opt;
    opt.initFrom(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &painter, this);
    painter.restore();
}

void QuestionUpDownWidget::initUi()
{
    QVBoxLayout *mLayout = new QVBoxLayout;
    mLayout->setContentsMargins(0, 0, 0, 0);
    mLayout->setSpacing(5);
    this->setLayout(mLayout);

    mUpBtn = new QToolButton(this);
    mUpBtn->setObjectName(QStringLiteral("UpButton"));
    mLayout->addWidget(mUpBtn);

    mDownBtn = new QToolButton(this);
    mDownBtn->setObjectName(QStringLiteral("DownButton"));
    mLayout->addWidget(mDownBtn);
}

void QuestionUpDownWidget::setConnections()
{
    connect(mUpBtn, &QToolButton::clicked, this, &QuestionUpDownWidget::signalUpBtnClicked);
    connect(mDownBtn, &QToolButton::clicked, this, &QuestionUpDownWidget::signalDownBtnClicked);
}
