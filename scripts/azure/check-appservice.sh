#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="${1:-config/azure.dev.env}"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "No existe el archivo de configuración: $CONFIG_FILE"
  exit 1
fi

set -a
source "$CONFIG_FILE"
set +a

az account set --subscription "$AZURE_SUBSCRIPTION_ID"

echo "Validando App Service existente..."

az webapp show \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$AZURE_WEBAPP_NAME" \
  --query "{name:name,state:state,defaultHostName:defaultHostName,resourceGroup:resourceGroup,runtime:siteConfig.linuxFxVersion}" \
  --output table

echo ""
echo "URL: $AZURE_WEBAPP_URL"
