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
