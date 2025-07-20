process.env.PUPPETEER_CACHE_DIR = process.env.PUPPETEER_CACHE_DIR || '/opt/render/.cache/puppeteer'
process.env.PUPPETEER_EXECUTABLE_PATH = process.env.CHROME_EXECUTABLE_PATH

import puppeteer from 'puppeteer-core'
import fetch from 'node-fetch'

// 🗺️ Mini cache pour éviter les appels multiples
const geocodeCache = new Map()

async function geocodeAddress(address) {
  if (!address) return null
  if (geocodeCache.has(address)) return geocodeCache.get(address)

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'FuelApp/1.0 (contact@fuelapp.local)'
      }
    })

    const data = await res.json()
    if (data.length > 0) {
      const coords = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      }
      geocodeCache.set(address, coords)
      return coords
    } else {
      console.warn(`❗ Pas de résultat pour : ${address}`)
    }
  } catch (err) {
    console.warn(`❌ Erreur géocodage (${address}) :`, err.message)
  }

  return null
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

const useGeolocationAndScrape = async (fuel = 'E10', lat= 50.4561664, lng = 3.964928) => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=egl',
      '--disable-dev-shm-usage'
    ],
    defaultViewport: null
  })

  const page = await browser.newPage()
  const context = browser.defaultBrowserContext()
  await context.overridePermissions('https://www.carbu.com', ['geolocation'])

  // 🧭 Simuler la géolocalisation à Mons
  await page.evaluateOnNewDocument((lat, lng) => {
    navigator.geolocation.getCurrentPosition = function (success) {
      success({
        coords: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          accuracy: 100
        }
      })
    }
  }, lat, lng)


  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36'
    )

    console.log("🔍 Ouverture de la page Carbu.com")
    await page.goto('https://www.carbu.com/belgique', { waitUntil: 'domcontentloaded' })
    await delay(3000)

    // ✅ Popup cookies Sirdata
    try {
      await page.waitForSelector('span.sd-cmp-3_LLS', { timeout: 7000 })
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('span.sd-cmp-3_LLS')]
          .find(b => b.innerText.includes('Accept'))
        if (btn) btn.closest('button').click()
      })
      console.log("✅ Popup Sirdata accepté")
      await delay(1000)
    } catch {
      console.log("ℹ️ Aucun popup Sirdata détecté")
    }

    // ✅ Sélection du carburant
    console.log(`🔄 Sélection du carburant : ${fuel}`)

    await page.evaluate((fuel) => {
      const select = document.querySelector('#selectProduct_station')
      if (select) {
        select.value = fuel
        // Simule l'événement "change" pour déclencher le traitement du site
        const event = new Event('change', { bubbles: true })
        select.dispatchEvent(event)
        // Met aussi à jour le localStorage
        localStorage.setItem('selectProduct_station', fuel)
      }
    }, fuel)

    await delay(1000)

    // ✅ Clic sur "Comparez"
    console.log("🟢 Clic sur 'Comparez'")
    await page.click('#submitButton_station')
    await delay(4000)

    // 📥 Extraction des résultats
    console.log("⏳ Recherche des stations...")
    await page.waitForSelector('.stationItem, .alert-danger, .no-station-found', { timeout: 25000 })

    const stations = await page.evaluate(() => {
    const elements = document.querySelectorAll('.stationItem')
    const results = []

    elements.forEach((el) => {
      const name = el.dataset.name || ''
      const price = el.dataset.price || ''
      const address = el.dataset.address
        ? el.dataset.address.replace(/<br\/?>/gi, ', ').trim()
        : ''
      const fuel = el.dataset.fuelname || ''
      const distance = el.dataset.distance
        ? parseFloat(el.dataset.distance).toFixed(2) + ' km'
        : ''
      const link = el.dataset.link || ''
      const logo = el.dataset.logo
        ? 'https://carbucomstatic-5141.kxcdn.com//brandLogo/' + el.dataset.logo
        : null

      results.push({ name, fuel, price, address, distance, link, logo })
    })

    return results
  })

  // ✅ Garder uniquement les 20 moins chères
  stations.forEach(s => {
    const priceNum = parseFloat(s.price.replace(',', '.'))
    s._priceNum = isNaN(priceNum) ? Infinity : priceNum
  })

  stations.sort((a, b) => a._priceNum - b._priceNum)
  const top20 = stations.slice(0, 20)

  // 🌍 Géocoder uniquement ces 20
  for (const station of top20) {
    const coords = await geocodeAddress(station.address)
    if (coords) {
      station.latitude = coords.latitude
      station.longitude = coords.longitude
    }
    await delay(500)
  }

  await browser.close()
  return top20.map(({ _priceNum, ...s }) => s)

  } catch (err) {
    console.error("❌ Erreur lors du scraping :", err)
    await browser.close()
    return []
  }
}

export { useGeolocationAndScrape }
