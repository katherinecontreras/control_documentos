function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
}

export function getRoleName(userData) {
  return userData?.roles?.nombre_rol || ''
}

export function getRoleKey(userData) {
  const r = normalizeText(getRoleName(userData))
  if (r === 'administrador') return 'admin'
  if (r === 'coordinador') return 'coordinador'

  // Variantes comunes para "Control documentacion"
  if (
    r === 'control documentacion' ||
    r === 'control de documentacion' ||
    r === 'control-documentacion' ||
    r === 'control_documentacion'
  ) {
    return 'control_doc'
  }

  // Variantes comunes para "Trabajador común"
  if (
    r === 'trabajador' ||
    r === 'trabajador comun' ||
    r === 'trabajador común' ||
    r === 'proyectista'
  ) {
    return 'trabajador'
  }

  return r || 'unknown'
}

export function isAdmin(userData) {
  return getRoleKey(userData) === 'admin'
}

export function canAccessUsersPage(userData) {
  return isAdmin(userData)
}

export function canViewAllDocuments(userData) {
  const k = getRoleKey(userData)
  return k === 'admin' || k === 'coordinador' || k === 'control_doc'
}

export function canUploadDocuments(userData) {
  const k = getRoleKey(userData)
  return k === 'admin' || k === 'control_doc'
}

export function canManageDocuments(userData) {
  // editar/eliminar/cargar archivos: por ahora Admin + Control Doc
  return canUploadDocuments(userData)
}

export function getUserDisciplinaTipo(userData) {
  const tipo = userData?.disciplinas?.tipo
  return tipo ? String(tipo).trim().toUpperCase() : ''
}

export function filterDocumentsForUser(docs, userData) {
  const list = Array.isArray(docs) ? docs : []
  if (canViewAllDocuments(userData)) return list
  const tipo = getUserDisciplinaTipo(userData)
  if (!tipo) return []
  return list.filter(
    (d) =>
      String(d?.disciplinas_de_proyectos?.disciplinas?.tipo || '')
        .trim()
        .toUpperCase() === tipo
  )
}

export function filterDisciplinasProyectoForUser(disciplinasProy, userData) {
  const list = Array.isArray(disciplinasProy) ? disciplinasProy : []
  if (canViewAllDocuments(userData)) return list
  const tipo = getUserDisciplinaTipo(userData)
  if (!tipo) return []
  return list.filter(
    (dp) =>
      String(dp?.disciplinas?.tipo || '')
        .trim()
        .toUpperCase() === tipo
  )
}

