--------------------------------Triggers y Tiempo Real--------------------------------

-- Función de Notificación
CREATE OR REPLACE FUNCTION notificar_cambios_documento()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'realtime_changes',
    json_build_object(
      'table',
      TG_TABLE_NAME,
      'op',
      TG_OP,
      'id',
      COALESCE(
        (to_jsonb(NEW) ->> 'id_documento'),
        (to_jsonb(OLD) ->> 'id_documento'),
        (to_jsonb(NEW) ->> 'id_recepcion'),
        (to_jsonb(OLD) ->> 'id_recepcion'),
        (to_jsonb(NEW) ->> 'id_emision'),
        (to_jsonb(OLD) ->> 'id_emision')
      )
    )::text
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para Documentos
DROP TRIGGER IF EXISTS trigger_cambio_documento ON documentos;
CREATE TRIGGER trigger_cambio_documento
AFTER INSERT OR UPDATE OR DELETE ON documentos
FOR EACH ROW EXECUTE FUNCTION notificar_cambios_documento();

-- Trigger para Recepción de Cliente
DROP TRIGGER IF EXISTS trigger_recepcion_cliente ON recepciones;
CREATE TRIGGER trigger_recepcion_cliente
AFTER INSERT ON recepciones
FOR EACH ROW EXECUTE FUNCTION notificar_cambios_documento();
