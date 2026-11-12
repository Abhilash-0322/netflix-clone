import { MongoClient, type Db, type Collection } from "mongodb";
import type {
  MyListItemDoc,
  ProfileDoc,
  ProgressDoc,
  RatingDoc,
  TitleDoc,
  UserDoc,
} from "./types";

const uri =
  process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/netflix?directConnection=true";

declare global {
  var __nfMongoClient: Promise<MongoClient> | undefined;
}

function clientPromise(): Promise<MongoClient> {
  if (!global.__nfMongoClient) {
    const client = new MongoClient(uri, { maxPoolSize: 10 });
    global.__nfMongoClient = client.connect();
  }
  return global.__nfMongoClient;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(process.env.MONGODB_DB ?? "netflix");
}

export async function titles(): Promise<Collection<TitleDoc>> {
  return (await getDb()).collection<TitleDoc>("titles");
}

export async function users(): Promise<Collection<UserDoc>> {
  return (await getDb()).collection<UserDoc>("users");
}

export async function profiles(): Promise<Collection<ProfileDoc>> {
  return (await getDb()).collection<ProfileDoc>("profiles");
}

export async function myList(): Promise<Collection<MyListItemDoc>> {
  return (await getDb()).collection<MyListItemDoc>("myList");
}

export async function progress(): Promise<Collection<ProgressDoc>> {
  return (await getDb()).collection<ProgressDoc>("progress");
}

export async function ratings(): Promise<Collection<RatingDoc>> {
  return (await getDb()).collection<RatingDoc>("ratings");
}
