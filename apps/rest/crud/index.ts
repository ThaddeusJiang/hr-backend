/* eslint-disable import/no-unresolved */
import {
  AzureFunction,
  Context,
  HttpRequest,
  HttpRequestQuery,
} from "@azure/functions";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import { getDatabase, Database } from "../clients/db";
import { getList } from "../modules/crud";

import { safeJSONparse } from "../utils/json";

const queryList = async (
  context: Context,
  db: Database,
  query: HttpRequestQuery,
  partition: string
): Promise<void> => {
  const condition = safeJSONparse(query.query, context.log.warn) ?? {};
  const { offset, limit } = condition;
  const { total, items } = await getList(db, partition, condition);

  const last = offset + limit > total ? total : offset + limit;

  context.res = {
    status: 200,
    headers: {
      "Access-Control-Expose-Headers": "Content-Range",
      "Content-Range": `${partition} ${offset}-${last}/${total}`,
    },
    body: items,
  };
};

const httpTrigger: AzureFunction = async function httpTrigger(
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function `crud` processed a request.");
  const { method, body, query } = req;
  const { partition, id } = context.bindingData;
  const db = await getDatabase();

  switch (method) {
    case "POST": {
      const uuid = uuidv4();
      await db.upsert(partition, {
        ...body,
        createdAt: dayjs().toISOString(),
        id: uuid,
      });
      context.res = {
        status: 201,
        body: uuid,
      };

      break;
    }
    case "GET": {
      if (id === undefined) {
        await queryList(context, db, query, partition);
      } else {
        const result = await db.read(partition, id);
        context.res = {
          status: 200,
          body: result,
        };
      }
      break;
    }
    case "PUT": {
      await db.update(partition, body);
      context.res = {
        status: 200,
      };
      break;
    }
    case "DELETE": {
      const result = await db.remove(partition, id);
      context.res = {
        status: 200,
        body: result,
      };
      break;
    }

    default: {
      context.res = {
        status: 405,
        body: `Method ${method} Not Allowed`,
      };
    }
  }
};

export default httpTrigger;
