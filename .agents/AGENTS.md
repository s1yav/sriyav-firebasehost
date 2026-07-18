# Behavioural Rules

* **Pulumi Resource Aliases:** Never create or use resource aliases (`aliases: [...]`) in Pulumi code under any circumstances, even when renaming resources, components, or parent types. Let Pulumi delete and recreate resources naturally if their URNs change.
