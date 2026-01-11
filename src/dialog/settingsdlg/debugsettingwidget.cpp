#include "debugsettingwidget.h"
#include "../../config/settingsconfig.h"
#include <QVBoxLayout>
#include <QCheckBox>
#include <QStyleOption>
#include <QPainter>
#include <QEvent>

DebugSettingWidget::DebugSettingWidget(QWidget *parent)
    : QWidget{parent}
{
    initUi();
    setConnections();
    initData();
    retranslateUi();
}

void DebugSettingWidget::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
}

void DebugSettingWidget::changeEvent(QEvent *event)
{
    if (event->type() == QEvent::LanguageChange)
    {
        retranslateUi();
    }
    QWidget::changeEvent(event);
}

void DebugSettingWidget::slotEnableDevtoolsCBStateChanged(int state)
{
    SettingsConfig::instance().debugModel().isOpenDevTool = state == Qt::Checked;
}

void DebugSettingWidget::initUi()
{
    QVBoxLayout *vLayout = new QVBoxLayout;
    vLayout->setContentsMargins(10, 20, 10, 20);
    vLayout->setSpacing(0);
    this->setLayout(vLayout);

    QWidget *containerWgt = new QWidget(this);
    containerWgt->setObjectName(QStringLiteral("ContainerWgt"));
    vLayout->addWidget(containerWgt);
    vLayout->addStretch();

    QVBoxLayout *mLayout = new QVBoxLayout;
    mLayout->setContentsMargins(10, 10, 10, 10);
    mLayout->addSpacing(10);
    containerWgt->setLayout(mLayout);

    mEnableDevToolsCB = new QCheckBox(this);
    mLayout->addWidget(mEnableDevToolsCB);
}

void DebugSettingWidget::initData()
{
    mEnableDevToolsCB->setChecked(SettingsConfig::instance().debugModel().isOpenDevTool);
}

void DebugSettingWidget::retranslateUi()
{
    mEnableDevToolsCB->setText(tr("Open chrome devtool when the webview loads end"));
}

void DebugSettingWidget::setConnections()
{
    connect(mEnableDevToolsCB, &QCheckBox::stateChanged, this, &DebugSettingWidget::slotEnableDevtoolsCBStateChanged);
}
