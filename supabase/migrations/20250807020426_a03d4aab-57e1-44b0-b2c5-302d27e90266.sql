-- Adicionar configuração de threshold de similaridade se não existir
INSERT INTO pipeline_settings (setting_key, setting_value, description)
VALUES ('SIMILARITY_THRESHOLD', '0.99', 'Minimum similarity score for document approval')
ON CONFLICT (setting_key) DO NOTHING;