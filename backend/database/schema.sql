-- Database schema for CloudOps

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notifications BOOLEAN DEFAULT true,
  theme VARCHAR(50) DEFAULT 'light',
  timezone VARCHAR(50) DEFAULT 'UTC',
  email_alerts BOOLEAN DEFAULT true,
  dashboard_refresh_interval INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  maintenance_mode BOOLEAN DEFAULT false,
  max_users INTEGER DEFAULT 100,
  data_retention_days INTEGER DEFAULT 90,
  backup_frequency VARCHAR(50) DEFAULT 'daily',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- System metrics
CREATE TABLE IF NOT EXISTS system_metrics (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(50) NOT NULL,
  service VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB,
  created_by INTEGER REFERENCES users(id),
  resolved_by INTEGER REFERENCES users(id),
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Container actions
CREATE TABLE IF NOT EXISTS container_actions (
  id SERIAL PRIMARY KEY,
  container_id VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  user_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pipeline triggers
CREATE TABLE IF NOT EXISTS pipeline_triggers (
  id SERIAL PRIMARY KEY,
  pipeline_id VARCHAR(255) NOT NULL,
  branch VARCHAR(255) DEFAULT 'main',
  triggered_by VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pipeline history
CREATE TABLE IF NOT EXISTS pipeline_history (
  id SERIAL PRIMARY KEY,
  pipeline_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  branch VARCHAR(255),
  commit_hash VARCHAR(255),
  duration INTEGER,
  url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cloud providers
CREATE TABLE IF NOT EXISTS cloud_providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'disconnected',
  credentials JSONB,
  region VARCHAR(100),
  services INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_metrics_type_time ON system_metrics(metric_type, created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_status_severity ON alerts(status, severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_history_pipeline_id ON pipeline_history(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_container_actions_container_id ON container_actions(container_id);

-- Insert default system settings
INSERT INTO system_settings (maintenance_mode, max_users, data_retention_days, backup_frequency)
VALUES (false, 100, 90, 'daily')
ON CONFLICT (id) DO NOTHING;

-- Insert default cloud providers
INSERT INTO cloud_providers (name, status, services) VALUES
('AWS', 'disconnected', 0),
('Azure', 'disconnected', 0),
('GCP', 'disconnected', 0)
ON CONFLICT (name) DO NOTHING;</content>
<parameter name="filePath">c:\Users\manje\Desktop\cloudops\backend\database\schema.sql