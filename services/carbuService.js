import { useGeolocationAndScrape } from '../scrapeCarbu.js'

export const getStations = async (fuel, lat, lng) => {
  const stations = await useGeolocationAndScrape(fuel, lat, lng)
  return stations
}
