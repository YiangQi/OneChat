#ifndef INPUTTEXTEDIT_H
#define INPUTTEXTEDIT_H

#include <QTextEdit>

class InputTextEdit : public QTextEdit
{
    Q_OBJECT
public:
    explicit InputTextEdit(QWidget *parent = nullptr);
signals:
    void signalInputTextFinished();
protected:
    void keyPressEvent(QKeyEvent *event) override;
    void insertFromMimeData(const QMimeData *source) override;
};

#endif // INPUTTEXTEDIT_H
