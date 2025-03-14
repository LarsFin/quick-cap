# Captain

Defines and implements a protocol by which 'Jobs' can be taken from a queue and used to run a Docker container.
Input and output to and from the container is completed using mounted id pathed files.
Queues are the preferred instruction mechanism due to their easily retryable capabilities.
