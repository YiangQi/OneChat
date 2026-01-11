#ifndef OSPLITTERHANDLE_H
#define OSPLITTERHANDLE_H

#include <QSplitterHandle>

class OSplitterHandle : public QSplitterHandle
{
    Q_OBJECT
public:
    OSplitterHandle(Qt::Orientation orientation, QSplitter *parent);

protected:
    void paintEvent(QPaintEvent *event) override;
};

#endif // OSPLITTERHANDLE_H
