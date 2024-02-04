import { MongoClient, Db } from "mongodb";
import Settings from "../../settings.json";

let client: MongoClient | undefined;
let database: Db | undefined;

export const createMongo = async () => {
    if (client) {
        return [client, database] as const;
    }
    client = new MongoClient(Settings.mongoDb.address, {
        passphrase: Settings.mongoDb.password
    });
    await client.connect();
    database = client.db(Settings.mongoDb.dbName);
    return [client, database];
};

export const destroyMongo = async () => {
    client?.close();
    client = undefined;
    database = undefined;
};