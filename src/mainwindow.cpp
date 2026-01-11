#include "def.h"
#include "mainwindow.h"
#include "sidebartitle.h"
#include "sidebarpanel.h"
#include "centralwidget.h"
#include "inputpanel.h"
#include "signalbus/sidebarsignalbus.h"
#include "signalbus/centralsignalbus.h"
#include "signalbus/settingsignalbus.h"
#include "control/dock/docksignalbus.h"
#include "control/osplitter.h"
#include "config/settingsconfig.h"
#include "dialog/settingsdlg/settingsdlg.h"
#include "utils/utils.h"
#include <QApplication>
#include <QHBoxLayout>
#include <QResizeEvent>
#include <QMouseEvent>
#include <QTranslator>
#include <QScreen>
#include <QFile>
#include <QDebug>
#if defined(Q_OS_WIN)
#include <Windows.h>
#include <dwmapi.h>
#endif

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
{
    initUi();
    setConnections();
    this->resize2ScreenScale();
    mInputSplitter->setSizes({this->height() - mInputPanel->minimumHeight(), mInputPanel->minimumHeight()});
    updateQss();

    mTranslator = new QTranslator(this);
    slotLanguageChanged();
}

MainWindow::~MainWindow()
{

}

void MainWindow::closeEvent(QCloseEvent *event)
{
    // QList<QWidget*> topWidgetList = qApp->topLevelWidgets();
    // foreach(auto topWgt, topWidgetList)
    // {
    //     QList<OnlineView*> onlineViewList = topWgt->findChildren<OnlineView*>("");
    //     foreach(auto view, onlineViewList)
    //     {
    //         view->close();
    //     }
    // }
    if (mCentralWgt) {
        mCentralWgt->closeAllWebView();
    }
    event->accept();
}

bool MainWindow::nativeEvent(const QByteArray &eventType,
                             void *message,
                             long *result)
{
    MSG *msg = static_cast<MSG*>(message);
    if (msg->message == WM_SETTINGCHANGE &&
        QString::fromWCharArray((LPCWSTR)msg->lParam) == "ImmersiveColorSet") {
        updateQss();
    }
    return QWidget::nativeEvent(eventType, message, result);
}

void MainWindow::changeEvent(QEvent *event)
{
    if (event->type() == QEvent::LanguageChange)
    {
    }
    QMainWindow::changeEvent(event);
}

void MainWindow::slotSidebarBtnClicked(ESidebarButtonType btnType, bool checked)
{
    Q_UNUSED(btnType);
    if (!checked)
    {
        mMainSplitter->setSizes({0, this->width()});
    }
    else if (mMainSplitter->sizes()[0] == 0)
    {
        mMainSplitter->setSizes({mSidebarPanel->minimumWidth(), this->width() - mSidebarPanel->minimumWidth()});
    }
}

void MainWindow::slotThemeChanged()
{
    updateQss();
}

void MainWindow::slotLanguageChanged()
{
    EAppLanuageType langType = SettingsConfig::instance().appLanguageType();
    QString language = ":/language/en";
    if (langType == EAppLanuageType::ZH)
    {
        language = ":/language/zh";
    }
    else if (langType == EAppLanuageType::System)
    {
        QLocale::Language locale = QLocale::system().language();
        if (locale == QLocale::Chinese) {
            language = ":/language/zh";
        }
    }

    mTranslator->load(language);
    qApp->installTranslator(mTranslator);
}

void MainWindow::slotSettingBtnClicked(ESettingDialogTabType tabType, const QVariant &info)
{
    SettingsDlg dlg(tabType, info);
    connect(this, &MainWindow::signalAppThemeChanged, &dlg, &SettingsDlg::slotAppThemeChanged);
    dlg.slotAppThemeChanged(mThemeMode);
    dlg.exec();
}

void MainWindow::initUi()
{
    QWidget *mWidget = new QWidget;
    mWidget->setObjectName(QStringLiteral("MainWidget"));
    this->setCentralWidget(mWidget);

    QHBoxLayout *mLayout = new QHBoxLayout;
    mLayout->setContentsMargins(0, 4, 0, 0);
    mLayout->setSpacing(0);
    mWidget->setLayout(mLayout);

    mSidebarTitle = new SidebarTitle(this);
    mLayout->addWidget(mSidebarTitle);

    mMainSplitter = new OSplitter(Qt::Horizontal, this);
    mMainSplitter->setOpaqueResize(false);
    mLayout->addWidget(mMainSplitter);

    mSidebarPanel = new SidebarPanel(mMainSplitter);

    mInputSplitter = new OSplitter(Qt::Vertical, mMainSplitter);
    mInputSplitter->setOpaqueResize(false);

    mMainSplitter->addWidget(mSidebarPanel);
    mMainSplitter->addWidget(mInputSplitter);
    mMainSplitter->setProperty(SPLITTER_ADDRESSS, QString::number((quint64)mMainSplitter));
    mMainSplitter->setStretchFactor(0, 0);
    mMainSplitter->setStretchFactor(1, 1);

    mCentralWgt = new CentralWidget(mInputSplitter);
    mInputPanel = new InputPanel(mInputSplitter);

    mInputSplitter->addWidget(mCentralWgt);
    mInputSplitter->addWidget(mInputPanel);
    mInputSplitter->setProperty(SPLITTER_ADDRESSS, QString::number((quint64)mInputSplitter));
    mInputSplitter->setStretchFactor(0, 1);
    mInputSplitter->setStretchFactor(1, 0);
}

void MainWindow::updateQss()
{
    EAppThemeType themeType = SettingsConfig::instance().appThemeType();
    mThemeMode = APP_THEME_LIGHT_KEY;
    if (themeType == EAppThemeType::System)
    {
        if (isSystemDarkTheme()) {
            mThemeMode = APP_THEME_DARK_KEY;
        }
    }
    else if (themeType == EAppThemeType::Dark)
    {
        mThemeMode = APP_THEME_DARK_KEY;
    }
    QFile file(":/qss/"+ mThemeMode + "/mainwindow.qss");
    if (file.open(QFile::ReadOnly))
    {
        QString qss = QLatin1String(file.readAll());
        qApp->setStyleSheet(qss);
        file.close();
    }
    updateWindowTitlebarTheme(mThemeMode == APP_THEME_DARK_KEY);
    emit signalAppThemeChanged(mThemeMode);
}

void MainWindow::setConnections()
{
    connect(this, &MainWindow::signalAppThemeChanged, SidebarSignalBus::instance(), &SidebarSignalBus::signalAppThemeChanged);
    connect(this, &MainWindow::signalAppThemeChanged, DockSignalBus::instance(), &DockSignalBus::signalAppThemeChanged);
    connect(this, &MainWindow::signalAppThemeChanged, mInputPanel, &InputPanel::slotAppThemeChanged);

    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalSidebarBtnClicked, this, &MainWindow::slotSidebarBtnClicked);
    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalPanelOnlineItemClicked, CentralSignalBus::instance(), &CentralSignalBus::signalSidePanelOnlineItemClicked);

    connect(mMainSplitter, &OSplitter::splitterMoved, SidebarSignalBus::instance(), &SidebarSignalBus::signalMainWindowSplitterMoved);

    connect(SettingSignalBus::instance(), &SettingSignalBus::signalSettingConfigThemeChanged, this, &MainWindow::slotThemeChanged);
    connect(SettingSignalBus::instance(), &SettingSignalBus::signalSettingConfigLanguageChanged, this, &MainWindow::slotLanguageChanged);
    connect(SettingSignalBus::instance(), &SettingSignalBus::signalSettingBtnClicked, this, &MainWindow::slotSettingBtnClicked);
}

void MainWindow::resize2ScreenScale()
{
    QPoint cursorPoint = QCursor::pos();
    QScreen *screen = qApp->screenAt(cursorPoint);
    QRect geometry = screen->availableGeometry();
    this->resize(geometry.width() * 0.8, geometry.height() * 0.8);
    int x = geometry.x() + (geometry.width() - this->width()) / 2;
    int y = geometry.y() + (geometry.height() - this->height()) / 2;
    this->move(x, y);
}

void MainWindow::updateWindowTitlebarTheme(bool isDark)
{
    BOOL dark = isDark ? TRUE : FALSE;
    DwmSetWindowAttribute((HWND)winId(), DWMWA_USE_IMMERSIVE_DARK_MODE, &dark, sizeof(dark));
}



















