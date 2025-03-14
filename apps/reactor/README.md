# Reactor

Handles an incident or diagnosis workflow. It should be designed so it can kick off a service diagnosis without necasserily requiring an incident.
It reads the service configuration for which a diagnosis should be performed, starting jobs for context collection through Captain.
Once all context jobs are completed, the Reactor will update the status of the diagnosis and forward the ID via a Queue to Doctor for completion of diagnosis.
