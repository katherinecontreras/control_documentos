function stripDiacritics(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function onlyLettersAndNumbers(value) {
  return stripDiacritics(value).replace(/[^a-zA-Z0-9]/g, '')
}

export function generateUserPassword(nombre, apellido, year = 2026) {
  const n = onlyLettersAndNumbers(nombre).trim()
  const a = onlyLettersAndNumbers(apellido).trim()

  const firstLetter = n ? n[0].toUpperCase() : ''
  const lastName = a ? a.toLowerCase() : ''

  return `${firstLetter}${lastName}${year}`
}

