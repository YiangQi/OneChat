#include "def.h"
#include "inputpanel.h"
#include "control/inputtextedit.h"
#include "signalbus/inputpanelsignalbus.h"
#include "signalbus/sidebarsignalbus.h"
#include <QStyleOption>
#include <QPainter>
#include <QTextEdit>
#include <QToolButton>
#include <QVBoxLayout>
#include <QFile>
#include <QFileDialog>
#include <QDebug>
#include <QEvent>
#include <QLabel>
#include <QComboBox>
#include <QListView>
#include <QStandardItemModel>
#include <QMouseEvent>
#include <QLineEdit>

InputPanel::InputPanel(QWidget *parent)
    : QWidget{parent}
{
    initUi();
    setConnections();
    this->setMinimumHeight(150);
    retranslateUi();
}

void InputPanel::slotInputPanelStatusRequested(const QString &eventName, const QString &url)
{
    InputPanelInfo info;
    info.isSidebarVisible = mSidebarUnfoldBtn->isChecked();
    info.isInputBoxVisible = mShowInputBtn->isChecked();
    emit signalInputPanelStatusUpdated(eventName, info, url);
}

void InputPanel::slotAppThemeChanged(const QString &themeMode)
{
    QFile file(":/qss/" + themeMode + "/inputpanel.qss");
    if (file.open(QFile::ReadOnly))
    {
        QString qss = QLatin1String(file.readAll());
        this->setStyleSheet(qss);
        file.close();
    }
}

void InputPanel::slotOnlineViewCreated(const MsgSendInfo &msgSendInfo)
{

    for(int row = 0; row < mSendToCbbModel->rowCount(); row++)
    {
        QStandardItem *item = mSendToCbbModel->item(row);
        if (item->data().toString() == msgSendInfo.url) {
            return;
        }
    }
    QStandardItem *item = new QStandardItem();
    item->setText(msgSendInfo.name);
    item->setData(msgSendInfo.url);
    item->setIcon(QIcon(msgSendInfo.icon));
    item->setCheckable(true);
    item->setCheckState(Qt::Checked);
    item->setEnabled(true);
    mSendToCbbModel->appendRow(item);
    updateSendToCbbModelState(item);
}

void InputPanel::slotOnlineViewDestroyed(const MsgSendInfo &msgSendInfo)
{
    for(int row = 0; row < mSendToCbbModel->rowCount(); row++)
    {
        QStandardItem *item = mSendToCbbModel->item(row);
        if (item->data().toString() == msgSendInfo.url)
        {
            mSendToCbbModel->removeRow(row);
            updateSendToCbbModelState(nullptr);
            break;
        }
    }
}

void InputPanel::paintEvent(QPaintEvent *event)
{
    Q_UNUSED(event);
    QStyleOption opt;
    opt.initFrom(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
}

void InputPanel::changeEvent(QEvent *event)
{
    if (event->type() == QEvent::LanguageChange) {
        retranslateUi();
    }
    QWidget::changeEvent(event);
}

bool InputPanel::eventFilter(QObject *obj, QEvent *event)
{
    if (obj == mSendToCbb->view()->viewport())
    {
        if (event->type() == QEvent::MouseButtonRelease)
        {
            QMouseEvent *mouseEvent = static_cast<QMouseEvent*>(event);
            QModelIndex index = mSendToCbb->view()->indexAt(mouseEvent->pos());

            if (index.isValid())
            {
                QStandardItem *item = mSendToCbbModel->itemFromIndex(index);
                Qt::CheckState state = item->checkState();
                item->setCheckState((state == Qt::Checked) ? Qt::Unchecked : Qt::Checked);

                updateSendToCbbModelState(item);
                return true;
            }
        }
    }
    else if (obj == mSendToCbb->lineEdit())
    {
        if (event->type() == QEvent::MouseButtonRelease)
        {
            mSendToCbb->showPopup();
            return true;
        }
    }
    return QWidget::eventFilter(obj, event);
}

void InputPanel::slotTextEditTextChanged()
{
    emit signalInputTextChanged(mTextEdit->toPlainText(), mSendToModelList);
}

void InputPanel::slotSendMsgBtnClicked()
{
    emit signalSendMsgBtnClicked(mSendToModelList);
    mTextEdit->blockSignals(true);
    mTextEdit->clear();
    mTextEdit->blockSignals(false);
}

void InputPanel::slotAddFileBtnClicked()
{
    QString fileName = QFileDialog::getOpenFileName(this, tr("Select File"),
                                                    "",
                                                    tr("All Files (*.*)"));
    if (!QFileInfo::exists(fileName)) {
        return;
    }
    emit signalAddFileBtnClicked(fileName);
}

void InputPanel::slotAddImageBtnClicked()
{
    QString fileName = QFileDialog::getOpenFileName(this, tr("Select Image"),
                                                    "",
                                                    tr("Images (*.png *.jpg *.jpeg *.webp *.bmp *.gif)"));
    if (!QFileInfo::exists(fileName)) {
        return;
    }
    emit signalAddImageBtnClicked(fileName);
}

void InputPanel::initUi()
{
    QVBoxLayout *mainLayout = new QVBoxLayout;
    mainLayout->setContentsMargins(10, 10, 10, 10);
    mainLayout->setSpacing(0);
    this->setLayout(mainLayout);

    mMainWgt = new QWidget(this);
    mMainWgt->setObjectName(QStringLiteral("MainWidget"));
    mainLayout->addWidget(mMainWgt);

    QVBoxLayout *mLayout = new QVBoxLayout;
    mLayout->setContentsMargins(6, 6, 6, 6);
    mLayout->setSpacing(0);
    mMainWgt->setLayout(mLayout);

    mHeaderWgt = new QWidget(mMainWgt);
    mHeaderWgt->setObjectName(QStringLiteral("HeaderWidget"));
    mLayout->addWidget(mHeaderWgt);

    mTextEdit = new InputTextEdit(mMainWgt);
    mLayout->addWidget(mTextEdit);

    mBottomWgt = new QWidget(this);
    mBottomWgt->setObjectName(QStringLiteral("BottomWidget"));
    mLayout->addWidget(mBottomWgt);

    initHeaderUi();
    initBottomUi();
}

void InputPanel::initHeaderUi()
{
    QHBoxLayout *bLayout = new QHBoxLayout;
    bLayout->setContentsMargins(0, 0, 0, 0);
    bLayout->setSpacing(0);
    mHeaderWgt->setLayout(bLayout);

    mLoginBtn = new QToolButton(mHeaderWgt);
    mLoginBtn->setObjectName(QStringLiteral("LoginButton"));
    bLayout->addWidget(mLoginBtn);
    bLayout->addSpacing(10);

    mSidebarUnfoldBtn = new QToolButton(mHeaderWgt);
    mSidebarUnfoldBtn->setCheckable(true);
    mSidebarUnfoldBtn->setObjectName(QStringLiteral("SidebarUnfoldButton"));
    bLayout->addWidget(mSidebarUnfoldBtn);
    bLayout->addSpacing(10);

    mShowInputBtn = new QToolButton(mHeaderWgt);
    mShowInputBtn->setCheckable(true);
    mShowInputBtn->setObjectName(QStringLiteral("ShowInputButton"));
    bLayout->addWidget(mShowInputBtn);
    bLayout->addSpacing(10);

    mChatNewBtn = new QToolButton(mHeaderWgt);
    mChatNewBtn->setObjectName(QStringLiteral("ChatNewButton"));
    bLayout->addWidget(mChatNewBtn);
    bLayout->addSpacing(10);

    mQuestionUpBtn = new QToolButton(mHeaderWgt);
    mQuestionUpBtn->setObjectName(QStringLiteral("QuestionUpButton"));
    bLayout->addWidget(mQuestionUpBtn);
    bLayout->addSpacing(10);

    mQuestionDownBtn = new QToolButton(mHeaderWgt);
    mQuestionDownBtn->setObjectName(QStringLiteral("QuestionDownButton"));
    bLayout->addWidget(mQuestionDownBtn);

    bLayout->addStretch();

    mSendToLbl = new QLabel(mHeaderWgt);
    mSendToLbl->setObjectName(QStringLiteral("SendToLbl"));
    bLayout->addWidget(mSendToLbl);
    bLayout->addSpacing(10);

    mSendToCbb = new QComboBox(mHeaderWgt);
    mSendToCbb->setObjectName(QStringLiteral("SendToCbb"));
    mSendToCbb->setView(new QListView);
    mSendToCbb->setEditable(true);
    mSendToCbb->lineEdit()->setReadOnly(true);
    mSendToCbb->lineEdit()->installEventFilter(this);
    mSendToCbb->view()->viewport()->installEventFilter(this);
    bLayout->addWidget(mSendToCbb);

    mSendToCbbModel = new QStandardItemModel(mSendToCbb);
    mSendToCbb->setModel(mSendToCbbModel);
    resetSendToCbbModel();
}

void InputPanel::initBottomUi()
{
    QHBoxLayout *bLayout = new QHBoxLayout;
    bLayout->setContentsMargins(0, 0, 0, 0);
    bLayout->setSpacing(0);
    mBottomWgt->setLayout(bLayout);

    bLayout->addStretch();

    mAddImageBtn = new QToolButton(mBottomWgt);
    mAddImageBtn->setObjectName(QStringLiteral("AddImageButton"));
    bLayout->addWidget(mAddImageBtn);
    bLayout->addSpacing(10);

    mAddFileBtn = new QToolButton(mBottomWgt);
    mAddFileBtn->setObjectName(QStringLiteral("AddFileButton"));
    bLayout->addWidget(mAddFileBtn);
    bLayout->addSpacing(10);

    mSendMsgBtn = new QToolButton(mBottomWgt);
    mSendMsgBtn->setObjectName(QStringLiteral("SendButton"));
    bLayout->addWidget(mSendMsgBtn);
}

void InputPanel::setConnections()
{
    connect(mTextEdit, &QTextEdit::textChanged, this, &InputPanel::slotTextEditTextChanged);
    connect(mTextEdit, &InputTextEdit::signalInputTextFinished, this, &InputPanel::slotSendMsgBtnClicked);
    connect(mSendMsgBtn, &QToolButton::clicked, this, &InputPanel::slotSendMsgBtnClicked);
    connect(mShowInputBtn, &QToolButton::toggled, this, &InputPanel::signalInputBoxVisibleChanged);
    connect(mSidebarUnfoldBtn, &QToolButton::toggled, this, &InputPanel::signalSidebarVisibleChanged);
    connect(mLoginBtn, &QToolButton::clicked, this, &InputPanel::signalLoginBtnClicked);
    connect(mAddImageBtn, &QToolButton::clicked, this, &InputPanel::slotAddImageBtnClicked);
    connect(mAddFileBtn, &QToolButton::clicked, this, &InputPanel::slotAddFileBtnClicked);
    connect(mChatNewBtn, &QToolButton::clicked, this, &InputPanel::signalNewChatBtnClicked);
    connect(mQuestionUpBtn, &QToolButton::clicked, this, &InputPanel::signalQuestionUpBtnClicked);
    connect(mQuestionDownBtn, &QToolButton::clicked, this, &InputPanel::signalQuestionDownBtnClicked);

    connect(this, &InputPanel::signalInputTextChanged, InputPanelSignalBus::instance(), &InputPanelSignalBus::signalInputTextChanged);
    connect(this, &InputPanel::signalSendMsgBtnClicked, InputPanelSignalBus::instance(), &InputPanelSignalBus::signalSendMsgBtnClicked);
    connect(this, &InputPanel::signalInputBoxVisibleChanged, InputPanelSignalBus::instance(), &InputPanelSignalBus::signalInputBoxVisibleChanged);
    connect(this, &InputPanel::signalSidebarVisibleChanged, InputPanelSignalBus::instance(), &InputPanelSignalBus::signalSidebarVisibleChanged);
    connect(this, &InputPanel::signalLoginBtnClicked, InputPanelSignalBus::instance(), &InputPanelSignalBus::signalLoginBtnClicked);
    connect(this, &InputPanel::signalNewChatBtnClicked, InputPanelSignalBus::instance(), &InputPanelSignalBus::signalNewChatBtnClicked);
    connect(this, &InputPanel::signalQuestionUpBtnClicked, InputPanelSignalBus::instance(), &InputPanelSignalBus::signalQuestionUpBtnClicked);
    connect(this, &InputPanel::signalQuestionDownBtnClicked, InputPanelSignalBus::instance(), &InputPanelSignalBus::signalQuestionDownBtnClicked);
    connect(this, &InputPanel::signalAddImageBtnClicked, InputPanelSignalBus::instance(), &InputPanelSignalBus::signalAddImageBtnClicked);
    connect(this, &InputPanel::signalAddFileBtnClicked, InputPanelSignalBus::instance(), &InputPanelSignalBus::signalAddFileBtnClicked);

    connect(InputPanelSignalBus::instance(), &InputPanelSignalBus::signalInputPanelStatusRequested, this, &InputPanel::slotInputPanelStatusRequested);
    connect(this, &InputPanel::signalInputPanelStatusUpdated, InputPanelSignalBus::instance(), &InputPanelSignalBus::signalInputPanelStatusUpdated);

    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalOnlineViewCreated, this, &InputPanel::slotOnlineViewCreated);
    connect(SidebarSignalBus::instance(), &SidebarSignalBus::signalOnlineViewDestroyed, this, &InputPanel::slotOnlineViewDestroyed);
}

void InputPanel::retranslateUi()
{
    mTextEdit->setPlaceholderText(tr("Ask anything to OneChat...") + "\n" + tr("CTRL+ENTER to next line."));

    mSendMsgBtn->setToolTip(tr("send question"));
    mShowInputBtn->setToolTip(tr("show/hide input panel"));
    mSidebarUnfoldBtn->setToolTip(tr("expand/collapse sidebar"));
    mLoginBtn->setToolTip(tr("login"));
    mAddImageBtn->setToolTip(tr("upload image"));
    mAddFileBtn->setToolTip(tr("upload file"));
    mChatNewBtn->setToolTip(tr("new conversation"));
    mQuestionUpBtn->setToolTip(tr("previous question"));
    mQuestionDownBtn->setToolTip(tr("next question"));

    mSendToLbl->setText(tr("Send to: "));
}

void InputPanel::resetSendToCbbModel()
{
    mSendToCbbModel->clear();

    QStandardItem *selectAllItem = new QStandardItem(tr("All Tabs"));
    selectAllItem->setCheckable(true);
    selectAllItem->setCheckState(Qt::Checked);
    mSendToCbbModel->appendRow(selectAllItem);
}

void InputPanel::updateSendToCbbModelState(QStandardItem *item)
{
    if (item != nullptr && item->row() == 0) {
        Qt::CheckState state = item->checkState();
        for (int i = 1; i < mSendToCbbModel->rowCount(); ++i) {
            mSendToCbbModel->item(i)->setCheckState(state);
        }
        if (state == Qt::Checked) {
            mSendToCbb->lineEdit()->setText(tr("All Tabs"));
        } else {
            mSendToCbb->lineEdit()->setText(tr("No Tabs"));
        }
    } else {
        // 普通项变化 → 更新全选状态
        bool allChecked = true;
        QStringList modelList;
        for (int i = 1; i < mSendToCbbModel->rowCount(); ++i) {
            if (mSendToCbbModel->item(i)->checkState() == Qt::Checked) {
                modelList.append(mSendToCbbModel->item(i)->text());
            } else {
                allChecked = false;
            }
        }
        mSendToCbbModel->item(0)->setCheckState(allChecked ? Qt::Checked : Qt::Unchecked);
        if (allChecked) {
            mSendToCbb->lineEdit()->setText(tr("All Tabs"));
        } else if (modelList.length() > 0) {
            mSendToCbb->lineEdit()->setText(modelList.join(","));
        } else {
            mSendToCbb->lineEdit()->setText(tr("No Tabs"));
        }
    }
    mSendToCbb->setToolTip(mSendToCbb->currentText());

    mSendToModelList.clear();
    for(int i = 1; i < mSendToCbbModel->rowCount(); i++)
    {
        QStandardItem *item = mSendToCbbModel->item(i);
        if (item->checkState() == Qt::Checked) {
            mSendToModelList.append(item->data().toString());
        }
    }
}
