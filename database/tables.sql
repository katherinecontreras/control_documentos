-- 1. Disciplinas Generales
CREATE TABLE disciplinas (
    id_disciplina SERIAL PRIMARY KEY,
    tipo VARCHAR(2), -- Ej: CI, ME, EL
    descripcion VARCHAR(200)
);

-- 2. Clientes
CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    CUIT VARCHAR(200),
    actividad VARCHAR(200)
);

-- 3. Proyectos
CREATE TABLE proyectos (
    id_proyecto SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES clientes(id_cliente),
    nombre VARCHAR(100) NOT NULL,
    lugar VARCHAR(500),
    cod_proyecto_cliente VARCHAR(100),
    cod_proyecto_interno INT,
    nro_contrato INT,
    fecha_inicio_contrato DATE,
    fecha_PEM DATE,
    plazo_contractual INT,
    total_horas_por_dia_de_trabajo INT,
    total_dias_de_trabajo_por_semana INT
);

-- 4. Disciplinas asignadas a Proyectos (NUEVA)
CREATE TABLE disciplinas_de_proyectos (
    id_disciplina_proy SERIAL PRIMARY KEY,
    id_disciplina INT REFERENCES disciplinas(id_disciplina),
    id_proyecto INT REFERENCES proyectos(id_proyecto)
);

-- 5. Reglas de Avance (Lógica del PDF)
CREATE TABLE reglas_de_avance (
    id_regla SERIAL PRIMARY KEY,
    tipo_revision VARCHAR(200), -- Rev A, B, 0
    porc_fisico INT,
    porc_certificacion INT
);

-- 6. Usuarios y sus roles

CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL, -- 'Administrador', 'Coordinador', 'Proyectista'
    descripcion VARCHAR(200)
);

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_rol INT REFERENCES roles(id_rol),
    id_disciplina INT REFERENCES disciplinas(id_disciplina),
    nombre VARCHAR(20),
    apellido VARCHAR(20),
    email_empresa VARCHAR(100),
    dni INT,
    lider_equipo BOOLEAN
);

-- 7. Tipo de Documento
CREATE TABLE tipo_documento (
    id_tipo_doc SERIAL PRIMARY KEY,
    tipo VARCHAR(2),
    descripcion VARCHAR(200)
);

-- 8. Documentos (MDL)
CREATE TABLE documentos (
    id_documento SERIAL PRIMARY KEY,
    id_disciplina_proy INT REFERENCES disciplinas_de_proyectos(id_disciplina_proy),
    id_tipo_documento INT REFERENCES tipo_documento(id_tipo_doc),
    codigo_documento_base VARCHAR(500),
    codigo_documento_emitido VARCHAR(500),
    nro_sub_proyecto INT,
    nro_consecutivo INT,
    nro_hojas INT,
    cod_emision VARCHAR(2),
    yacimiento VARCHAR(4),
    instalacion VARCHAR(20),
    descripcion VARCHAR(500),
    archivo VARCHAR(500),
    estado VARCHAR(100),
    fecha_base DATE,
    fecha_emision_prevista DATE,
    formato_hojas VARCHAR(2),
    hh_estimadas INT, 
    hh_internas INT,
    hh_externas INT,
    tipo_archivo VARCHAR(100),
    tipo_accion VARCHAR(100)
);

-- 9. Registro de Horas (Timesheet)
CREATE TABLE registro_horas (
    id_registro_hrs SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES usuarios(id_usuario),
    id_documento INT REFERENCES documentos(id_documento),
    horas_incurridas INT,
    fecha_carga DATE,
    comentario VARCHAR(300)
);

-- 10. Emisiones
CREATE TABLE emisiones (
    id_emision SERIAL PRIMARY KEY,
    id_documento INT REFERENCES documentos(id_documento),
    id_regla INT REFERENCES reglas_de_avance(id_regla),
    cod_revision VARCHAR(2),
    fecha_emision_real DATE
);

-- 11. Remitos
CREATE TABLE remitos (
    id_remito SERIAL PRIMARY KEY,
    id_usuario_emite INT REFERENCES usuarios(id_usuario),
    direccion VARCHAR(100),
    nro_remito INT,
    fecha DATE,
    archivo VARCHAR(100)
);

-- 12. Documentos de Remito (Nexo entre Emisión y Remito)
CREATE TABLE documentos_de_remito (
    id_doc_de_remito SERIAL PRIMARY KEY,
    id_emision INT REFERENCES emisiones(id_emision),
    id_remito INT REFERENCES remitos(id_remito),
    nro_copias INT,
    observaciones VARCHAR(100)
);

-- 13. Recepciones (Devolución del cliente)
CREATE TABLE recepciones (
    id_recepcion SERIAL PRIMARY KEY,
    id_emision INT REFERENCES emisiones(id_emision),
    observaciones VARCHAR(200),
    fecha_devolucion_cliente DATE
);