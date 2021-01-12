const factor = 1.609344;

export default {
    milesToKm: (miles) => miles / factor,
    kmToMiles: (km) => km * factor
}