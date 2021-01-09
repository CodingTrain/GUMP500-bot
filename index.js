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
  const regex = /(\d+\.?\d*)\s*miles?/i;
  const { created_at, user, text } = data;
  const name = user.screen_name;
  console.log(`${name}: ${text}`);
  let match = text.match(regex);

  if (match) {
    const miles = parseFloat(match[1]);
    const currentUser = database.people[name];

    if (currentUser) {
      currentUser.history = {
        ...currentUser.history,
        [created_at]: miles,
      };
      currentUser.total += miles;
    } else {
      const schema = {
        history: {
          [created_at]: miles,
        },
        total: miles,
      };
      database.people[name] = schema;
    }
    //database.people[name] = miles;
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
