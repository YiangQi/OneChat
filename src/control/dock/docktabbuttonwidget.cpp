#include "docktabbuttonwidget.h"
#include <QHBoxLayout>
#include <QToolButton>
#include <QDebug>

DockTabButtonWidget::DockTabButtonWidget(bool isShowRefreshBtn,
                                         QWidget *parent)
    : QWidget{parent}
    , isShowRefreshBtn(isShowRefreshBtn)
{
    initUi();
}

DockTabButtonWidget::~DockTabButtonWidget()
{
}

void DockTabButtonWidget::slotSetRefreshBtnDisabled(bool isDisable)
{
    mRefreshBtn->setDisabled(isDisable);
}

void DockTabButtonWidget::initUi()
{
    QHBoxLayout *btnLayout = new QHBoxLayout;
    btnLayout->setContentsMargins(0, 0, 0, 0);
    btnLayout->setSpacing(0);
    this->setLayout(btnLayout);

    if (isShowRefreshBtn)
    {
        mRefreshBtn = new QToolButton(this);
        mRefreshBtn->setObjectName(QStringLiteral("RefrestTabButton"));
        connect(mRefreshBtn, &QToolButton::clicked, this, &DockTabButtonWidget::signalRefreshBtnClicked);
        btnLayout->addWidget(mRefreshBtn);
    }

    mCloseBtn = new QToolButton(this);
    mCloseBtn->setObjectName(QStringLiteral("CloseTabButton"));
    connect(mCloseBtn, &QToolButton::clicked, this, &DockTabButtonWidget::signalCloseBtnClicked);
    btnLayout->addWidget(mCloseBtn);
}
