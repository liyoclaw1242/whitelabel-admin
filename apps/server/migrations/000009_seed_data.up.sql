-- Seed: default tenant
INSERT INTO tenants (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Tenant', 'default')
ON CONFLICT DO NOTHING;

-- Seed: permissions (11)
INSERT INTO permissions (id, key, description) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'users:read',     'Read users'),
  ('a0000000-0000-0000-0000-000000000002', 'users:create',   'Create users'),
  ('a0000000-0000-0000-0000-000000000003', 'users:update',   'Update users'),
  ('a0000000-0000-0000-0000-000000000004', 'users:delete',   'Delete users'),
  ('a0000000-0000-0000-0000-000000000005', 'items:read',     'Read items'),
  ('a0000000-0000-0000-0000-000000000006', 'items:create',   'Create items'),
  ('a0000000-0000-0000-0000-000000000007', 'items:update',   'Update items'),
  ('a0000000-0000-0000-0000-000000000008', 'items:delete',   'Delete items'),
  ('a0000000-0000-0000-0000-000000000009', 'audit:read',     'Read audit logs'),
  ('a0000000-0000-0000-0000-00000000000a', 'tenants:read',   'Read tenants'),
  ('a0000000-0000-0000-0000-00000000000b', 'tenants:manage', 'Manage tenants')
ON CONFLICT DO NOTHING;

-- Seed: roles (3) in default tenant
INSERT INTO roles (id, tenant_id, name, description) VALUES
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin',  'Full access'),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'editor', 'Items + read users'),
  ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'viewer', 'Read-only')
ON CONFLICT DO NOTHING;

-- Seed: role_permissions
-- admin: all 11
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'b0000000-0000-0000-0000-000000000001', id FROM permissions
ON CONFLICT DO NOTHING;

-- editor: items:* + users:read
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'b0000000-0000-0000-0000-000000000002', id FROM permissions WHERE key IN ('items:read','items:create','items:update','items:delete','users:read')
ON CONFLICT DO NOTHING;

-- viewer: items:read + users:read
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'b0000000-0000-0000-0000-000000000003', id FROM permissions WHERE key IN ('items:read','users:read')
ON CONFLICT DO NOTHING;

-- Seed: users (3) — password is "password" bcrypt cost 10
INSERT INTO users (id, tenant_id, email, name, password_hash) VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin@example.com',  'Admin User',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'editor@example.com', 'Editor User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'viewer@example.com', 'Viewer User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON CONFLICT DO NOTHING;

-- Seed: user_roles
INSERT INTO user_roles (user_id, role_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;
