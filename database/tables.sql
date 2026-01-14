--------------------------------Definición de Tablas (DDL)--------------------------------
-- 1. Roles y Usuarios
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL,
    descripcion VARCHAR(200)
);

CREATE TABLE usuarios (
    id_usuario UUID PRIMARY KEY DEFAULT auth.uid(), -- Vinculado a Supabase Auth
    nombre VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    id_rol INT REFERENCES roles(id_rol)
);

-- 2. Clientes y Proyectos
CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre_cliente VARCHAR(100) NOT NULL,
    contacto VARCHAR(100)
);

CREATE TABLE proyectos (
    id_proyecto SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES clientes(id_cliente),
    nombre VARCHAR(200) NOT NULL,
    lugar VARCHAR(500),
    cod_proyecto_cliente VARCHAR(100),
    cod_proyecto_interno INT,
    nro_contrato BIGINT,
    fecha_inicio_contrato DATE,
    fecha_pem DATE,
    plazo_contractual INT,
    total_horas_por_dia_de_trabajo INT,
    total_dias_de_trabajo_por_semana INT
);

-- 3. Reglas de Avance (Diccionario Maestro)
CREATE TABLE reglas_de_avance (
    id_regla SERIAL PRIMARY KEY,
    tipo_revision VARCHAR(200), -- Rev A, B, 0
    porc_fisico INT,
    porc_certificacion INT
);

-- 4. Vínculo Proyecto-Reglas (La que faltaba)
CREATE TABLE medicion_de_avances (
    id_medicion SERIAL PRIMARY KEY,
    id_regla INT NOT NULL REFERENCES reglas_de_avance(id_regla),
    id_proyecto INT NOT NULL REFERENCES proyectos(id_proyecto)
);

-- 5. MDL y Disciplinas
CREATE TABLE disciplinas_de_proyectos (
    id_disciplina_proy SERIAL PRIMARY KEY,
    id_proyecto INT REFERENCES proyectos(id_proyecto),
    nombre_disciplina VARCHAR(100) -- Civil, Mecánica, etc.
);

CREATE TABLE documentos (
    id_documento SERIAL PRIMARY KEY,
    id_disciplina_proy INT REFERENCES disciplinas_de_proyectos(id_disciplina_proy),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    hh_estimadas INT DEFAULT 0,
    archivo_url TEXT, -- Link a Supabase Storage
    estado VARCHAR(50) DEFAULT 'Pendiente'
);

-- 6. Ejecución y Control (HH, Emisiones, Remitos)
CREATE TABLE registro_horas (
    id_registro SERIAL PRIMARY KEY,
    id_usuario UUID REFERENCES usuarios(id_usuario),
    id_documento INT REFERENCES documentos(id_documento),
    fecha DATE DEFAULT CURRENT_DATE,
    horas_incurridas NUMERIC(5,2)
);

CREATE TABLE remitos (
    id_remito SERIAL PRIMARY KEY,
    numero_remito VARCHAR(50) UNIQUE,
    fecha_envio DATE DEFAULT CURRENT_DATE
);

CREATE TABLE emisiones (
    id_emision SERIAL PRIMARY KEY,
    id_documento INT REFERENCES documentos(id_documento),
    id_medicion INT REFERENCES medicion_de_avances(id_medicion),
    id_remito INT REFERENCES remitos(id_remito),
    fecha_emision_real DATE DEFAULT CURRENT_DATE
);

CREATE TABLE recepciones (
    id_recepcion SERIAL PRIMARY KEY,
    id_emision INT REFERENCES emisiones(id_emision),
    fecha_recepcion_cliente DATE,
    comentario_cliente TEXT,
    estado_aprobacion VARCHAR(50) -- Aprobado, Con Comentarios, Rechazado
);