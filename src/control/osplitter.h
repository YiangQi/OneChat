#ifndef OSPLITTER_H
#define OSPLITTER_H

#include <QSplitter>

class OSplitter : public QSplitter
{
    Q_OBJECT
public:
    OSplitter(QWidget *parent = nullptr);
    OSplitter(Qt::Orientation orientation, QWidget *parent = nullptr);
protected:
    QSplitterHandle *createHandle() override;
};

#endif // OSPLITTER_H
