-------------------------------- Funciones de Cálculo (RPC)--------------------------------
-- Cálculo de Avance Físico
CREATE OR REPLACE FUNCTION calcular_avance_fisico_proyecto(p_id_proyecto INT)
RETURNS NUMERIC AS $$
DECLARE
    v_total_hh INT;
    v_hh_ganadas NUMERIC;
BEGIN
    SELECT SUM(hh_estimadas) INTO v_total_hh FROM documentos d 
    JOIN disciplinas_de_proyectos dp ON d.id_disciplina_proy = dp.id_disciplina_proy
    WHERE dp.id_proyecto = p_id_proyecto;

    SELECT SUM(d.hh_estimadas * (ra.porc_fisico / 100.0)) INTO v_hh_ganadas
    FROM emisiones e
    JOIN documentos d ON e.id_documento = d.id_documento
    JOIN medicion_de_avances ma ON e.id_medicion = ma.id_medicion
    JOIN reglas_de_avance ra ON ma.id_regla = ra.id_regla
    JOIN disciplinas_de_proyectos dp ON d.id_disciplina_proy = dp.id_disciplina_proy
    WHERE dp.id_proyecto = p_id_proyecto;

    RETURN COALESCE((v_hh_ganadas / NULLIF(v_total_hh, 0)) * 100, 0);
END;
$$ LANGUAGE plpgsql;

-- Cálculo de Productividad (CPI)
CREATE OR REPLACE FUNCTION calcular_productividad_proyecto(p_id_proyecto INT)
RETURNS NUMERIC AS $$
DECLARE
    v_hh_ganadas NUMERIC;
    v_hh_reales NUMERIC;
BEGIN
    -- HH Ganadas (EV)
    SELECT SUM(d.hh_estimadas * (ra.porc_fisico / 100.0)) INTO v_hh_ganadas
    FROM emisiones e
    JOIN documentos d ON e.id_documento = d.id_documento
    JOIN medicion_de_avances ma ON e.id_medicion = ma.id_medicion
    JOIN reglas_de_avance ra ON ma.id_regla = ra.id_regla
    JOIN disciplinas_de_proyectos dp ON d.id_disciplina_proy = dp.id_disciplina_proy
    WHERE dp.id_proyecto = p_id_proyecto;

    -- HH Reales (AC)
    SELECT SUM(horas_incurridas) INTO v_hh_reales 
    FROM registro_horas rh
    JOIN documentos d ON rh.id_documento = d.id_documento
    JOIN disciplinas_de_proyectos dp ON d.id_disciplina_proy = dp.id_disciplina_proy
    WHERE dp.id_proyecto = p_id_proyecto;

    RETURN COALESCE(v_hh_ganadas / NULLIF(v_hh_reales, 0), 0);
END;
$$ LANGUAGE plpgsql;

--
CREATE OR REPLACE FUNCTION calcular_avance_certificacion_proyecto(p_id_proyecto INT)
RETURNS NUMERIC AS $$
DECLARE
    v_total_hh INT;
    v_hh_certificadas NUMERIC;
BEGIN
    -- Total de HH del proyecto para el denominador
    SELECT SUM(hh_estimadas) INTO v_total_hh FROM documentos d 
    JOIN disciplinas_de_proyectos dp ON d.id_disciplina_proy = dp.id_disciplina_proy
    WHERE dp.id_proyecto = p_id_proyecto;
    --Avance de Certificación (Venta)
HH calculadas según porcentaje de certificación de la regla alcanzada
    SELECT SUM(d.hh_estimadas * (ra.porc_certificacion / 100.0)) INTO v_hh_certificadas
    FROM emisiones e
    JOIN documentos d ON e.id_documento = d.id_documento
    JOIN medicion_de_avances ma ON e.id_medicion = ma.id_medicion
    JOIN reglas_de_avance ra ON ma.id_regla = ra.id_regla
    JOIN disciplinas_de_proyectos dp ON d.id_disciplina_proy = dp.id_disciplina_proy
    WHERE dp.id_proyecto = p_id_proyecto;

    RETURN COALESCE((v_hh_certificadas / NULLIF(v_total_hh, 0)) * 100, 0);
END;
$$ LANGUAGE plpgsql;

--Cumplimiento de Programa (Puntualidad)
CREATE OR REPLACE FUNCTION calcular_cumplimiento_programa(p_id_proyecto INT)
RETURNS NUMERIC AS $$
DECLARE
    v_total_emisiones INT;
    v_emisiones_a_tiempo INT;
BEGIN
    -- Contamos emisiones totales del proyecto
    SELECT COUNT(*) INTO v_total_emisiones FROM emisiones e
    JOIN documentos d ON e.id_documento = d.id_documento
    JOIN disciplinas_de_proyectos dp ON d.id_disciplina_proy = dp.id_disciplina_proy
    WHERE dp.id_proyecto = p_id_proyecto;

    -- Contamos las que se hicieron antes o en la fecha prevista (requiere que el front/back guarde fecha_planificada)
    -- Asumiendo que agregamos 'fecha_planificada' a la tabla emisiones para control
    SELECT COUNT(*) INTO v_emisiones_a_tiempo FROM emisiones e
    JOIN documentos d ON e.id_documento = d.id_documento
    JOIN disciplinas_de_proyectos dp ON d.id_disciplina_proy = dp.id_disciplina_proy
    WHERE dp.id_proyecto = p_id_proyecto 
    AND e.fecha_emision_real <= e.fecha_emision_planificada; -- Campo opcional a agregar

    RETURN COALESCE((v_emisiones_a_tiempo::NUMERIC / NULLIF(v_total_emisiones, 0)) * 100, 100);
END;
$$ LANGUAGE plpgsql;

--Ratio de Calidad de Ingeniería
CREATE OR REPLACE FUNCTION calcular_ratio_calidad_ingenieria(p_id_proyecto INT)
RETURNS NUMERIC AS $$
DECLARE
    v_total_recepciones INT;
    v_aprobados_directos INT;
BEGIN
    SELECT COUNT(*) INTO v_total_recepciones FROM recepciones r
    JOIN emisiones e ON r.id_emision = e.id_emision
    JOIN documentos d ON e.id_documento = d.id_documento
    JOIN disciplinas_de_proyectos dp ON d.id_disciplina_proy = dp.id_disciplina_proy
    WHERE dp.id_proyecto = p_id_proyecto;

    SELECT COUNT(*) INTO v_aprobados_directos FROM recepciones r
    JOIN emisiones e ON r.id_emision = e.id_emision
    JOIN documentos d ON e.id_documento = d.id_documento
    JOIN disciplinas_de_proyectos dp ON d.id_disciplina_proy = dp.id_disciplina_proy
    WHERE dp.id_proyecto = p_id_proyecto 
    AND r.estado_aprobacion = 'Aprobado';

    RETURN COALESCE((v_aprobados_directos::NUMERIC / NULLIF(v_total_recepciones, 0)) * 100, 0);
END;
$$ LANGUAGE plpgsql;

--Promedio de Revisión del Cliente (Días de demora)
CREATE OR REPLACE FUNCTION calcular_promedio_revision_cliente(p_id_proyecto INT)
RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT AVG(r.fecha_recepcion_cliente - e.fecha_emision_real)
        FROM recepciones r
        JOIN emisiones e ON r.id_emision = e.id_emision
        JOIN documentos d ON e.id_documento = d.id_documento
        JOIN disciplinas_de_proyectos dp ON d.id_disciplina_proy = dp.id_disciplina_proy
        WHERE dp.id_proyecto = p_id_proyecto
    );
END;
$$ LANGUAGE plpgsql;


-------------------------------- Notificaciones (Triggers)--------------------------------
-- Nota importante (Supabase):
-- - Estos triggers se ejecutan en Postgres cuando se inserta un documento/proyecto.
-- - Para capturar el "quién" sin modificar tu modelo actual, leemos el email/uid desde el JWT:
--   current_setting('request.jwt.claims', true)::jsonb ->> 'email'
--   current_setting('request.jwt.claims', true)::jsonb ->> 'sub'  (uuid del usuario auth)

CREATE OR REPLACE FUNCTION public.fn_actor_email()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  claims JSONB;
  em TEXT;
BEGIN
  claims := COALESCE(current_setting('request.jwt.claims', true), '{}')::jsonb;
  em := NULLIF(claims ->> 'email', '');
  RETURN COALESCE(em, 'sistema');
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_actor_uid()
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  claims JSONB;
  s TEXT;
BEGIN
  claims := COALESCE(current_setting('request.jwt.claims', true), '{}')::jsonb;
  s := NULLIF(claims ->> 'sub', '');
  IF s IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN s::uuid;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$;

-- Inserta notificación al crear un proyecto
CREATE OR REPLACE FUNCTION public.crear_notificacion_proyecto()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_actor_email TEXT;
  v_actor_uid UUID;
  v_tipo TEXT;
  v_titulo TEXT;
  v_mensaje TEXT;
  v_notif_id BIGINT;
  v_nombre TEXT;
  v_id_proyecto INT;
BEGIN
  v_actor_email := public.fn_actor_email();
  v_actor_uid := public.fn_actor_uid();

  IF TG_OP = 'INSERT' THEN
    v_tipo := 'proyecto_creado';
    v_titulo := 'Nuevo proyecto creado';
    v_id_proyecto := NEW.id_proyecto;
    v_nombre := NEW.nombre;
    v_mensaje := v_actor_email || ' creó el proyecto "' || COALESCE(NEW.nombre, '-') || '"';

    INSERT INTO public.notificaciones (
      actor_auth_uid,
      actor_email,
      tipo,
      entidad,
      entidad_id,
      id_proyecto,
      titulo,
      mensaje,
      metadata
    ) VALUES (
      v_actor_uid,
      v_actor_email,
      v_tipo,
      'proyecto',
      NEW.id_proyecto,
      NEW.id_proyecto,
      v_titulo,
      v_mensaje,
      jsonb_build_object(
        'op', TG_OP,
        'id_proyecto', NEW.id_proyecto,
        'new', to_jsonb(NEW),
        'fecha', NOW()
      )
    )
    RETURNING id_notificacion INTO v_notif_id;

    PERFORM pg_notify(
      'notifications',
      jsonb_build_object('id_notificacion', v_notif_id, 'tipo', v_tipo)::text
    );

    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_tipo := 'proyecto_actualizado';
    v_titulo := 'Proyecto actualizado';
    v_id_proyecto := NEW.id_proyecto;
    v_nombre := NEW.nombre;
    v_mensaje := v_actor_email || ' actualizó el proyecto "' || COALESCE(NEW.nombre, '-') || '"';

    INSERT INTO public.notificaciones (
      actor_auth_uid,
      actor_email,
      tipo,
      entidad,
      entidad_id,
      id_proyecto,
      titulo,
      mensaje,
      metadata
    ) VALUES (
      v_actor_uid,
      v_actor_email,
      v_tipo,
      'proyecto',
      NEW.id_proyecto,
      NEW.id_proyecto,
      v_titulo,
      v_mensaje,
      jsonb_build_object(
        'op', TG_OP,
        'id_proyecto', NEW.id_proyecto,
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW),
        'fecha', NOW()
      )
    )
    RETURNING id_notificacion INTO v_notif_id;

    PERFORM pg_notify(
      'notifications',
      jsonb_build_object('id_notificacion', v_notif_id, 'tipo', v_tipo)::text
    );

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_tipo := 'proyecto_eliminado';
    v_titulo := 'Proyecto eliminado';
    v_id_proyecto := OLD.id_proyecto;
    v_nombre := OLD.nombre;
    v_mensaje := v_actor_email || ' eliminó el proyecto "' || COALESCE(OLD.nombre, '-') || '"';

    INSERT INTO public.notificaciones (
      actor_auth_uid,
      actor_email,
      tipo,
      entidad,
      entidad_id,
      id_proyecto,
      titulo,
      mensaje,
      metadata
    ) VALUES (
      v_actor_uid,
      v_actor_email,
      v_tipo,
      'proyecto',
      OLD.id_proyecto,
      OLD.id_proyecto,
      v_titulo,
      v_mensaje,
      jsonb_build_object(
        'op', TG_OP,
        'id_proyecto', OLD.id_proyecto,
        'old', to_jsonb(OLD),
        'fecha', NOW()
      )
    )
    RETURNING id_notificacion INTO v_notif_id;

    PERFORM pg_notify(
      'notifications',
      jsonb_build_object('id_notificacion', v_notif_id, 'tipo', v_tipo)::text
    );

    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Inserta notificación al cargar/crear un documento
CREATE OR REPLACE FUNCTION public.crear_notificacion_documento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_actor_email TEXT;
  v_actor_uid UUID;
  v_proyecto_id INT;
  v_proyecto_nombre TEXT;
  v_disc_tipo TEXT;
  v_disc_desc TEXT;
  v_codigo TEXT;
  v_tipo TEXT;
  v_titulo TEXT;
  v_mensaje TEXT;
  v_notif_id BIGINT;
  rec RECORD;
BEGIN
  v_actor_email := public.fn_actor_email();
  v_actor_uid := public.fn_actor_uid();

  IF TG_OP = 'DELETE' THEN
    rec := OLD;
  ELSE
    rec := NEW;
  END IF;

  SELECT
    dp.id_proyecto,
    p.nombre,
    d.tipo,
    d.descripcion
  INTO
    v_proyecto_id,
    v_proyecto_nombre,
    v_disc_tipo,
    v_disc_desc
  FROM public.disciplinas_de_proyectos dp
  JOIN public.proyectos p ON p.id_proyecto = dp.id_proyecto
  JOIN public.disciplinas d ON d.id_disciplina = dp.id_disciplina
  WHERE dp.id_disciplina_proy = rec.id_disciplina_proy;

  v_codigo := COALESCE(NULLIF(rec.codigo_documento_emitido, ''), NULLIF(rec.codigo_documento_base, ''), 'Documento');

  IF TG_OP = 'INSERT' THEN
    v_tipo := 'documento_cargado';
    v_titulo := 'Documento cargado';
    v_mensaje := v_actor_email || ' cargó "' || v_codigo || '" en ' ||
      COALESCE(v_disc_tipo, '-') || ' (' || COALESCE(v_disc_desc, '-') || ')' ||
      ' / Proyecto: ' || COALESCE(v_proyecto_nombre, '-');

    INSERT INTO public.notificaciones (
      actor_auth_uid,
      actor_email,
      tipo,
      entidad,
      entidad_id,
      id_proyecto,
      id_disciplina_proy,
      titulo,
      mensaje,
      metadata
    ) VALUES (
      v_actor_uid,
      v_actor_email,
      v_tipo,
      'documento',
      NEW.id_documento,
      v_proyecto_id,
      NEW.id_disciplina_proy,
      v_titulo,
      v_mensaje,
      jsonb_build_object(
        'op', TG_OP,
        'id_documento', NEW.id_documento,
        'id_proyecto', v_proyecto_id,
        'proyecto', v_proyecto_nombre,
        'disciplina_tipo', v_disc_tipo,
        'disciplina_desc', v_disc_desc,
        'new', to_jsonb(NEW),
        'fecha', NOW()
      )
    )
    RETURNING id_notificacion INTO v_notif_id;

    PERFORM pg_notify(
      'notifications',
      jsonb_build_object('id_notificacion', v_notif_id, 'tipo', v_tipo)::text
    );

    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_tipo := 'documento_actualizado';
    v_titulo := 'Documento actualizado';
    v_mensaje := v_actor_email || ' actualizó "' || v_codigo || '" en ' ||
      COALESCE(v_disc_tipo, '-') || ' (' || COALESCE(v_disc_desc, '-') || ')' ||
      ' / Proyecto: ' || COALESCE(v_proyecto_nombre, '-');

    INSERT INTO public.notificaciones (
      actor_auth_uid,
      actor_email,
      tipo,
      entidad,
      entidad_id,
      id_proyecto,
      id_disciplina_proy,
      titulo,
      mensaje,
      metadata
    ) VALUES (
      v_actor_uid,
      v_actor_email,
      v_tipo,
      'documento',
      NEW.id_documento,
      v_proyecto_id,
      NEW.id_disciplina_proy,
      v_titulo,
      v_mensaje,
      jsonb_build_object(
        'op', TG_OP,
        'id_documento', NEW.id_documento,
        'id_proyecto', v_proyecto_id,
        'proyecto', v_proyecto_nombre,
        'disciplina_tipo', v_disc_tipo,
        'disciplina_desc', v_disc_desc,
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW),
        'fecha', NOW()
      )
    )
    RETURNING id_notificacion INTO v_notif_id;

    PERFORM pg_notify(
      'notifications',
      jsonb_build_object('id_notificacion', v_notif_id, 'tipo', v_tipo)::text
    );

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_tipo := 'documento_eliminado';
    v_titulo := 'Documento eliminado';
    v_mensaje := v_actor_email || ' eliminó "' || v_codigo || '" en ' ||
      COALESCE(v_disc_tipo, '-') || ' (' || COALESCE(v_disc_desc, '-') || ')' ||
      ' / Proyecto: ' || COALESCE(v_proyecto_nombre, '-');

    INSERT INTO public.notificaciones (
      actor_auth_uid,
      actor_email,
      tipo,
      entidad,
      entidad_id,
      id_proyecto,
      id_disciplina_proy,
      titulo,
      mensaje,
      metadata
    ) VALUES (
      v_actor_uid,
      v_actor_email,
      v_tipo,
      'documento',
      OLD.id_documento,
      v_proyecto_id,
      OLD.id_disciplina_proy,
      v_titulo,
      v_mensaje,
      jsonb_build_object(
        'op', TG_OP,
        'id_documento', OLD.id_documento,
        'id_proyecto', v_proyecto_id,
        'proyecto', v_proyecto_nombre,
        'disciplina_tipo', v_disc_tipo,
        'disciplina_desc', v_disc_desc,
        'old', to_jsonb(OLD),
        'fecha', NOW()
      )
    )
    RETURNING id_notificacion INTO v_notif_id;

    PERFORM pg_notify(
      'notifications',
      jsonb_build_object('id_notificacion', v_notif_id, 'tipo', v_tipo)::text
    );

    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS trigger_notificacion_proyecto_creado ON public.proyectos;
DROP TRIGGER IF EXISTS trigger_notificacion_proyecto_cambios ON public.proyectos;
CREATE TRIGGER trigger_notificacion_proyecto_cambios
AFTER INSERT OR UPDATE OR DELETE ON public.proyectos
FOR EACH ROW
EXECUTE FUNCTION public.crear_notificacion_proyecto();

DROP TRIGGER IF EXISTS trigger_notificacion_documento_cargado ON public.documentos;
DROP TRIGGER IF EXISTS trigger_notificacion_documento_cambios ON public.documentos;
CREATE TRIGGER trigger_notificacion_documento_cambios
AFTER INSERT OR UPDATE OR DELETE ON public.documentos
FOR EACH ROW
EXECUTE FUNCTION public.crear_notificacion_documento();