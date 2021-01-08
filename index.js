const express = require("express");
const Twitter = require("twitter-lite");
const dotenv = require("dotenv");
const fs = require("fs");

const exists = fs.existsSync("miles.json");
let database = { people: {} };
if (exists) {
  const data = fs.readFileSync("miles.json", "utf-8");
  database = JSON.parse(data);
}

const app = express();
app.listen(3000, () => console.log("listening at 3000"));
app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));

dotenv.config();
console.log("hello search! 🤖");

const client = new Twitter({
  subdomain: "api", // "api" is the default (change for other subdomains)
  version: "1.1", // version "1.1" is the default (change for other subdomains)
  consumer_key: process.env.CONSUMER_KEY, // from Twitter.
  consumer_secret: process.env.CONSUMER_SECRET, // from Twitter.
  access_token_key: process.env.TOKEN, // from your User (oauth_token)
  access_token_secret: process.env.TOKEN_SECRET, // from your User (oauth_token_secret)
});

const parameters = {
  track: "#GUMP500",
};

async function newTweet(data) {
  // console.log(data);
  const regex = /(\d+)\s*miles/i;
  const { user, text } = data;
  const name = user.screen_name;
  console.log(`${name}: ${text}`);
  let match = text.match(regex);
  if (match) {
    let miles = parseInt(match[1]);
    database.people[name] = miles;
    fs.writeFileSync("miles.json", JSON.stringify(database, null, 2));
  }
}

const stream = client
  .stream("statuses/filter", parameters)
  .on("start", (response) => console.log("start"))
  .on("data", newTweet)
  .on("ping", () => console.log("ping"))
  .on("error", (error) => console.log("error", error))
  .on("end", (response) => console.log("end"));

// client
//   .get("account/verify_credentials")
//   .then((results) => {
//     console.log("results", results);
//   })
//   .catch(console.error);

app.get("/api", (request, response) => {
  response.json(database);
});
