import { Condition, Cosmos, CosmosDatabase, CosmosDocument } from "node-cosmos";

const database = "dev";
const collection = "Data_01";

export class Database {
  // eslint-disable-next-line no-useless-constructor
  constructor(private db: CosmosDatabase) {}

  async find(partition: string, condition: Condition): Promise<unknown[]>;

  async find(
    partition: string,
    condition: Condition
  ): Promise<CosmosDocument[]> {
    const customers = await this.db.find(collection, condition, partition);
    return customers || [];
  }

  async count(partition: string, condition: Condition): Promise<number> {
    const total = await this.db.count(collection, condition, partition);
    return total;
  }

  async read(partition: string, id: string) {
    return this.db.read(collection, id, partition);
  }

  async upsert(partition: string, data: CosmosDocument): Promise<string> {
    await this.db.upsert(collection, data, partition);
    return data.id;
  }

  async update(partition: string, data: CosmosDocument): Promise<string> {
    await this.db.update(collection, data, partition);
    return data.id;
  }

  async remove(partition: string, id: string): Promise<string> {
    await this.db.delete(collection, id, partition);
    return id;
  }
}

export async function getDatabase(): Promise<Database> {
  const db = await new Cosmos(process.env.DB_CONNECTION_STRING).getDatabase(
    database
  );
  return new Database(db);
}
