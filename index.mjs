import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import axios from 'axios'
import log4js from 'log4js'
import { exit } from 'node:process'
import * as fs from 'node:fs'
import 'dotenv/config'

const date = new Date();

if(!fs.existsSync("logs")) {
  fs.mkdirSync("logs")
} else {
  let pathStat = await fs.statSync("logs")
  if (!pathStat.isDirectory()) {
    console.log("./logs should be a directory! Exiting.")
    exit(1)
  }
}

log4js.configure({
  appenders: { file: { type: "file", filename: "logs/logs-"+date.toISOString()+".log" },
              console: { type: "console" } },
  categories: { default: { appenders: ["file", "console"], level: "debug" } },
});

const logger = log4js.getLogger();

const app = new express()

const dmca = (await axios.get("https://raw.githubusercontent.com/dtubego/dmca/refs/heads/master/dmca.json")).data

app.use(cors())
app.use(bodyParser.json())

const bannedTXs = [0,3,4,24,28,5,19,13]
const AVALON_API = process.env.AVALON_API || "http://127.0.0.1:3001"
const BLOCK_DOWNVOTES = process.env.BLOCK_DOWNVOTES == '1' || (typeof process.env.BLOCK_DOWNVOTES === 'string' && process.env.BLOCK_DOWNVOTES.toLowerCase() == 'true') || false
const PORT = parseInt(process.env.HTTP_PORT) || 3110

app.post('/transact', async (req, res) => {
    let body = req.body
    if (dmca.authors.includes(body.sender) && bannedTXs.includes(body.type)) {
        logger.info("Blocked tx:", body)
        res.status(500).send({ error: "invalid tx data" })
    } else if (body.type == 5 && BLOCK_DOWNVOTES && body.data.vt < 0) {
        logger.info("Blocked tx:", body)
        res.status(500).send({ error: "invalid tx data" })
    } else {
        try {
            let result = (await axios.post(AVALON_API+"/transact", body)).data
            res.json(result)
        } catch(e) {
            logger.error(e.toString())
            res.status(500).send({error: "unknown"})
        }
    }
})

app.listen(PORT, () => {
    logger.info("Now listening on", PORT, "and redirecting to", AVALON_API)
});
