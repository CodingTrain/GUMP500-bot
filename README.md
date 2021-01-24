# GUMP500

GUMP500 is a Twitter bot that tracks people's achievements in the Forrest Gump 500 challenge. The bot scours for tweets containing the `#Gump500` and a number followed by `mi`, `mile(s)`, `km` or `kilometer(s)`. It collects the data and displays it on a webpage.

### Data API: https://gump500-api.glitch.me/api


## Contributing

Pull requests are welcome. For major changes, please open an issue to discuss what you would like to change.

### Set up your local environment

1. Copy the env-sample file into a `.env` file
2. Run `npm install`
1. The project uses MongoDB as a database. To develop and test localy, you'll need one.
   The easiest solution is to register a free account on [MongoDB](https://www.mongodb.com/) and start a free cloud server (M0 shared cluster).
   Once you've done that, all you need to do is change the `MONGO_CONNECTION_URI` variable in the `.env` file
1. You need to have a Twitter API Key to be able to fetch the tweets with hashtag `#GUMP500` (if you want to test this functionality). In order to get this, you first need an [approved developer account](https://developer.twitter.com/en/portal/dashboard).
   Once you have that, just create a new app, generate your tokens, put them in the `.env` file, and off you go!


## License
[MIT](https://choosealicense.com/licenses/mit/)
