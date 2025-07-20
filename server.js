// server.js
import express from 'express'
import cors from 'cors'
import stationsRoutes from './routes/stations.js'



const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/stations', stationsRoutes)

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`)
})
