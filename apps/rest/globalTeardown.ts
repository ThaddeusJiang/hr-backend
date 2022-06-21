import "dotenv/config";
import { Cosmos } from'node-cosmos';
import { DatabaseResponse } from "@azure/cosmos";

export default async function() {
  // maybe this id will be changed in the future
  const databaseId = "SmartCompany";
  // format: test400, test401, test402, ...
  const collectionId = process.env.CI ?
    `test${process.env.GITHUB_RUN_NUMBER}` :
    'local';

  const conf = {
    id: collectionId
  };

  const cosmosClient = await new Cosmos(process.env.DB_CONNECTION_STRING)
    .getDatabase(databaseId) as unknown as DatabaseResponse;

  const db = cosmosClient.database;
  /* 
   * only Container class can be used to delete container
   * https://docs.microsoft.com/en-us/javascript/api/@azure/cosmos/container?view=azure-node-latest#@azure-cosmos-container-delete
   */
  const { container } = await db.containers.createIfNotExists(conf);
  const { statusCode } = await container.delete();
  // should be 204
  console.log('statusCode', statusCode);
  console.log('collectionId', collectionId);
}
