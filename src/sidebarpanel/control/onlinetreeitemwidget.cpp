#include "onlinetreeitemwidget.h"
#include <QHBoxLayout>
#include <QStyleOption>
#include <QLabel>
#include <QToolButton>
#include <QPainter>

OnlineTreeItemWidget::OnlineTreeItemWidget(const QString &name,
                                           const QString &iconPath,
                                           QTreeWidgetItem *treeWidgetItem,
                                           QWidget *parent)
    : QWidget{parent}
    , mTreeWidgetItem(treeWidgetItem)
    , mName(name)
    , mIconPath(iconPath)
{
    initUi();
}

void OnlineTreeItemWidget::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);

    if (mNameLbl)
    {
        QFontMetrics fontMetric(mNameLbl->font());
        QString eliteStr;
        int width = this->width() - 35;
        eliteStr = fontMetric.elidedText(mName, Qt::ElideRight, width);
        mNameLbl->setText(eliteStr);
    }

    QWidget::paintEvent(event);
}

void OnlineTreeItemWidget::initUi()
{
    QHBoxLayout *mLayout = new QHBoxLayout;
    mLayout->setContentsMargins(0, 0, 0, 0);
    mLayout->setSpacing(0);
    this->setLayout(mLayout);

    mLayout->addSpacing(5);
    mIconLbl = new QLabel(this);
    mIconLbl->setObjectName(QStringLiteral("OnlineIcon"));
    mIconLbl->setScaledContents(true);
    mIconLbl->setPixmap(QPixmap(mIconPath));
    mLayout->addWidget(mIconLbl);
    mLayout->addSpacing(5);

    mNameLbl = new QLabel(this);
    mNameLbl->setObjectName(QStringLiteral("OnlineName"));
    mNameLbl->setText(mName);
    mLayout->addWidget(mNameLbl);
}
