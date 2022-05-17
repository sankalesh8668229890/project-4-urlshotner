const urlModel = require("../model/urlModel")
const validUrl = require('valid-url');
const shortid = require('shortid');


const baseUrl = 'http://localhost:3000'

const CreateShortUrl = async function (req, res) {
    try {
        let body = req.body
        let longUrl = body.longUrl.toLowerCase()


        if (Object.keys(body).length === 0) {
            return res.status(400).send({ status: false, message: "Please enter the data" })
        }
        if (!body.longUrl) {
            return res.status(400).send({ status: false, message: "Please enter the URL" })
        }
        if (!validUrl.isUri(body.longUrl)) {
            console.log('Looks like not a valid URL');
            return res.status(400).send({ status: false, message: "Looks like not a valid URL" })
        }

        let FindUrl = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })

        if (FindUrl) {
            return res.status(400).send({ status: true, data: FindUrl })
        }
        const urlCode = shortid.generate()
        let shortUrl = baseUrl + '/' + urlCode

        url = { longUrl, shortUrl, urlCode }

        let createShort = await urlModel.create(url)

        let ShowUrl = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })

        return res.status(201).send({ Status: true, data: ShowUrl })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

const getUrl = async function(req, res){
    try{
        // url which comes in params 
        let urlCode = req.params.urlCode
        let url = await urlModel.findOne({ urlCode : urlCode });
        if (!url){ return res.status(400).send({status:false , message:'please enter url'})}
        else{return res.status(200).send({status:true,data:url})}
    }
    catch(error){res.status(500).send({status:false, message:error.message})}
    }

module.exports = { CreateShortUrl,getUrl }