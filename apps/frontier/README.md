# Frontier

Receives a webhook request, looks up webhook integrations to understand what job should handle based on the path parameter.
It then puts all the webhook details including headers into a payload that will be handled by a potentially custom job (which should be responsible for authentication, validation and standardisation).
Frontier ensures a quick 200, faults internally or in payload structure are handled within Quick Cap's environment.
