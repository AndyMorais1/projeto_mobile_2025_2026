# Self-Hosted Supabase with Docker

This is the official Docker Compose setup for self-hosted Supabase. It provides a complete stack with all Supabase services running locally or on your infrastructure.

## Getting Started

Follow the detailed setup guide in our documentation: [Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)

The guide covers:
- Prerequisites (Git and Docker)
- Initial setup and configuration
- Securing your installation
- Accessing services
- Updating your instance

## What's Included

This Docker Compose configuration includes the following services:

- **[Studio](https://github.com/supabase/supabase/tree/master/apps/studio)** - A dashboard for managing your self-hosted Supabase project
- **[Kong](https://github.com/Kong/kong)** - Kong API gateway
- **[GoTrue](https://github.com/supabase/auth)** - JWT-based authentication API for user sign-ups, logins, and session management
- **[PostgREST](https://github.com/PostgREST/postgrest)** - Web server that turns your PostgreSQL database directly into a RESTful API
- **[Realtime](https://github.com/supabase/realtime)** - Elixir server that listens to PostgreSQL database changes and broadcasts them over websockets
- **[Storage](https://github.com/supabase/storage)** - RESTful API for managing files in S3, with Postgres handling permissions
- **[ImgProxy](https://github.com/imgproxy/imgproxy)** - Fast and secure image processing server
- **[postgres-meta](https://github.com/supabase/postgres-meta)** - RESTful API for managing Postgres (fetch tables, add roles, run queries)
- **[PostgreSQL](https://github.com/supabase/postgres)** - Object-relational database with over 30 years of active development
- **[Edge Runtime](https://github.com/supabase/edge-runtime)** - Web server based on Deno runtime for running JavaScript, TypeScript, and WASM services
- **[Logflare](https://github.com/Logflare/logflare)** - Log management and event analytics platform
- **[Vector](https://github.com/vectordotdev/vector)** - High-performance observability data pipeline for logs
- **[Supavisor](https://github.com/supabase/supavisor)** - Supabase's Postgres connection pooler

## Documentation

- **[Documentation](https://supabase.com/docs/guides/self-hosting/docker)** - Setup and configuration guides
- **[CHANGELOG.md](./CHANGELOG.md)** - Track recent updates and changes to services
- **[versions.md](./versions.md)** - Complete history of Docker image versions for rollback reference

## Updates

To update your self-hosted Supabase instance:

1. Review [CHANGELOG.md](./CHANGELOG.md) for breaking changes
2. Check [versions.md](./versions.md) for new image versions
3. Update `docker-compose.yml` if there are configuration changes
4. Pull the latest images: `docker compose pull`
5. Stop services: `docker compose down`
6. Start services with new configuration: `docker compose up -d`

**Note:** Consider to always backup your database before updating.

## Community & Support

For troubleshooting common issues, see:
- [GitHub Discussions](https://github.com/orgs/supabase/discussions?discussions_q=is%3Aopen+label%3Aself-hosted) - Questions, feature requests, and workarounds
- [GitHub Issues](https://github.com/supabase/supabase/issues?q=is%3Aissue%20state%3Aopen%20label%3Aself-hosted) - Known issues
- [Documentation](https://supabase.com/docs/guides/self-hosting) - Setup and configuration guides

Self-hosted Supabase is community-supported. Get help and connect with other users:

- [Discord](https://discord.supabase.com) - Real-time chat and community support
- [Reddit](https://www.reddit.com/r/Supabase/) - Community forum

Share your self-hosting experience and read what's working for other users:

- [GitHub Discussions](https://github.com/orgs/supabase/discussions/39820) - Self-hosting: What's working (and what's not)?)

## Important Notes

### Security

⚠️ **The default configuration is not secure for production use.**

Before deploying to production, you must:
- Update all default passwords and secrets in the `.env` file
- Generate new JWT secrets
- Review and update CORS settings
- Consider setting up a secure proxy in front of self-hosted Supabase
- Review and adjust network security configuration (ACLs, etc.)
- Set up proper backup procedures

See the [security section](https://supabase.com/docs/guides/self-hosting/docker#securing-your-services) in the documentation.

## License

This repository is licensed under the Apache 2.0 License. See the main [Supabase repository](https://github.com/supabase/supabase) for details.

## Arquitetura do Projeto (HA)

- Projeto Supabase self-hosted com alta disponibilidade, organizado por múltiplos arquivos Compose.
- Serviços principais no `docker-compose.yml`: `Auth`, `REST`, `Realtime`, `Storage`, `Studio`, `Kong`, `Supavisor`, `ImgProxy`, `Edge Functions`, `Analytics`, `DB` e `Meta`.
- Instância secundária em `docker-compose-app2.yml` (REST/Auth/Realtime/Storage/Functions/Analytics).
- Balanceamento do PostgreSQL com `HAProxy` e agentes de papel (`docker-compose-haproxy.yml`) que distinguem primária vs réplica via `pg_is_in_recovery()`.
- Load balancer HTTP opcional (`docker-compose-lb.yml`) que aponta para `supabase-kong` e `supabase-kong-2`.
- Réplica do DB (`docker-compose-replica.yml`) provisionada por `pg_basebackup` e `standby.signal`. Failover opcional (`docker-compose-failover.yml`).
- Rede compartilhada `supabase_default` com `external: true` (todos os stacks a utilizam).

## Serviços e Conexões

- `Auth (GoTrue)`: usa `haproxy-db:5000` com `search_path=auth` (`docker-compose.yml:122-135`).
- `REST (PostgREST)`: expõe `public` e `storage` (`docker-compose.yml:195-199`, `.env:60`).
- `Storage (storage-api)`: requer `search_path` com `storage,public` e privilégios adequados; env principais (`docker-compose.yml:279-285`).
- `Studio`: URL pública via `Kong` e `Meta` para introspecção (`docker-compose.yml:34-49`).
- `Kong (API Gateway)`: define rotas/ACL/plugins em `volumes/api/kong.yml`:
  - `rest-v1` com `key-auth` + `acl` (`volumes/api/kong.yml:82-104`)
  - `auth-v1` sem `key-auth` (apenas `cors`) (`volumes/api/kong.yml:68-79`)
  - `storage-v1` sem `key-auth` (`volumes/api/kong.yml:181-191`)
  - upstreams configurados em `volumes/api/kong.yml:243-302`
- `Supavisor`: pooler para conexões do DB (`docker-compose.yml:513-564`).
- `Edge Functions`: router principal em `volumes/functions/main/index.ts:1`.
- `Analytics (Logflare)` com `Vector` para ingestão de logs.

## Fluxo de Requests

- Cliente → (opcional) `Nginx` (`docker-compose-lb.yml`) → `Kong` → serviços (`Auth`, `REST`, `Storage`, `Realtime`, `Functions`).
- Banco via `HAProxy`: porta `5000` primária, `5001` réplica (`docker-compose-haproxy.yml`).
- `Supabase Studio` consome `Meta` e APIs via `Kong`.

## Storage e Buckets

- Tabelas do schema `storage`: `buckets`, `objects`, `prefixes`.
- Dump em `cloud_dump.sql` contém:
  - Buckets em `cloud_dump.sql:775-779` (`user_fotos`, `info_fotos`, `recibos`, `info_anexos`)
  - Objetos/prefixos em `cloud_dump.sql:792-815`
- Para consumir via REST:
  - Usar `Accept-Profile: storage` nas requisições REST.
  - Garantir `PGRST_DB_SCHEMAS` inclui `storage` (`docker-compose.yml:197`, `.env:60`).
  - Garantir permissões do schema/tabelas para `anon`, `authenticated`, `service_role` conforme necessidade.

## Replicação e Failover

- Réplica (`docker-compose-replica.yml`) usa `pg_basebackup` e inicia com `hot_standby=on`.
- Failover watcher (`docker-compose-failover.yml:10-18`) monitora primária/réplica.
- `HAProxy` seleciona backend via agentes de papel (`docker-compose-haproxy.yml` + `role-agent/agent.py`).

## Observabilidade

- `Vector` coleta logs de containers e envia para `Analytics` (Logflare).
- `Studio` exibe logs consumidos via `Analytics`.
- Configuração em `volumes/logs/vector.yml`.

## Operações Comuns

- Subir principal: `docker compose up -d`
- Subir com overlay dev: `docker compose -f docker-compose.yml -f ./dev/docker-compose.dev.yml up -d`
- Subir app2: `docker compose -f docker-compose-app2.yml up -d`
- Subir HAProxy: `docker compose -f docker-compose-haproxy.yml up -d`
- Subir LB: `docker compose -f docker-compose-lb.yml up -d`
- Subir réplica: `docker compose -f docker-compose-replica.yml up -d`
- Subir failover watcher: `docker compose -f docker-compose-failover.yml up -d`
- Derrubar todos: executar `down --remove-orphans` em cada arquivo compose.

## Checklist de Alterações Seguras

- Banco/Storage:
  - Garantir `search_path` inclui `storage,public` onde necessário (`docker-compose.yml:279`, `PGOPTIONS`).
  - Não alterar `supabase_admin` diretamente sem privilégios de superusuário.
  - Ao restaurar `storage`, aplicar `Accept-Profile: storage` e conceder privilégios ao schema/tabelas.
- Kong:
  - Manter `key-auth` + `acl` em `rest-v1` (`volumes/api/kong.yml:82-104`).
  - Reiniciar `kong` após mudanças de `kong.yml`.
- Rede:
  - Preservar `supabase_default` como rede externa em todos os stacks (`docker-compose.yml:565`).
  - Evitar renomear serviços sem atualizar targets em upstreams (`volumes/api/kong.yml:243-302`) e `nginx-supabase.conf`.
- HAProxy/Replicação:
  - Não alterar portas/backend sem ajustar `haproxy.cfg` e agentes.
  - Usar scripts de rejoin/failover ao promover/demover instâncias.
- Edge Functions:
  - Definir `PROJECT_URL`, `INTERNAL_AUTH_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY` adequados.
  - Reiniciar `functions` ao alterar env ou router.
- Segurança:
  - Nunca commitar segredos reais; usar `.env` local.
  - Verificar CORS e ACLs após alterações.

## Referências Rápidas (arquivos)

- `docker-compose.yml` (serviços principais; `REST` em `docker-compose.yml:195-199`; `Storage` env em `docker-compose.yml:279-285`)
- `volumes/api/kong.yml` (rotas/ACL/upstreams; `rest-v1` em `volumes/api/kong.yml:82-104`)
- `nginx/nginx-supabase.conf` (balanceamento HTTP/websocket)
- `docker-compose-haproxy.yml` (HAProxy + agentes)
- `role-agent/agent.py` (detecção primária/réplica)
- `volumes/functions/main/index.ts` (roteador de funções)
- `.env` (chaves e configurações; `PGRST_DB_SCHEMAS` em `.env:60`)
- `cloud_dump.sql` (dados de `storage`)
