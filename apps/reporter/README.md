# Reporter

Responsible for feeding back a diagnosis to a communication channel of choice.
Receiving the diagnosis ID via queue message it's simple for it to begin a notification job through Captain which will have communication channel specific implementations.
