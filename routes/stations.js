import express from 'express'
import { getStations } from '../services/carbuService.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const { fuel, lat, lng } = req.query
  console.log('📩 Requête reçue avec :', { fuel, lat, lng })

  try {
    const stations = await getStations(fuel, lat, lng)
    res.json(stations)
  } catch (error) {
    console.error('❌ Erreur dans la route /stations :', error)
    res.status(500).json({ error: 'Erreur interne' })
  }
})

export default router
