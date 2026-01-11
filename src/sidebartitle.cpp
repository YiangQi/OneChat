#include "sidebartitle.h"
#include "signalbus/sidebarsignalbus.h"
#include "signalbus/settingsignalbus.h"
#include "dialog/settingsdlg/settingsdlg.h"
#include <QStyleOption>
#include <QHBoxLayout>
#include <QToolButton>
#include <QFile>
#include <QPainter>

SidebarTitle::SidebarTitle(QWidget *parent)
    : QWidget{parent}
{
    initUi();
    setConnections();

    mOnlineBtn->click();
}

void SidebarTitle::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
}

void SidebarTitle::slotAppThemeChanged(const QString &themeMode)
{
    mThemeMode = themeMode;
    QFile file(":/qss/" + themeMode + "/sidebartitle.qss");
    if (file.open(QFile::ReadOnly))
    {
        QString qss = QLatin1String(file.readAll());
        this->setStyleSheet(qss);
        file.close();
    }
}

void SidebarTitle::slotSidebarBtnClicked(bool checked)
{
    QToolButton *senderBtn = qobject_cast<QToolButton*>(sender());
    ESidebarButtonType btnType = ESidebarButtonType::End;
    if (senderBtn == mOnlineBtn) {
        btnType = ESidebarButtonType::Online;
    }
    if (btnType != ESidebarButtonType::End) {
        emit signalSidebarBtnClicked(btnType, checked);
    }
}

void SidebarTitle::slotSidebarPanelShown(ESidebarButtonType btnType, bool isVisible)
{
    switch (btnType) {
    case ESidebarButtonType::Online:
        if (mOnlineBtn->isChecked() != isVisible) {
            mOnlineBtn->setChecked(isVisible);
        }
        break;
    default:
        break;
    }
}

void SidebarTitle::slotSettingBtnClicked()
{
    emit signalSettingBtnClicked(ESettingDialogTabType::Common);
}

void SidebarTitle::initUi()
{
    mLayout = new QVBoxLayout;
    mLayout->setContentsMargins(0, 0, 0, 0);
    mLayout->setSpacing(0);
    this->setLayout(mLayout);

    initTopUi();
    mLayout->addStretch();
    initBottomUi();
}

void SidebarTitle::initTopUi()
{
    mOnlineBtn = new QToolButton(this);
    mOnlineBtn->setCheckable(true);
    mOnlineBtn->setObjectName(QStringLiteral("OnlineBtn"));
    mLayout->addWidget(mOnlineBtn);
}

void SidebarTitle::initBottomUi()
{
    mSettingBtn = new QToolButton(this);
    mSettingBtn->setObjectName(QStringLiteral("SettingBtn"));
    mLayout->addWidget(mSettingBtn);
}

void SidebarTitle::setConnections()
{
    connect(mOnlineBtn, &QToolButton::clicked, this, &SidebarTitle::slotSidebarBtnClicked);
    connect(this, &SidebarTitle::signalSidebarBtnClicked, SidebarSignalBus::instance(), &SidebarSignalBus::signalSidebarBtnClicked);
    connect(this, &SidebarTitle::signalSettingBtnClicked, SettingSignalBus::instance(), &SettingSignalBus::signalSettingBtnClicked);

    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalSidebarPanelShown, this, &SidebarTitle::slotSidebarPanelShown);
    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalAppThemeChanged, this, &SidebarTitle::slotAppThemeChanged);
    connect(mSettingBtn, &QToolButton::clicked, this, &SidebarTitle::slotSettingBtnClicked);
}
