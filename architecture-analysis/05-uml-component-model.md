# Modelo de componentes

Se agrupan responsabilidades detrás de contratos, no una clase, tabla o carpeta por componente. CMP-ARTIFACTS reúne validación y reconstrucción determinista. CMP-PERSISTENCE conserva evidencia y coordina estados, proporciona IF-RUNSTORE y requiere IF-ARTIFACTS e IF-POSTGRES.

EXT-POSTGRES es un proveedor externo. ART-MIGRATION manifiesta las restricciones de almacenamiento de CMP-PERSISTENCE; las seis tablas son entidades del esquema, no componentes UML. Las relaciones provided-interface y required-interface del JSON fijan la dirección sin inventar puertos ni conectores de delegación. No hay ensamblaje con un consumidor productivo existente.

La vista VIEW-S1B basta para el alcance. [architecture-model.json](architecture-model.json) contiene los identificadores y evidencias. El [diagrama de entidades](../docs/research-ai/S1B-DESIGN.md) es una vista de datos complementaria, no un diagrama UML de componentes. Frontend, proveedores LLM y revisión profesional se excluyen por falta de implementación en S1B.
