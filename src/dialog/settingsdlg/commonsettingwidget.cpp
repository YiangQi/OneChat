#include "commonsettingwidget.h"
#include "../../def.h"
#include "../../config/settingsconfig.h"
#include "../../signalbus/settingsignalbus.h"
#include <QComboBox>
#include <QLabel>
#include <QGridLayout>
#include <QPainter>
#include <QListView>
#include <QEvent>

CommonSettingWidget::CommonSettingWidget(QWidget *parent)
    : QWidget{parent}
{
    initUi();
    initData();
    setConnections();
    retranslateUi();
}

void CommonSettingWidget::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
}

void CommonSettingWidget::changeEvent(QEvent *event)
{
    if (event->type() == QEvent::LanguageChange)
    {
        retranslateUi();
    }
    QWidget::changeEvent(event);
}

void CommonSettingWidget::initUi()
{
    QVBoxLayout *vLayout = new QVBoxLayout;
    vLayout->setContentsMargins(10, 20, 10, 20);
    vLayout->setSpacing(0);
    this->setLayout(vLayout);

    QWidget *containerWgt = new QWidget(this);
    containerWgt->setObjectName(QStringLiteral("ContainerWgt"));
    vLayout->addWidget(containerWgt);
    vLayout->addStretch();

    QGridLayout *mLayout = new QGridLayout;
    mLayout->setHorizontalSpacing(0);
    mLayout->setVerticalSpacing(10);
    containerWgt->setLayout(mLayout);

    int row = 0;
    mThemeLbl = new QLabel(this);
    mLayout->addWidget(mThemeLbl, row, 0, Qt::AlignLeft);

    mThemeCbb = new QComboBox(this);
    mThemeCbb->setView(new QListView);
    mLayout->addWidget(mThemeCbb, row, 1, Qt::AlignRight);

    row++;
    QWidget *separatorWgt = new QWidget(this);
    separatorWgt->setObjectName(QStringLiteral("SeparatorWgt"));
    separatorWgt->setSizePolicy(QSizePolicy::Ignored, QSizePolicy::Fixed);
    mLayout->addWidget(separatorWgt, row, 0, 1, 2);

    row++;
    mLanguageLbl = new QLabel(this);
    mLayout->addWidget(mLanguageLbl, row, 0, Qt::AlignLeft);

    mLanguageCbb = new QComboBox(this);
    mLanguageCbb->setView(new QListView);
    mLayout->addWidget(mLanguageCbb, row, 1, Qt::AlignRight);
}

void CommonSettingWidget::initData()
{
    mThemeCbb->addItem(tr("System"), (int)EAppThemeType::System);
    mThemeCbb->addItem(tr("Light"), (int)EAppThemeType::Light);
    mThemeCbb->addItem(tr("Dark"), (int)EAppThemeType::Dark);

    mLanguageCbb->addItem(tr("System"), (int)EAppLanuageType::System);
    mLanguageCbb->addItem(tr("English"), (int)EAppLanuageType::EN);
    mLanguageCbb->addItem(tr("中文"), (int)EAppLanuageType::ZH);

    CommonSettingModel &commonModel = SettingsConfig::instance().commonModel();
    mThemeCbb->setCurrentIndex((int)commonModel.themeType);
    mLanguageCbb->setCurrentIndex((int)commonModel.languageType);
}

void CommonSettingWidget::retranslateUi()
{
    mThemeLbl->setText(tr("Theme"));
    mLanguageLbl->setText(tr("Language"));

    mThemeCbb->setItemText(0, tr("System"));
    mThemeCbb->setItemText(1, tr("Light"));
    mThemeCbb->setItemText(2, tr("Dark"));

    mLanguageCbb->setItemText(0, tr("System"));
    mLanguageCbb->setItemText(1, tr("English"));
    mLanguageCbb->setItemText(2, tr("中文"));
}

void CommonSettingWidget::setConnections()
{
    connect(mThemeCbb, QOverload<int>::of(&QComboBox::currentIndexChanged), this, &CommonSettingWidget::slotThemeCbbCurrentIndexChanged);
    connect(mLanguageCbb, QOverload<int>::of(&QComboBox::currentIndexChanged), this, &CommonSettingWidget::slotLanguageCbbCurrentIndexChanged);
}

void CommonSettingWidget::slotThemeCbbCurrentIndexChanged(int index)
{
    EAppThemeType type = (EAppThemeType)mThemeCbb->currentData().toInt();
    CommonSettingModel &commonModel = SettingsConfig::instance().commonModel();
    commonModel.themeType = type;
    SettingsConfig::instance().save();
    emit SettingSignalBus::instance()->signalSettingConfigThemeChanged((int)type);
}

void CommonSettingWidget::slotLanguageCbbCurrentIndexChanged(int index)
{
    EAppLanuageType type = (EAppLanuageType)mLanguageCbb->currentData().toInt();
    CommonSettingModel &commonModel = SettingsConfig::instance().commonModel();
    commonModel.languageType = type;
    SettingsConfig::instance().save();
    emit SettingSignalBus::instance()->signalSettingConfigLanguageChanged((int)type);
}
