/**
 * VACANCES V2.0 — liens directs de réservation (V1 guidée/affiliation, cf décision produit).
 * Uniquement des schémas d'URL publics et stables (paramètres de recherche documentés) —
 * jamais un slug de destination deviné qui casserait la page.
 */

export function googleFlightsUrl(depart: string, destination: string): string {
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(`Vols de ${depart} à ${destination}`)}`
}

export function bookingUrl(destination: string): string {
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`
}

export function googleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}
