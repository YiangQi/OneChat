QT       += core gui

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

CONFIG += c++17

PROJECT_VERSION=0.1.0
DEFINES += $$shell_quote(APP_TITLE=\"OneChat\")
DEFINES += $$shell_quote(APP_VERSION=\"$$PROJECT_VERSION\")
VERSION = $$PROJECT_VERSION

# You can make your code fail to compile if it uses deprecated APIs.
# In order to do so, uncomment the following line.
#DEFINES += QT_DISABLE_DEPRECATED_BEFORE=0x060000    # disables all the APIs deprecated before Qt 6.0.0

SOURCES += \
    src/centralwidget.cpp \
    src/centralwidget/loadingwidget.cpp \
    src/centralwidget/onlineview.cpp \
    src/centralwidget/questionupdownwidget.cpp \
    src/config/onlinemodelconfig.cpp \
    src/config/settingsconfig.cpp \
    src/control/dock/dockcontainer.cpp \
    src/control/dock/dockfloatwidget.cpp \
    src/control/dock/docksignalbus.cpp \
    src/control/dock/docktabbuttonwidget.cpp \
    src/control/dock/dockwidget.cpp \
    src/control/dock/dockwidgetcornerwidget.cpp \
    src/control/dock/dockwidgettabbar.cpp \
    src/control/inputtextedit.cpp \
    src/control/osplitter.cpp \
    src/control/osplitterhandle.cpp \
    src/dialog/settingsdlg/aboutsettingwidget.cpp \
    src/dialog/settingsdlg/commonsettingwidget.cpp \
    src/dialog/settingsdlg/debugsettingwidget.cpp \
    src/dialog/settingsdlg/proxysettingwidget.cpp \
    src/dialog/settingsdlg/settingsdlg.cpp \
    src/inputpanel.cpp \
    src/sidebarpanel.cpp \
    src/sidebarpanel/control/onlinetreeitemwidget.cpp \
    src/sidebarpanel/onlinepanel.cpp \
    src/sidebartitle.cpp \
    src/utils/utils.cpp \
    src\main.cpp \
    src\mainwindow.cpp

HEADERS += \
    src/centralwidget.h \
    src/centralwidget/loadingwidget.h \
    src/centralwidget/onlineview.h \
    src/centralwidget/questionupdownwidget.h \
    src/config/onlinemodelconfig.h \
    src/config/settingsconfig.h \
    src/control/dock/dockcontainer.h \
    src/control/dock/dockdef.h \
    src/control/dock/dockfloatwidget.h \
    src/control/dock/docksignalbus.h \
    src/control/dock/docktabbuttonwidget.h \
    src/control/dock/dockwidget.h \
    src/control/dock/dockwidgetcornerwidget.h \
    src/control/dock/dockwidgettabbar.h \
    src/control/inputtextedit.h \
    src/control/osplitter.h \
    src/control/osplitterhandle.h \
    src/def.h \
    src/dialog/settingsdlg/aboutsettingwidget.h \
    src/dialog/settingsdlg/commonsettingwidget.h \
    src/dialog/settingsdlg/debugsettingwidget.h \
    src/dialog/settingsdlg/proxysettingwidget.h \
    src/dialog/settingsdlg/settingsdlg.h \
    src/inputpanel.h \
    src/sidebarpanel.h \
    src/sidebarpanel/control/onlinetreeitemwidget.h \
    src/sidebarpanel/onlinepanel.h \
    src/sidebartitle.h \
    src/signalbus/centralsignalbus.h \
    src/signalbus/inputpanelsignalbus.h \
    src/signalbus/settingsignalbus.h \
    src/signalbus/sidebarsignalbus.h \
    src/utils/utils.h \
    src\mainwindow.h

INCLUDEPATH += \
    $$PWD/3rdparty/qcefview/include

win32:CONFIG(debug, debug|release) {
    contains(QT_ARCH, i386) {
        LIBS += -L$$PWD/3rdparty/qcefview/lib/win/x86/debug -lQCefView
    } else {
        LIBS += -L$$PWD/3rdparty/qcefview/lib/win/x64/debug -lQCefView
    }
    LIBS += -ldwmapi
}

win32:CONFIG(release, debug|release) {
    contains(QT_ARCH, i386) {
        LIBS += -L$$PWD/3rdparty/qcefview/lib/win/x86/release -lQCefView
    } else {
        LIBS += -L$$PWD/3rdparty/qcefview/lib/win/x64/release -lQCefView
    }
    LIBS += -ldwmapi
}

# Default rules for deployment.
qnx: target.path = /tmp/$${TARGET}/bin
else: unix:!android: target.path = /opt/$${TARGET}/bin
!isEmpty(target.path): INSTALLS += target

TRANSLATIONS += resource/language/zh.ts \
                resource/language/en.ts

RESOURCES += \
    resource/res.qrc

RC_ICONS = resource/img/logo.ico
