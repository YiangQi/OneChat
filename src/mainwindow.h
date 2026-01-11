#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include "def.h"
#include <QMainWindow>

class OSplitter;
class SidebarTitle;
class SidebarPanel;
class CentralWidget;
class InputPanel;
class QTranslator;
class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();
signals:
    void signalAppThemeChanged(const QString &themeMode);
protected:
    void closeEvent(QCloseEvent *event) override;
    bool nativeEvent(const QByteArray &eventType,
                     void *message,
                     long *result) override;
    void changeEvent(QEvent *event) override;
private slots:
    void slotSidebarBtnClicked(ESidebarButtonType btnType, bool checked);
    void slotThemeChanged();
    void slotLanguageChanged();

    void slotSettingBtnClicked(ESettingDialogTabType tabType, const QVariant &info);
private:
    void initUi();
    void updateQss();
    void setConnections();
    void updateWindowTitlebarTheme(bool isDark);
    void resize2ScreenScale();
private:
    OSplitter               *mMainSplitter = nullptr;
    SidebarTitle            *mSidebarTitle = nullptr;
    SidebarPanel            *mSidebarPanel = nullptr;
    OSplitter               *mInputSplitter = nullptr;
    CentralWidget           *mCentralWgt = nullptr;
    InputPanel              *mInputPanel = nullptr;

    QString                 mThemeMode;
    QTranslator             *mTranslator = nullptr;
};
#endif // MAINWINDOW_H
