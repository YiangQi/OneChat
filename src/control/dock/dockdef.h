#ifndef DOCKDEF_H
#define DOCKDEF_H

#include <QIcon>
#include <QString>

inline const char* drag_mime_data_key = "application/x-tab-index";
inline const char* DOCK_WIDGET_TAB_ICON_PATH = "dock_widget_tab_icon_path";

enum class DockDirection {
    Left,
    Top,
    Right,
    Bottom,
    Center,
    None
};

struct DockWidgetTabInfo {
    QString     tabIcon;
    QString     tabText;
    QWidget     *tabRightButton;

    DockWidgetTabInfo()
    {
        tabRightButton = nullptr;
        tabIcon = ":/img/sidebar_online_btn";
    }

    DockWidgetTabInfo(const QString &text)
        : DockWidgetTabInfo()
    {
        tabText = text;
    }

    DockWidgetTabInfo(const QString &iconPath,
                      const QString &text)
        : DockWidgetTabInfo(text)
    {
        tabIcon = iconPath;
    }
};

#endif // DOCKDEF_H
