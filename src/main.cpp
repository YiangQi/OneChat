#include "mainwindow.h"
#include "QCefConfig.h"
#include "QCefContext.h"
#include "config/settingsconfig.h"
#include "utils/utils.h"
#include <QApplication>
#include <QFontDatabase>
#include <QStandardPaths>
#include <QLocale>
#include <QDebug>

void loadFont()
{
    QFontDatabase::addApplicationFont(":/font/SourceHanSans.ttf");
}

void setLanguage(QCefConfig &config)
{
    QLocale::Language language = QLocale::system().language();
    switch (language) {
    case QLocale::Chinese:
        config.setLocale("zh-CN");
        break;
    default:
        config.setLocale("en-US");
        break;
    }
}

void initCefConfig(QCefConfig &config)
{
    // set language
    setLanguage(config);
    // set log level
    config.setLogLevel(QCefConfig::LOGSEVERITY_DEFAULT);
    // set user agent
    config.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 chrome/libcef");
    // set JSBridge object name (default value is CefViewClient)
    config.setBridgeObjectName("CallBridge");
    // set Built-in scheme name (default value is CefView)
    config.setBuiltinSchemeName("CefView");
    // port for remote debugging (default is 0 and means to disable remote debugging)
    config.setRemoteDebuggingPort(9000);
    // set background color for all browsers
    // (QCefSetting.setBackgroundColor will overwrite this value for specified browser instance)
    // config.setBackgroundColor(Qt::lightGray);

    // windowlessRenderingEnabled is set to true by default,
    // set to false to disable the OSR mode
    config.setWindowlessRenderingEnabled(true);

    // disable sandbox
    // this is a bit complicated, please refer to:
    // https://developer.apple.com/documentation/xcode/configuring-the-macos-app-sandbox
    config.setSandboxDisabled(true);

    // add command line args, you can any cef supported switches or parameters
    config.addCommandLineSwitch("use-mock-keychain");
    // config.addCommandLineSwitch("disable-gpu");
    // config.addCommandLineSwitch("enable-media-stream");
    // config.addCommandLineSwitch("allow-file-access-from-files");
    // config.addCommandLineSwitch("disable-spell-checking");
    // config.addCommandLineSwitch("disable-site-isolation-trials");
    // config.addCommandLineSwitch("enable-aggressive-domstorage-flushing");
    config.addCommandLineSwitchWithValue("renderer-process-limit", "1");
    // allow remote debugging
    config.addCommandLineSwitchWithValue("remote-allow-origins", "*");
    // config.addCommandLineSwitchWithValue("disable-features", "BlinkGenPropertyTrees,TranslateUI,site-per-process");

    // set cache folder
    config.setCachePath(QCoreApplication::applicationDirPath() + "/webcache");
}

int main(int argc, char *argv[])
{
    // QApplication::setAttribute(Qt::AA_UseSoftwareOpenGL);
#if QT_VERSION < QT_VERSION_CHECK(6, 0, 0)
    QApplication::setAttribute(Qt::AA_EnableHighDpiScaling);
    QApplication::setAttribute(Qt::AA_UseHighDpiPixmaps);
#if defined(Q_OS_WIN)
    QGuiApplication::setHighDpiScaleFactorRoundingPolicy(Qt::HighDpiScaleFactorRoundingPolicy::PassThrough);
#endif
#endif

    QApplication a(argc, argv);
    QApplication::setWindowIcon(QIcon(":/img/logo.ico"));
    QCoreApplication::setApplicationName(APP_TITLE);
    QCoreApplication::setApplicationVersion(APP_VERSION);

    SettingsConfig::instance().init();
    loadFont();

    // build QCefConfig
    QCefConfig config;
    initCefConfig(config);
    // create QCefContext instance with config,
    // the lifecycle of cefContext must be the same as QApplication instance
    QCefContext cefContext(&a, argc, argv, &config);

    MainWindow w;
    w.show();
    return a.exec();
}
