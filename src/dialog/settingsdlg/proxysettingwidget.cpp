#include "proxysettingwidget.h"
#include "../../config/onlinemodelconfig.h"
#include "../../config/settingsconfig.h"
#include "../../signalbus/settingsignalbus.h"
#include <QStyleOption>
#include <QPainter>
#include <QVBoxLayout>
#include <QCheckBox>
#include <QLineEdit>
#include <QLabel>
#include <QTreeWidget>
#include <QTreeWidgetItem>
#include <QEvent>

ProxySettingWidget::ProxySettingWidget(QWidget *parent)
    : QWidget{parent}
{
    initUi();
    initData();
    setConnections();
    retranslateUi();
}

void ProxySettingWidget::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
}

void ProxySettingWidget::changeEvent(QEvent *event)
{
    if (event->type() == QEvent::LanguageChange)
    {
        retranslateUi();
    }
    QWidget::changeEvent(event);
}

void ProxySettingWidget::slotEnableProxyCBStateChanged(int state)
{
    if (state == Qt::Checked)
    {
        mLineEdit->setEnabled(true);
        mTreeWgt->setEnabled(!mLineEdit->text().isEmpty());
    }
    else
    {
        mTreeWgt->setEnabled(false);
        mLineEdit->setEnabled(false);
    }
    ProxySettingModel &proxyModel = SettingsConfig::instance().proxyModel();
    proxyModel.isEnableProxy = state == Qt::Checked;
    SettingsConfig::instance().save();
}

void ProxySettingWidget::slotTreeWidgetItemClicked(QTreeWidgetItem *item)
{
    if (item == nullptr) {
        return;
    }

    if (item == mOnlineTopItem)
    {
        item->setExpanded(!item->isExpanded());
    }
    else
    {
        ProxySettingModel &proxyModel = SettingsConfig::instance().proxyModel();
        QString url = item->data(0, Qt::UserRole).toString();
        if (proxyModel.enableProxyList.contains(url))
        {
            if (item->checkState(0) == Qt::Unchecked) {
                proxyModel.enableProxyList.removeOne(url);
                emit signalWebViewProxyUsed(url, false);
            }
        }
        else
        {
            if (item->checkState(0) == Qt::Checked) {
                proxyModel.enableProxyList.append(url);
                emit signalWebViewProxyUsed(url, true);
            }
        }
        SettingsConfig::instance().save();
    }
}

void ProxySettingWidget::slotLineEditEditFinished()
{
    ProxySettingModel &proxyModel = SettingsConfig::instance().proxyModel();
    proxyModel.proxyAddress = mLineEdit->text();
    SettingsConfig::instance().save();
}

void ProxySettingWidget::slotLineEditTextChanged(const QString &text)
{
    Q_UNUSED(text);
    mTreeWgt->setEnabled(!mLineEdit->text().isEmpty());
}

void ProxySettingWidget::initUi()
{
    QVBoxLayout *vLayout = new QVBoxLayout;
    vLayout->setContentsMargins(10, 20, 10, 20);
    vLayout->setSpacing(0);
    this->setLayout(vLayout);

    QWidget *containerWgt = new QWidget(this);
    containerWgt->setObjectName(QStringLiteral("ContainerWgt"));
    vLayout->addWidget(containerWgt);
    // vLayout->addStretch();

    QVBoxLayout *mLayout = new QVBoxLayout;
    mLayout->setContentsMargins(10, 10, 10, 10);
    mLayout->addSpacing(10);
    containerWgt->setLayout(mLayout);

    mEnableProxyCB = new QCheckBox(this);
    mLayout->addWidget(mEnableProxyCB);

    QHBoxLayout *hLayout = new QHBoxLayout;
    hLayout->setContentsMargins(0, 0, 0, 0);
    hLayout->setSpacing(0);
    mLayout->addLayout(hLayout);

    mProxyLbl = new QLabel(this);
    hLayout->addWidget(mProxyLbl);
    hLayout->addSpacing(20);

    mLineEdit = new QLineEdit(this);
    hLayout->addWidget(mLineEdit);

    mProxyTipLbl = new QLabel(this);
    mProxyTipLbl->setObjectName(QStringLiteral("WarnLabel"));
    mProxyTipLbl->setWordWrap(true);
    mLayout->addWidget(mProxyTipLbl);

    QWidget *separatorWgt = new QWidget(this);
    separatorWgt->setObjectName(QStringLiteral("SeparatorWgt"));
    separatorWgt->setSizePolicy(QSizePolicy::Ignored, QSizePolicy::Fixed);
    mLayout->addWidget(separatorWgt);
    mLayout->addSpacing(10);

    mTreeLbl = new QLabel(this);
    mTreeLbl->setWordWrap(true);
    mLayout->addWidget(mTreeLbl);

    mTreeWgt = new QTreeWidget(this);
    mTreeWgt->setHeaderHidden(true);
    mTreeWgt->setSizePolicy(QSizePolicy::Preferred, QSizePolicy::MinimumExpanding);
    mLayout->addWidget(mTreeWgt);
}

void ProxySettingWidget::initData()
{
    mOnlineTopItem = new QTreeWidgetItem(mTreeWgt);
    mOnlineTopItem->setExpanded(true);
    mTreeWgt->addTopLevelItem(mOnlineTopItem);

    ProxySettingModel &proxyModel = SettingsConfig::instance().proxyModel();
    mEnableProxyCB->setCheckState(proxyModel.isEnableProxy ? Qt::Checked : Qt::Unchecked);
    if (!proxyModel.proxyAddress.isEmpty())
    {
        mLineEdit->setText(proxyModel.proxyAddress);
    }

    mLineEdit->setEnabled(proxyModel.isEnableProxy);
    mTreeWgt->setEnabled(!proxyModel.proxyAddress.isEmpty());

    QVector<OnlineItemInfo> itemList = OnlineModelConfig::instance().getModelList();
    foreach(const auto &itemInfo, itemList)
    {
        QTreeWidgetItem *item = new QTreeWidgetItem;
        item->setText(0, itemInfo.name);
        item->setIcon(0, QIcon(itemInfo.icon));
        item->setCheckState(0, Qt::Unchecked);
        item->setData(0, Qt::UserRole, itemInfo.url);
        mOnlineTopItem->addChild(item);
        if (proxyModel.enableProxyList.contains(itemInfo.url)) {
            item->setCheckState(0, Qt::Checked);
        } else {
            item->setCheckState(0, Qt::Unchecked);
        }
    }
}

void ProxySettingWidget::retranslateUi()
{
    mEnableProxyCB->setText(tr("Check this option to enable web proxy."));
    mProxyLbl->setText(tr("Proxy Address:"));
    mLineEdit->setPlaceholderText("refer to the format as below");
    mProxyTipLbl->setText(tr("Address format: ^(https?|socks|socks4a?|socks5h?)://([^:]*(:[^@]*)?@)?([^:]+|\\[[:0-9a-fA-F]+\\])(:\\d+)?/?$|^$"));
    mTreeLbl->setText(tr("Check the item which need to enable web proxy after inputing the proxy address"));
    mOnlineTopItem->setText(0, tr("Online AI Website"));
}

void ProxySettingWidget::setConnections()
{
    connect(mTreeWgt, &QTreeWidget::itemClicked, this, &ProxySettingWidget::slotTreeWidgetItemClicked);
    connect(mEnableProxyCB, &QCheckBox::stateChanged, this, &ProxySettingWidget::slotEnableProxyCBStateChanged);
    connect(mLineEdit, &QLineEdit::editingFinished, this, &ProxySettingWidget::slotLineEditEditFinished);
    connect(mLineEdit, &QLineEdit::textEdited, this, &ProxySettingWidget::slotLineEditTextChanged);

    connect(this, &ProxySettingWidget::signalWebViewProxyUsed, SettingSignalBus::instance(), &SettingSignalBus::signalWebViewProxyUsed);
}
