require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { URL, parse } = require('url');

const Schema = mongoose.Schema;
const app = express();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const shortUrlSchema = new Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    required: true
  }
});

const stringIsAValidUrl = (s, protocols) => {
  try {
    new URL(s);
    const parsed = parse(s);
    return protocols
        ? parsed.protocol
        ? protocols.map(x => `${x.toLowerCase()}:`).includes(parsed.protocol)
          : false
          : true;
  } catch (err) {
      return false;
  }
};

const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body['url'];

  if (!stringIsAValidUrl(originalUrl, ['http', 'https', 'fpt'])) {
    res.send({error: "invalid url"});
  } else {
    ShortUrl.findOne({original_url: originalUrl}, {_id: 0, __v:0}, (error, result) => {
      if (result) {
        res.send(result);
      } else {
        ShortUrl.count((error, result)=> {
          const record = {
            original_url: originalUrl,
            short_url: result + 1
          };
          ShortUrl(record).save();
          res.send(record);
        });
      }
    });
  }
});


app.get('/api/shortUrl/:shortUrl', (req, res) => {
  const shortUrl = req.params.shortUrl;
  ShortUrl.findOne({short_url: shortUrl}, {__id: 0, __v: 0}, (error, result) => {
    if (result) {
      res.redirect(result.original_url);
    } else {
      res.send({"error":"No short URL found for the given input"});
    }
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
