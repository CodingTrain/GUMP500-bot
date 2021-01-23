const express = require("express");
const Twitter = require("twitter-lite");
const dotenv = require("dotenv");
const fs = require("fs");
const metric = require("./helpers/metric");
const { MongoClient } = require("mongodb");

// Get environment variables from .env for Twitter/MongoDB creds
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_CONNECTION_URI);
let runnersDB;

connectDB().catch(console.error);

async function connectDB() {
  try {
    // Connect to the MongoDB cluster
    await mongoClient.connect();
    // Make the appropriate DB calls
    // databasesList = await mongoClient.db().admin().listDatabases();
    // databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
    runnersDB = mongoClient.db("GUMP500").collection("people");
    const all = await getRunners();
    console.log(`There are ${all.length} database entries`);
  } catch (e) {
    console.error(`MongoDB connection error: ${e}`);
  } finally {
    // await mongoClient.close();
  }
}

// Return all runners from datbase as an array
async function getRunners() {
  // await mongoClient.connect();
  // runnersDB = mongoClient.db("GUMP500").collection("people");
  const cursor = runnersDB.find();
  const all = await cursor.toArray();
  return all;
}

// Add runner to database and add their distance or
// update an existing runner's distance
async function updateDatabase(name, created_at, miles, isTotal) {
  // Check if runner is already in database (has previously submitted distance)
  const found = await runnersDB.findOne({ name });
  if (found) {
    if (!isTotal) {
      console.log(`Existing runner ${found}`);
      // Store new run information in runner's database entry history
      found.history.push({ created_at, miles });
      // Update runner's total miles ran
      found.total += miles;
    } else {
      found.total = miles;
    }
    // Update database with new data
    const updated = await runnersDB.updateOne({ name }, { $set: found });
    console.log(
      `${updated.matchedCount} document(s) matched the query criteria.`
    );
    console.log(`${updated.modifiedCount} document(s) was/were updated.`);
    return found;
  } else {
    console.log(`New runner '${name}'`);
    // Create data structure for the new runner with their display name
    // and distance ran, and update history database entry accordingly
    const newRunner = {
      name,
      history: [{ created_at, miles }],
      total: miles,
    };
    // Insert new entry into database
    const added = await runnersDB.insertOne(newRunner);
    console.log(
      `New runner created with the following id: ${added.insertedId}`
    );
    return newRunner;
  }
}

console.log("hello twitter! 🤖");

// Twitter creds and settings (generally doesn't need to be touched)
// as creds are set in .env file (see env-sample)
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
  // Ensure that tweet contains distance information (i.e. km, mile, mi, etc)
  const regex = /(\d+\.?\d*)\s*(kilometer[s]?|km|mi(le[s]?)?)/i;
  const { created_at, user, text } = data;
  const name = user.screen_name;
  console.log(`New Tweet from ${name}: ${text}`);
  let match = text.match(regex);

  if (match) {
    let miles = parseFloat(match[1]);
    //Check if kilometers were passed and convert to miles
    if (["km", "kilometer", "kilometers"].indexOf(match[2]) != -1) {
      miles = metric.kmToMiles(miles);
    }
    //Round to 2 digits after the comma
    miles = Math.round((miles + Number.EPSILON) * 100) / 100;

    const isTotal = /set total/i.test(text);
    const updated = await updateDatabase(name, created_at, miles, isTotal);

    return { name, created_at, miles, updated, isTotal };
  }
}

// Listen for new tweets that contain the #GUMP500 keyword and run newTweet()
const stream = twitter
  .stream("statuses/filter", parameters)
  .on("start", (response) => console.log("Twitter data stram started"))
  .on("data", newTweet)
  // .on("ping", () => console.log("ping"))
  .on("error", (error) => console.log("error", error))
  .on("end", (response) => console.log("end"));

// twitter
//   .get("account/verify_credentials")
//   .then((results) => {
//     console.log("results", results);
//   })
//   .catch(console.error);

const config = {
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  token: process.env.TWITTER_ACCESS_TOKEN,
  token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  env: process.env.TWITTER_WEBHOOK_ENV,
  ngrok: process.env.NGROK_AUTH_TOKEN,
};

// For testing in this repo
const ChooChooTweets = require("choochootweets");
const a2zitp = new ChooChooTweets(config);

start();
async function start() {
  console.log("listening");
  let webhookURL;
  if (process.env.PROJECT_DOMAIN) {
    webhookURL = `https://${process.env.PROJECT_DOMAIN}.glitch.me/webhook`;
  }
  await a2zitp.initActivity(tweetHandler, webhookURL);
}

async function tweetHandler(for_user_id, tweet) {
  const { user, id_str } = tweet;
  if (user.id_str !== for_user_id) {
    const results = await newTweet(tweet);
    if (results) {
      console.log(results);
      let reply_txt;
      if (results.isTotal) {
        reply_txt = `Wow! I have set your total miles to ${results.miles} miles!`;
      } else {
        reply_txt = `Great job! Your run of ${results.miles} miles has been logged! Your total is now ${results.updated.total} miles!`;
      }
      await a2zitp.reply(id_str, reply_txt);
    } else {
      await a2zitp.reply(id_str, `So sorry, I was not able to log any miles!`);
    }
  }
}
