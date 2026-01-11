#include "inputtextedit.h"
#include <QKeyEvent>
#include <QMimeData>

InputTextEdit::InputTextEdit(QWidget *parent)
    : QTextEdit(parent)
{

}

void InputTextEdit::keyPressEvent(QKeyEvent *event)
{

    if (event->key() == Qt::Key_Return && event->modifiers() == Qt::ControlModifier)
    {
        insertPlainText("\n");
    }
    else if (event->key() == Qt::Key_Return)
    {
        emit signalInputTextFinished();
    }
    else
    {
        QTextEdit::keyPressEvent(event);
    }
}

void InputTextEdit::insertFromMimeData(const QMimeData *source)
{
    if (source->hasText()) {
        // remove HTML/rich text
        insertPlainText(source->text());
    }
}
