# Doctor

Using the diagnosis ID it can find all the context collected for a service.
It prepares a prompt with this context to receive a summary and diagnosis from an LLM solution using Anthropic's MCP.
Depending on the suggestion from the LLM, it is possible the doctor will queue another service to be diagnosed, this should be an idempotent check to prevent cyclic diagnosese.
