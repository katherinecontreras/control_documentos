--------------------------------Triggers y Tiempo Real--------------------------------

-- Función de Notificación
CREATE OR REPLACE FUNCTION notificar_cambios_documento()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('realtime_changes', json_build_object('table', TG_TABLE_NAME, 'id', NEW.id_documento)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para Documentos
CREATE TRIGGER trigger_cambio_documento
AFTER UPDATE ON documentos
FOR EACH ROW EXECUTE FUNCTION notificar_cambios_documento();

-- Trigger para Recepción de Cliente
CREATE TRIGGER trigger_recepcion_cliente
AFTER INSERT ON recepciones
FOR EACH ROW EXECUTE FUNCTION notificar_cambios_documento();
