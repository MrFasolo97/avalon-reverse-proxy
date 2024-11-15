import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import axios from 'axios'


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
        console.log("Blocked tx:")
        console.log(body)
        res.status(500).send({ error: "invalid tx data" })
    } else if (body.type == 5 && BLOCK_DOWNVOTES && body.data.vt < 0) {
        console.log("Blocked tx:")
        console.log(body)
        res.status(500).send({ error: "invalid tx data" })
    } else {
        let result = (await axios.post(AVALON_API+"/transact", body)).data
        res.json(result)
    }
})

app.listen(PORT);
