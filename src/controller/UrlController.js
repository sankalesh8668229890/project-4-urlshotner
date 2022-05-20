const urlModel = require("../model/urlModel");
const validUrl = require("valid-url");
const shortid = require("shortid");
const redis = require("redis");
const { promisify } = require("util");

const redisClient = redis.createClient(
  15279,
  "redis-15279.c264.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);

redisClient.auth("RAWesVYJsQytMtRWAx9f86HWSHIh0bxj", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connect to Redis");
});

const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
const SETEX_ASYNC = promisify(redisClient.SETEX).bind(redisClient);

const CreateShortUrl = async function (req, res) {
  try {
    let body = req.body;
    let longUrl = body.longUrl

    if (Object.keys(body).length === 0) {
      return res.status(400).send({ status: false, message: "Please enter the data" });
    }

    if (!body.longUrl) {
      return res.status(400).send({ status: false, message: "Please enter the URL" });
    }

    if (!validUrl.isWebUri(body.longUrl)) {
     // console.log("Looks like not a valid URL");
      return res.status(400).send({ status: false, message: "Looks like not a valid URL" });
    }

    // let getUrl = await GET_ASYNC(`${body.longUrl}`);
    // let url = JSON.parse(getUrl);
    // if (url) {
    //   return res.status(200).send({ status: true, message: "success", data: url });
    // }

    let FindUrl = await urlModel.findOne({ longUrl: body.longUrl }); //.select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })

    if (FindUrl) {
    return res.status(400).send({ status: false, message: "this urlcode is already generated" });
    }
    const urlCode = shortid.generate().toLowerCase();

    const baseUrl = "http://localhost:3000";

    let shortUrl = baseUrl + "/" + urlCode;

    url = { longUrl, shortUrl, urlCode }
    // body.shortUrl = shortUrl;
    // body.urlCode = urlCode;

    await urlModel.create(url);

    let ShowUrl = await urlModel.findOne({ longUrl: body.longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });

    await SETEX_ASYNC(`${body.longUrl}`, 3600, JSON.stringify(ShowUrl));

    res.status(201).send({status: true,message: "URL create successfully",data: ShowUrl});

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

const GetUrl = async function (req, res) {
  try {
    let getLongUrl = await GET_ASYNC(`${req.params.urlCode}`);
    let url = JSON.parse(getLongUrl);
    if (url) {
      return res.status(307).redirect(url.longUrl);
    } 
    else {
      let getUrl = await urlModel.findOne({ urlCode: req.params.urlCode });
      if (!getUrl) {
        return res.status(404).send({ status: false, message: "Url-Code not found" });
      }

      await SETEX_ASYNC(`${req.params.urlCode}`, 3600, JSON.stringify(getUrl));
      return res.status(307).redirect(getUrl.longUrl);
    }
  }catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { CreateShortUrl, GetUrl };
