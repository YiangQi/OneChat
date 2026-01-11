#include "aboutsettingwidget.h"
#include <QEvent>
#include <QStyleOption>
#include <QPainter>
#include <QVBoxLayout>
#include <QLabel>
#include <QToolButton>

AboutSettingWidget::AboutSettingWidget(QWidget *parent)
    : QWidget{parent}
{
    initUi();
    retranslateUi();
}

void AboutSettingWidget::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
}

void AboutSettingWidget::changeEvent(QEvent *event)
{
    if (event->type() == QEvent::LanguageChange)
    {
        retranslateUi();
    }
    QWidget::changeEvent(event);
}

void AboutSettingWidget::initUi()
{
    QVBoxLayout *mLayout = new QVBoxLayout;
    mLayout->setContentsMargins(20, 20, 20, 20);
    mLayout->setSpacing(0);
    setLayout(mLayout);

    QLabel *iconLbl = new QLabel(this);
    iconLbl->setObjectName(QStringLiteral("LogoLabel"));
    QImage img(":/img/logo.ico");
    img = img.scaledToHeight(200, Qt::SmoothTransformation);
    iconLbl->setPixmap(QPixmap::fromImage(img));
    iconLbl->setScaledContents(true);
    iconLbl->setFixedHeight(200);
    mLayout->addWidget(iconLbl, 0, Qt::AlignHCenter);

    mLayout->addSpacing(20);
    QLabel *nameLbl = new QLabel(APP_TITLE, this);
    nameLbl->setObjectName(QStringLiteral("DescLabel"));
    mLayout->addWidget(nameLbl, 0, Qt::AlignHCenter);

    mLayout->addSpacing(5);
    QLabel *versionLbl = new QLabel(this);
    versionLbl->setObjectName(QStringLiteral("DescLabel"));
    versionLbl->setText(APP_VERSION);
    mLayout->addWidget(versionLbl, 0, Qt::AlignHCenter);
    mLayout->addSpacing(5);

    QLabel *githubLbl = new QLabel(this);
    githubLbl->setObjectName(QStringLiteral("DescLabel"));
    githubLbl->setOpenExternalLinks(true);
    QString githubAddress = "https://www.baidu.com";
    QString text = QString("<a href=\"%1\">Github</a>").arg(githubAddress);
    githubLbl->setText(text);
    mLayout->addWidget(githubLbl, 0, Qt::AlignHCenter);

    mLayout->addStretch();
}

void AboutSettingWidget::retranslateUi()
{

}
