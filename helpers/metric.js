const factor = 1.609344;

module.exports = {
    milesToKm: (miles) => miles * factor,
    kmToMiles: (km) => km / factor
}