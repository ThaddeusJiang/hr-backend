# Overview:
# Step1: setup Cosmos DB
# Step2: setup Function App
# --------------------------------------------------
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=2.46.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "dev" {
  name     = "hr-dev"
  location = "Japan East"
}

# Step1: setup Cosmos DB
resource "azurerm_cosmosdb_account" "dev" {
  name                = "hr-dev"
  location            = azurerm_resource_group.dev.location
  resource_group_name = azurerm_resource_group.dev.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  enable_automatic_failover = true

  consistency_policy {
    consistency_level       = "BoundedStaleness"
    max_interval_in_seconds = 10
    max_staleness_prefix    = 200
  }

  geo_location {
    location          = azurerm_resource_group.dev.location
    failover_priority = 0
  }
}

resource "azurerm_cosmosdb_sql_database" "db" {
  name                = "dev"
  resource_group_name = azurerm_cosmosdb_account.dev.resource_group_name
  account_name        = azurerm_cosmosdb_account.dev.name
}

resource "azurerm_cosmosdb_sql_container" "container" {
  name                  = "Data_01"
  resource_group_name   = azurerm_cosmosdb_account.dev.resource_group_name
  account_name          = azurerm_cosmosdb_account.dev.name
  database_name         = azurerm_cosmosdb_sql_database.db.name
  partition_key_path    = "/_partition"
  partition_key_version = 1
  default_ttl           = -1

  autoscale_settings {
    max_throughput = 4000
  }

  indexing_policy {
    indexing_mode = "Consistent"

    included_path {
      path = "/*"
    }
  }
}

# Step2: setup Function App
resource "azurerm_storage_account" "dev" {
  name                     = "hrfunctionsdev"
  resource_group_name      = azurerm_resource_group.dev.name
  location                 = azurerm_resource_group.dev.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_app_service_plan" "dev" {
  name                = "hr-functions-dev"
  location            = azurerm_resource_group.dev.location
  resource_group_name = azurerm_resource_group.dev.name
  kind                = "Linux"
  reserved            = true

  sku {
    tier = "Dynamic"
    size = "Y1"
  }
}

resource "azurerm_function_app" "dev" {
  name                       = "hr-api-dev"
  location                   = azurerm_resource_group.dev.location
  resource_group_name        = azurerm_resource_group.dev.name
  app_service_plan_id        = azurerm_app_service_plan.dev.id
  storage_account_name       = azurerm_storage_account.dev.name
  storage_account_access_key = azurerm_storage_account.dev.primary_access_key
  os_type                    = "linux"
  version                    = "~3"
}
