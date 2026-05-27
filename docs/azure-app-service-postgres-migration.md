# Migracion a Azure App Service con PostgreSQL existente

Este runbook asume que la base de datos destino en Azure ya contiene datos. En
conflictos, los datos existentes en Azure ganan y el merge no actualiza filas.

## 1. Backup y staging

1. Crear backup de la base Azure existente:

   ```bash
   pg_dump -Fc --no-owner --no-acl "$AZURE_DATABASE_URL" > azure-before-endure.dump
   ```

2. Crear una base staging vacia, por ejemplo `endure_migration_stage`.

3. Restaurar el dump local custom format en staging:

   ```bash
   pg_restore --no-owner --no-acl --dbname "$STAGING_DATABASE_URL" dump-endure-202605251307-ACTUAL.sql
   ```

## 2. Migraciones manuales

Las migraciones no deben correr automaticamente al arrancar App Service.
Ejecutarlas antes del despliegue:

```bash
npm run migration:show
npm run migration:run
npm run migration:show
```

Despues de `migration:run`, `migration:show` debe mostrar cero migraciones
pendientes. La migracion `1774000000000` es idempotente y debe quedar registrada
en la tabla `migrations`.

## 3. Auditoria y merge

Configurar origen staging y destino Azure con variables de entorno:

```bash
export DB_USE_AZURE=true

export SOURCE_DB_HOST=<staging-host>
export SOURCE_DB_PORT=5432
export SOURCE_DB_USERNAME=<staging-user>
export SOURCE_DB_PASSWORD=<staging-password>
export SOURCE_DB_DATABASE=endure_migration_stage
export SOURCE_DB_SSL=true

export AZURE_DB_HOST=<azure-host>
export AZURE_DB_PORT=5432
export AZURE_DB_USERNAME=<azure-user>
export AZURE_DB_PASSWORD=<azure-password>
export AZURE_DB_DATABASE=<azure-database>
export AZURE_DB_SSL=true
```

Si `TARGET_DB_*` existe, el script usa esos valores como destino. Si no existe,
usa el perfil seleccionado por `DB_USE_AZURE`. El selector acepta
`AZURE_DB_*` y tambien los alias existentes `DB_*_CLOUD`.

Ejecutar auditoria:

```bash
npm run db:merge:audit
```

Ejecutar dry-run:

```bash
npm run db:merge:dry-run
```

Ejecutar merge real solo si el reporte no contiene errores criticos:

```bash
npm run db:merge:run
```

El script excluye tablas temporales o sensibles:

```txt
refresh_tokens
email_verification_tokens
password_reset_tokens
social_auth_codes
push_tokens
migrations
```

Los reportes se escriben en `migration-reports/` y no incluyen valores de filas
ni datos personales.

## 4. App Service

Configurar App Settings o Key Vault references:

```txt
WEBSITES_PORT=3000
DB_USE_AZURE=true
AZURE_DB_HOST=<azure-host>
AZURE_DB_PORT=5432
AZURE_DB_USERNAME=<azure-user>
AZURE_DB_PASSWORD=<azure-password>
AZURE_DB_DATABASE=<azure-database>
AZURE_DB_SSL=true
DB_MIGRATIONS_RUN=false
```

Si ya existen `DB_HOST_CLOUD`, `DB_PORT_CLOUD`, `DB_USERNAME_CLOUD`,
`DB_PASSWORD_CLOUD` y `DB_DATABASE_CLOUD`, se pueden usar sin renombrarlos.

Validar primero en slot/staging o instancia de prueba. Confirmar `GET /`, login,
perfil, rutinas, historial, publicaciones y trainer verification antes de swap o
publicacion final.
