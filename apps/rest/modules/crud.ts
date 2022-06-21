import { Condition } from "node-cosmos";
import { Database } from "../clients/db";

const defaultCondition: { sort: [string, string] } = {
  sort: ["id", "DESC"],
};

const removeMansionSecrets = (mansion) => ({
  ...mansion,
  connectionString: "",
  storageConnectionString: "",
});

type ListResult = { items: unknown[]; total: number };

export const getList = async (
  db: Database,
  partition: string,
  condition: Condition
): Promise<ListResult> => {
  const items = await db.find(partition, {
    ...defaultCondition,
    ...condition,
  });
  const total = await db.count(partition, {
    ...defaultCondition,
    ...condition,
  });

  return {
    items,
    total,
  };
};
