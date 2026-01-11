#include <qglobal.h>
#include <QSettings>

#if defined(Q_OS_WIN)

bool isWindowsDarkTheme() {
    QSettings reg("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize", QSettings::NativeFormat);
    return reg.value("AppsUseLightTheme", 1).toInt() == 0;
}

#elif defined(Q_OS_MAC)

bool isMacDarkTheme() {
    QProcess process;
    process.start("defaults", {"read", "-g", "AppleInterfaceStyle"});
    return process.waitForFinished() &&
           process.readAllStandardOutput().contains("Dark");
}

#endif


bool isSystemDarkTheme()
{
#if defined(Q_OS_WIN)
    return isWindowsDarkTheme();
#elif defined(Q_OS_MAC)
    return isMacDarkTheme();
#endif
}
