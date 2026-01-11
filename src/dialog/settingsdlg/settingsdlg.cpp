#include "settingsdlg.h"
#include "../../def.h"
#include "commonsettingwidget.h"
#include "proxysettingwidget.h"
#include "debugsettingwidget.h"
#include "aboutsettingwidget.h"
#include <QFile>
#include <QStyleOption>
#include <QPainter>
#include <QToolButton>
#include <QHBoxLayout>
#include <QStackedWidget>
#include <QEvent>
#if defined(Q_OS_WIN)
#include <Windows.h>
#include <dwmapi.h>
#endif

SettingsDlg::SettingsDlg(ESettingDialogTabType tabType,
                         const QVariant &info,
                         QWidget *parent)
    : QDialog(parent)
    , mDefaultTabType(tabType)
    , mDefaultInfo(info)
{
    setWindowFlags(windowFlags() & ~Qt::WindowContextHelpButtonHint);
    setWindowTitle(tr("OneChat Settings"));
    resize({650, 500});
    this->setMinimumWidth(500);

    initUi();
    setConnections();
    initData();
    retranslateUi();
}

void SettingsDlg::slotAppThemeChanged(const QString &themeMode)
{
    QFile file(":/qss/" + themeMode + "/settingsdlg.qss");
    if (file.open(QFile::ReadOnly))
    {
        QString qss = QLatin1String(file.readAll());
        this->setStyleSheet(qss);
        file.close();
    }
#if defined(Q_OS_WIN)
    BOOL dark = themeMode == APP_THEME_DARK_KEY ? TRUE : FALSE;
    DwmSetWindowAttribute((HWND)winId(), DWMWA_USE_IMMERSIVE_DARK_MODE, &dark, sizeof(dark));
    // fix bug that the background color of title can not change until the size is changed.
    this->resize({this->width(), this->height() - 1});
    this->resize({this->width(), this->height() + 1});
#endif
}

void SettingsDlg::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
}

void SettingsDlg::changeEvent(QEvent *event)
{
    if (event->type() == QEvent::LanguageChange)
    {
        retranslateUi();
    }
    QDialog::changeEvent(event);
}

void SettingsDlg::slotSidebarBtnClicked()
{
    mCommonSettingBtn->setChecked(false);
    mProxySettingBtn->setChecked(false);
    mDebugSettingBtn->setChecked(false);
    mAboutSettingBtn->setChecked(false);

    QObject *sendObj = sender();
    if (sendObj == mCommonSettingBtn)
    {
        mContentStack->setCurrentWidget(mCommonSettingWgt);
        mCommonSettingBtn->setChecked(true);
    }
    else if (sendObj == mProxySettingBtn)
    {
        mContentStack->setCurrentWidget(mProxySettingWgt);
        mProxySettingBtn->setChecked(true);
    }
    else if (sendObj == mDebugSettingBtn)
    {
        mContentStack->setCurrentWidget(mDebugSettingWgt);
        mDebugSettingBtn->setChecked(true);
    }
    else if (sendObj == mAboutSettingBtn)
    {
        mContentStack->setCurrentWidget(mAboutSettingWgt);
        mAboutSettingBtn->setChecked(true);
    }
}

void SettingsDlg::initUi()
{
    mLayout = new QHBoxLayout;
    mLayout->setContentsMargins(0, 0, 0, 0);
    mLayout->setSpacing(0);
    setLayout(mLayout);

    mSidebarWgt = new QWidget(this);
    mSidebarWgt->setObjectName(QStringLiteral("SidebarWgt"));
    mLayout->addWidget(mSidebarWgt);
    initSidebarUi();

    mContentStack = new QStackedWidget(this);
    mLayout->addWidget(mContentStack);
    initContentUi();
}

void SettingsDlg::initSidebarUi()
{
    QVBoxLayout *vLayout = new QVBoxLayout;
    vLayout->setContentsMargins(10, 20, 10, 20);
    vLayout->setSpacing(5);
    mSidebarWgt->setLayout(vLayout);

    mCommonSettingBtn = new QToolButton(mSidebarWgt);
    mCommonSettingBtn->setObjectName(QStringLiteral("SidebarButton"));
    mCommonSettingBtn->setCheckable(true);
    vLayout->addWidget(mCommonSettingBtn);

    mProxySettingBtn = new QToolButton(mSidebarWgt);
    mProxySettingBtn->setObjectName(QStringLiteral("SidebarButton"));
    mProxySettingBtn->setCheckable(true);
    vLayout->addWidget(mProxySettingBtn);

    mDebugSettingBtn = new QToolButton(mSidebarWgt);
    mDebugSettingBtn->setObjectName(QStringLiteral("SidebarButton"));
    mDebugSettingBtn->setCheckable(true);
    vLayout->addWidget(mDebugSettingBtn);

    mAboutSettingBtn = new QToolButton(mSidebarWgt);
    mAboutSettingBtn->setObjectName(QStringLiteral("SidebarButton"));
    mAboutSettingBtn->setCheckable(true);
    vLayout->addWidget(mAboutSettingBtn);

    vLayout->addStretch();
}

void SettingsDlg::initContentUi()
{
    mCommonSettingWgt = new CommonSettingWidget(mContentStack);
    // mCommonSettingWgt->setSizePolicy(QSizePolicy::Preferred, QSizePolicy::Fixed);
    mContentStack->addWidget(mCommonSettingWgt);

    mProxySettingWgt = new ProxySettingWidget(mContentStack);
    mContentStack->addWidget(mProxySettingWgt);

    mDebugSettingWgt = new DebugSettingWidget(mContentStack);
    mContentStack->addWidget(mDebugSettingWgt);

    mAboutSettingWgt = new AboutSettingWidget(mContentStack);
    mContentStack->addWidget(mAboutSettingWgt);
}

void SettingsDlg::setConnections()
{
    connect(mCommonSettingBtn, &QToolButton::clicked, this, &SettingsDlg::slotSidebarBtnClicked);
    connect(mProxySettingBtn, &QToolButton::clicked, this, &SettingsDlg::slotSidebarBtnClicked);
    connect(mDebugSettingBtn, &QToolButton::clicked, this, &SettingsDlg::slotSidebarBtnClicked);
    connect(mAboutSettingBtn, &QToolButton::clicked, this, &SettingsDlg::slotSidebarBtnClicked);
}

void SettingsDlg::initData()
{
    if (mDefaultTabType == ESettingDialogTabType::Proxy) {
        mProxySettingBtn->click();
    } else {
        mCommonSettingBtn->click();
    }
}

void SettingsDlg::retranslateUi()
{
    mCommonSettingBtn->setText(tr("Common Setting"));
    mProxySettingBtn->setText(tr("Proxy Setting"));
    mDebugSettingBtn->setText(tr("Debug Setting"));
    mAboutSettingBtn->setText(tr("About"));
}

