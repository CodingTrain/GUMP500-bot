const express = require("express");
const Twitter = require("twitter-lite");
const dotenv = require("dotenv");
const fs = require("fs");
const metric = require("./helpers/metric");
const { MongoClient } = require("mongodb");

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_CONNECTION_URI);
let runnersDB;

connectDB().catch(console.error);

async function connectDB() {
  try {
    // Connect to the MongoDB cluster
    await mongoClient.connect();
    // Make the appropriate DB calls
    databasesList = await mongoClient.db().admin().listDatabases();
    databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
    runnersDB = mongoClient.db("GUMP500").collection("people");
    const all = await getRunners();
    console.log(all.length);
  } catch (e) {
    console.error(e);
  } finally {
    // await mongoClient.close();
  }
}

async function getRunners() {
  // await mongoClient.connect();
  // runnersDB = mongoClient.db("GUMP500").collection("people");
  const cursor = runnersDB.find();
  const all = await cursor.toArray();
  return all;
}

async function updateDatabase(name, created_at, miles) {
  const found = await runnersDB.findOne({ name });
  if (found) {
    console.log(found);
    found.history.push({ created_at, miles });
    found.total += miles;
    const updated = await runnersDB.updateOne({ name }, { $set: found });
    console.log(`${updated.matchedCount} document(s) matched the query criteria.`);
    console.log(`${updated.modifiedCount} document(s) was/were updated.`);
  } else {
    console.log(`New runner '${name}'`);
    const newRunner = {
      name,
      history: [{ created_at, miles }],
      total: miles,
    };
    const added = await runnersDB.insertOne(newRunner);
    console.log(`New runner created with the following id: ${added.insertedId}`);
  }
}

const app = express();
app.listen(3000, () => console.log("listening at 3000"));
app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));

app.get("/api", async (request, response) => {
  // const cursor = runnersDB.find();
  // const all = await cursor.toArray();
  const all = await getRunners();
  console.log(all);
  response.json(all);
});

console.log("hello search! 🤖");

const twitter = new Twitter({
  subdomain: "api", // "api" is the default (change for other subdomains)
  version: "1.1", // version "1.1" is the default (change for other subdomains)
  consumer_key: process.env.TWITTER_CONSUMER_KEY, // from Twitter.
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET, // from Twitter.
  access_token_key: process.env.TWITTER_ACCESS_TOKEN, // from your User (oauth_token)
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET, // from your User (oauth_token_secret)
});

const parameters = {
  track: "#GUMP500",
};

async function newTweet(data) {
  // console.log(data);
  const regex = /(\d+\.?\d*)\s*(kilometer[s]?|km|mi(le[s]?)?)/i;
  const { created_at, user, text } = data;
  const name = user.screen_name;
  console.log(`${name}: ${text}`);
  let match = text.match(regex);

  if (match) {
    let miles = parseFloat(match[1]);
    //Check if kilometers were passed and convert to miles
    if (['km','kilometer','kilometers'].indexOf(match[2]) != -1) {
      miles = metric.kmToMiles(miles);
    }
    //Round to 2 digits after the comma
    miles = Math.round((miles + Number.EPSILON) * 100) / 100;
    await updateDatabase(name, created_at, miles);
  }
}

const stream = twitter
  .stream("statuses/filter", parameters)
  .on("start", (response) => console.log("start"))
  .on("data", newTweet)
  .on("ping", () => console.log("ping"))
  .on("error", (error) => console.log("error", error))
  .on("end", (response) => console.log("end"));

// twitter
//   .get("account/verify_credentials")
//   .then((results) => {
//     console.log("results", results);
//   })
//   .catch(console.error);
