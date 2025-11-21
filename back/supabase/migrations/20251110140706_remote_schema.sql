


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."categoria_manutencao" AS ENUM (
    'eletricista',
    'canalizador',
    'limpeza',
    'pintura',
    'jardinagem',
    'outro'
);


ALTER TYPE "public"."categoria_manutencao" OWNER TO "postgres";


CREATE TYPE "public"."estado_condominio" AS ENUM (
    'ativo',
    'inativo'
);


ALTER TYPE "public"."estado_condominio" OWNER TO "postgres";


CREATE TYPE "public"."estado_fatura" AS ENUM (
    'pendente',
    'pago',
    'cancelado',
    'expirado'
);


ALTER TYPE "public"."estado_fatura" OWNER TO "postgres";


CREATE TYPE "public"."estado_informacao" AS ENUM (
    'ativo',
    'inativo'
);


ALTER TYPE "public"."estado_informacao" OWNER TO "postgres";


CREATE TYPE "public"."estado_pedido" AS ENUM (
    'pendente',
    'aprovado',
    'rejeitado',
    'concluido'
);


ALTER TYPE "public"."estado_pedido" OWNER TO "postgres";


CREATE TYPE "public"."estado_propriedade" AS ENUM (
    'disponivel',
    'ocupada',
    'manutencao'
);


ALTER TYPE "public"."estado_propriedade" OWNER TO "postgres";


CREATE TYPE "public"."estado_utilizador" AS ENUM (
    'ativo',
    'inativo',
    'pendente'
);


ALTER TYPE "public"."estado_utilizador" OWNER TO "postgres";


CREATE TYPE "public"."metodo_pagamento" AS ENUM (
    'multibanco',
    'mbway'
);


ALTER TYPE "public"."metodo_pagamento" OWNER TO "postgres";


CREATE TYPE "public"."provedor_pagamento" AS ENUM (
    'stripe',
    'sibs',
    'easypay',
    'ifthenpay',
    'vivawallet'
);


ALTER TYPE "public"."provedor_pagamento" OWNER TO "postgres";


CREATE TYPE "public"."tipo_condominio" AS ENUM (
    'vertical',
    'horizontal',
    'misto'
);


ALTER TYPE "public"."tipo_condominio" OWNER TO "postgres";


CREATE TYPE "public"."tipo_fatura" AS ENUM (
    'agua',
    'luz',
    'taxa',
    'outro'
);


ALTER TYPE "public"."tipo_fatura" OWNER TO "postgres";


CREATE TYPE "public"."tipo_informacao" AS ENUM (
    'aviso',
    'noticias',
    'outro'
);


ALTER TYPE "public"."tipo_informacao" OWNER TO "postgres";


CREATE TYPE "public"."tipo_pedido" AS ENUM (
    'manutenção',
    'reportar',
    'outro'
);


ALTER TYPE "public"."tipo_pedido" OWNER TO "postgres";


CREATE TYPE "public"."tipo_propriedade" AS ENUM (
    'apartamento',
    'vivenda'
);


ALTER TYPE "public"."tipo_propriedade" OWNER TO "postgres";


CREATE TYPE "public"."urgencia_manutencao" AS ENUM (
    'baixa',
    'media',
    'alta'
);


ALTER TYPE "public"."urgencia_manutencao" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."belongs_to_condominio"("p_condominio" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
      from public.propriedade pr
     where pr.condominio_id = p_condominio
       and pr.morador_id = auth.uid()
  )
$$;


ALTER FUNCTION "public"."belongs_to_condominio"("p_condominio" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_pagamento_aplica_na_fatura"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- marca paid_at se o provedor confirmou sucesso
  if (NEW.estado = 'succeeded' and NEW.paid_at is null) then
    NEW.paid_at := now();
  end if;

  -- 1) SUCCEEDED  → fatura = pago
  if (NEW.estado = 'succeeded') then
    update public.fatura
       set estado_fatura = 'pago',
           pago_em       = coalesce(NEW.paid_at, now()),
           updated_at    = now()
     where id = NEW.fatura_id
       and estado_fatura <> 'pago';
  end if;

  -- 2) CANCELED/FAILURE/EXPIRED (Stripe manda "canceled" quando expira)
  --    → fatura = cancelado (mantemos o teu enum)
  if (NEW.estado in ('canceled','requires_payment_method','requires_action','processing','requires_confirmation','payment_failed')) then
    -- só marca cancelado se quiseres “fechar” a fatura quando a tentativa falhar/cancelar.
    -- Se preferires manter “pendente” para permitir nova tentativa, comenta este bloco.
    update public.fatura
       set estado_fatura = case
           when NEW.estado = 'canceled' then 'cancelado'   -- referência expirada ou cancelada
           else estado_fatura            -- falhas transitórias: mantém como está (ex.: pendente)
         end,
           cancelado_em  = case when NEW.estado = 'canceled' then now() else cancelado_em end,
           updated_at    = now()
     where id = NEW.fatura_id
       and estado_fatura <> 'pago';
  end if;

  return NEW;
end
$$;


ALTER FUNCTION "public"."fn_pagamento_aplica_na_fatura"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_valid_password"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT NOT must_reset_password
  FROM public.morador
  WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."has_valid_password"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.admin a
    where a.id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_active"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.admin a
    where a.id = auth.uid()
      and a.estado_utilizador = 'ativo'
  );
$$;


ALTER FUNCTION "public"."is_admin_active"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_condominio_admin"("p_condominio" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1 from public.condominio c
    where c.id = p_condominio and c.admin_id = auth.uid()
  )
$$;


ALTER FUNCTION "public"."is_condominio_admin"("p_condominio" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_morador"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (select 1 from public.morador m where m.id = auth.uid())
$$;


ALTER FUNCTION "public"."is_morador"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1 from public.admin
    where id = auth.uid() and is_super = true
  );
$$;


ALTER FUNCTION "public"."is_super"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin a
    WHERE a.id = user_id
      AND a.is_super IS TRUE
      AND a.estado_utilizador = 'ativo'
  );
$$;


ALTER FUNCTION "public"."is_super_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."morador_belongs_to_condo"("condo_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.propriedade p
    WHERE p.condominio_id = condo_id
      AND p.morador_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."morador_belongs_to_condo"("condo_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."morador_guard_admin_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  claims text := current_setting('request.jwt.claims', true);
begin
  if new.admin_id is distinct from old.admin_id then
    if claims is null or claims not like '%"role":"service_role"%' then
      raise exception 'admin_id is immutable';
    end if;
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."morador_guard_admin_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."my_condo_admin_is"("p_admin" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
      from public.propriedade pr
      join public.condominio c on c.id = pr.condominio_id
     where pr.morador_id = auth.uid()
       and c.admin_id = p_admin
  )
$$;


ALTER FUNCTION "public"."my_condo_admin_is"("p_admin" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."propriedade_set_nome"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.nome_propriedade :=
    -- Tipo com capitalização (Casa/Apartamento/etc.)
    initcap((NEW.tipo_propriedade)::text)
    || CASE WHEN NULLIF(NEW.numero,'') IS NOT NULL THEN ' Nº ' || NEW.numero ELSE '' END
    || CASE WHEN NULLIF(NEW.rua,'')    IS NOT NULL THEN ' '   || NEW.rua    ELSE '' END
    || CASE
         WHEN NEW.tipo_propriedade = 'apartamento'::public.tipo_propriedade
              AND NULLIF(NEW.andar,'') IS NOT NULL
         THEN ' - Andar ' || NEW.andar
         ELSE ''
       END;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."propriedade_set_nome"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_morador_id_on_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if public.is_morador() then
    new.morador_id := auth.uid();
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."set_morador_id_on_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_must_reset_password"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- só age se o utilizador estiver na tabela morador
  update public.morador
  set must_reset_password = false
  where id = new.id;

  return new;
end;
$$;


ALTER FUNCTION "public"."sync_must_reset_password"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."condominio" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tipo_condominio" "public"."tipo_condominio" NOT NULL,
    "nome" character varying(100) NOT NULL,
    "endereco" "text" NOT NULL,
    "admin_id" "uuid",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "estado_condominio" "public"."estado_condominio" DEFAULT 'ativo'::"public"."estado_condominio" NOT NULL
);


ALTER TABLE "public"."condominio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."morador" (
    "id" "uuid" NOT NULL,
    "nome" character varying(100) NOT NULL,
    "email" character varying(100) NOT NULL,
    "admin_id" "uuid",
    "telefone" character varying(20),
    "bi" character varying(20),
    "estado_utilizador" "public"."estado_utilizador" DEFAULT 'pendente'::"public"."estado_utilizador" NOT NULL,
    "foto" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "must_reset_password" boolean DEFAULT true NOT NULL,
    "morada" character varying
);


ALTER TABLE "public"."morador" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."propriedade" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "condominio_id" "uuid",
    "morador_id" "uuid",
    "tipo_propriedade" "public"."tipo_propriedade" NOT NULL,
    "estado_propriedade" "public"."estado_propriedade" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "rua" character varying(100),
    "numero" character varying(10),
    "andar" character varying(10),
    "tem_estacionamento" boolean DEFAULT false,
    "nome_propriedade" "text"
);

ALTER TABLE ONLY "public"."propriedade" REPLICA IDENTITY FULL;


ALTER TABLE "public"."propriedade" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."activity_feed" WITH ("security_invoker"='true') AS
 SELECT "m"."id",
    'morador'::"text" AS "tipo",
    ("m"."nome")::"text" AS "titulo",
    'Novo morador'::"text" AS "detalhe",
    "m"."created_at"
   FROM "public"."morador" "m"
UNION ALL
 SELECT "p"."id",
    'propriedade'::"text" AS "tipo",
    ("p"."tipo_propriedade")::"text" AS "titulo",
    TRIM(BOTH ', '::"text" FROM "concat_ws"(', '::"text", "p"."rua",
        CASE
            WHEN ("p"."numero" IS NOT NULL) THEN ('nº '::"text" || ("p"."numero")::"text")
            ELSE NULL::"text"
        END,
        CASE
            WHEN ("p"."andar" IS NOT NULL) THEN ('andar '::"text" || ("p"."andar")::"text")
            ELSE NULL::"text"
        END)) AS "detalhe",
    "p"."created_at"
   FROM "public"."propriedade" "p"
UNION ALL
 SELECT "c"."id",
    'condominio'::"text" AS "tipo",
    ("c"."nome")::"text" AS "titulo",
    "c"."endereco" AS "detalhe",
    "c"."created_at"
   FROM "public"."condominio" "c";


ALTER VIEW "public"."activity_feed" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin" (
    "id" "uuid" NOT NULL,
    "nome" character varying(100) NOT NULL,
    "email" character varying(100) NOT NULL,
    "foto" "text",
    "estado_utilizador" "public"."estado_utilizador" DEFAULT 'ativo'::"public"."estado_utilizador" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "is_super" boolean DEFAULT false
);


ALTER TABLE "public"."admin" OWNER TO "postgres";


COMMENT ON COLUMN "public"."admin"."is_super" IS 'boolean que indica se o administrador é super ou não.';



CREATE TABLE IF NOT EXISTS "public"."contato_condominio" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "condominio_id" "uuid",
    "telefone" character varying(20) NOT NULL,
    "entidade" character varying(100) NOT NULL
);


ALTER TABLE "public"."contato_condominio" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."condominio_totais_contatos" WITH ("security_invoker"='true') AS
 SELECT "c"."id",
    "c"."nome",
    "c"."endereco",
    "c"."tipo_condominio",
    "c"."created_at",
    "c"."updated_at",
    "count"("p".*) AS "total_casas",
    "count"(DISTINCT "p"."morador_id") FILTER (WHERE ("p"."morador_id" IS NOT NULL)) AS "total_moradores",
    COALESCE(( SELECT "json_agg"("json_build_object"('id', "cc"."id", 'telefone', "cc"."telefone", 'entidade', "cc"."entidade") ORDER BY "cc"."entidade") AS "json_agg"
           FROM "public"."contato_condominio" "cc"
          WHERE ("cc"."condominio_id" = "c"."id")), '[]'::json) AS "contatos"
   FROM ("public"."condominio" "c"
     LEFT JOIN "public"."propriedade" "p" ON (("p"."condominio_id" = "c"."id")))
  GROUP BY "c"."id", "c"."nome", "c"."endereco", "c"."tipo_condominio", "c"."created_at", "c"."updated_at";


ALTER VIEW "public"."condominio_totais_contatos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fatura" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "titulo" character varying(100) NOT NULL,
    "valor" numeric(10,2) NOT NULL,
    "estado_fatura" "public"."estado_fatura" NOT NULL,
    "tipo_fatura" "public"."tipo_fatura" NOT NULL,
    "admin_id" "uuid",
    "moeda" character varying(10) DEFAULT 'AOA'::character varying,
    "descricao" "text",
    "recibo_url" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "propriedade_id" "uuid" NOT NULL,
    "vencimento" timestamp without time zone,
    "pago_em" timestamp without time zone,
    "cancelado_em" timestamp without time zone,
    "expirado_em" timestamp without time zone
);


ALTER TABLE "public"."fatura" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fornecedor" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" character varying(100) NOT NULL,
    "email" character varying(100),
    "telefone" character varying(20),
    "endereco" "text",
    "avaliacao_media" numeric(3,2) DEFAULT 0,
    "disponibilidade" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."fornecedor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fornecedor_servico" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fornecedor_id" "uuid" NOT NULL,
    "tipo_servico" "public"."categoria_manutencao" NOT NULL,
    "preco_medio" numeric(10,2)
);


ALTER TABLE "public"."fornecedor_servico" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "titulo" character varying(100) NOT NULL,
    "descricao" "text",
    "foto" "text",
    "anexo" "text",
    "tipo_informacao" "public"."tipo_informacao" NOT NULL,
    "estado_informacao" "public"."estado_informacao" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "admin_id" "uuid",
    "condominio_id" "uuid" NOT NULL
);


ALTER TABLE "public"."info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pagamento" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fatura_id" "uuid" NOT NULL,
    "morador_id" "uuid",
    "valor" numeric(10,2) NOT NULL,
    "moeda" character varying(10) DEFAULT 'EUR'::character varying NOT NULL,
    "metodo" "public"."metodo_pagamento" NOT NULL,
    "provedor" "public"."provedor_pagamento" DEFAULT 'stripe'::"public"."provedor_pagamento" NOT NULL,
    "estado" "text" DEFAULT 'requires_payment_method'::"text" NOT NULL,
    "payment_intent" "text",
    "client_secret" "text",
    "mb_entidade" character varying(10),
    "mb_referencia" character varying(20),
    "mb_expires_at" timestamp without time zone,
    "mbway_phone" character varying(20),
    "mbway_transaction_id" "text",
    "raw_payload" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "paid_at" timestamp without time zone
);


ALTER TABLE "public"."pagamento" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pedido" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "titulo" character varying(100) NOT NULL,
    "descricao" "text",
    "tipo_pedido" "public"."tipo_pedido" NOT NULL,
    "estado_pedido" "public"."estado_pedido" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "morador_id" "uuid",
    "resposta" "text",
    "categoria" "public"."categoria_manutencao",
    "urgencia" "public"."urgencia_manutencao",
    "data_prevista" "date",
    "hora_prevista" time without time zone,
    "localizacao" "text",
    "orcamento_max" numeric(10,2),
    "fornecedor_id" "uuid"
);


ALTER TABLE "public"."pedido" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_fatura_ultimo_pagamento" AS
 SELECT "f"."id",
    "f"."titulo",
    "f"."valor",
    "f"."estado_fatura",
    "f"."tipo_fatura",
    "f"."admin_id",
    "f"."moeda",
    "f"."descricao",
    "f"."recibo_url",
    "f"."created_at",
    "f"."updated_at",
    "f"."propriedade_id",
    "f"."vencimento",
    "f"."pago_em",
    "f"."cancelado_em",
    "f"."expirado_em",
    "p2"."id" AS "pagamento_id",
    "p2"."metodo" AS "pagamento_metodo",
    "p2"."estado" AS "pagamento_estado",
    "p2"."mb_entidade",
    "p2"."mb_referencia",
    "p2"."mb_expires_at",
    "p2"."mbway_phone",
    "p2"."payment_intent",
    "p2"."paid_at"
   FROM ("public"."fatura" "f"
     LEFT JOIN LATERAL ( SELECT "p"."id",
            "p"."fatura_id",
            "p"."morador_id",
            "p"."valor",
            "p"."moeda",
            "p"."metodo",
            "p"."provedor",
            "p"."estado",
            "p"."payment_intent",
            "p"."client_secret",
            "p"."mb_entidade",
            "p"."mb_referencia",
            "p"."mb_expires_at",
            "p"."mbway_phone",
            "p"."mbway_transaction_id",
            "p"."raw_payload",
            "p"."created_at",
            "p"."updated_at",
            "p"."paid_at"
           FROM "public"."pagamento" "p"
          WHERE ("p"."fatura_id" = "f"."id")
          ORDER BY "p"."created_at" DESC
         LIMIT 1) "p2" ON (true));


ALTER VIEW "public"."v_fatura_ultimo_pagamento" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin"
    ADD CONSTRAINT "admin_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin"
    ADD CONSTRAINT "admin_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."condominio"
    ADD CONSTRAINT "condominio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contato_condominio"
    ADD CONSTRAINT "contato_condominio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fatura"
    ADD CONSTRAINT "fatura_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fornecedor"
    ADD CONSTRAINT "fornecedor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fornecedor_servico"
    ADD CONSTRAINT "fornecedor_servico_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."info"
    ADD CONSTRAINT "info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."morador"
    ADD CONSTRAINT "morador_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."morador"
    ADD CONSTRAINT "morador_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pagamento"
    ADD CONSTRAINT "pagamento_payment_intent_key" UNIQUE ("payment_intent");



ALTER TABLE ONLY "public"."pagamento"
    ADD CONSTRAINT "pagamento_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pedido"
    ADD CONSTRAINT "pedido_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."propriedade"
    ADD CONSTRAINT "propriedade_pkey" PRIMARY KEY ("id");



CREATE INDEX "condominio_nome_idx" ON "public"."condominio" USING "btree" ("nome");



CREATE INDEX "fatura_estado_idx" ON "public"."fatura" USING "btree" ("estado_fatura");



CREATE INDEX "fatura_propriedade_id_idx" ON "public"."fatura" USING "btree" ("propriedade_id");



CREATE INDEX "fatura_vencimento_idx" ON "public"."fatura" USING "btree" ("vencimento");



CREATE INDEX "info_condominio_id_idx" ON "public"."info" USING "btree" ("condominio_id");



CREATE INDEX "info_titulo_idx" ON "public"."info" USING "btree" ("titulo");



CREATE INDEX "morador_email_idx" ON "public"."morador" USING "btree" ("email");



CREATE INDEX "morador_nome_idx" ON "public"."morador" USING "btree" ("nome");



CREATE INDEX "pagamento_created_idx" ON "public"."pagamento" USING "btree" ("created_at");



CREATE INDEX "pagamento_estado_idx" ON "public"."pagamento" USING "btree" ("estado");



CREATE INDEX "pagamento_fatura_idx" ON "public"."pagamento" USING "btree" ("fatura_id");



CREATE INDEX "pagamento_morador_idx" ON "public"."pagamento" USING "btree" ("morador_id");



CREATE INDEX "pedido_morador_id_idx" ON "public"."pedido" USING "btree" ("morador_id");



CREATE INDEX "propriedade_condominio_idx" ON "public"."propriedade" USING "btree" ("condominio_id");



CREATE INDEX "propriedade_condominio_morador_idx" ON "public"."propriedade" USING "btree" ("condominio_id", "morador_id");



CREATE INDEX "propriedade_morador_id_idx" ON "public"."propriedade" USING "btree" ("morador_id");



CREATE INDEX "propriedade_nome_prop_idx" ON "public"."propriedade" USING "btree" ("nome_propriedade");



CREATE INDEX "propriedade_nome_propriedade_idx" ON "public"."propriedade" USING "btree" ("nome_propriedade");



CREATE INDEX "propriedade_texto_idx" ON "public"."propriedade" USING "btree" ("rua", "numero", "andar");



CREATE INDEX "propriedade_tipo_estado_idx" ON "public"."propriedade" USING "btree" ("tipo_propriedade", "estado_propriedade");



CREATE INDEX "propriedade_tipo_idx" ON "public"."propriedade" USING "btree" ("tipo_propriedade");



CREATE OR REPLACE TRIGGER "admin_set_updated_at" BEFORE UPDATE ON "public"."admin" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "condominio_set_updated_at" BEFORE UPDATE ON "public"."condominio" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "fatura_set_updated_at" BEFORE UPDATE ON "public"."fatura" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "info_set_updated_at" BEFORE UPDATE ON "public"."info" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "morador_guard_admin_id_trg" BEFORE UPDATE ON "public"."morador" FOR EACH ROW EXECUTE FUNCTION "public"."morador_guard_admin_id"();



CREATE OR REPLACE TRIGGER "morador_set_updated_at" BEFORE UPDATE ON "public"."morador" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "pagamento_set_updated_at" BEFORE UPDATE ON "public"."pagamento" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "pedido_set_morador_id_trg" BEFORE INSERT ON "public"."pedido" FOR EACH ROW EXECUTE FUNCTION "public"."set_morador_id_on_insert"();



CREATE OR REPLACE TRIGGER "pedido_set_updated_at" BEFORE UPDATE ON "public"."pedido" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "propriedade_set_nome_trg" BEFORE INSERT OR UPDATE OF "tipo_propriedade", "numero", "rua", "andar" ON "public"."propriedade" FOR EACH ROW EXECUTE FUNCTION "public"."propriedade_set_nome"();



CREATE OR REPLACE TRIGGER "propriedade_set_updated_at" BEFORE UPDATE ON "public"."propriedade" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_pagamento_aplica_na_fatura" AFTER INSERT OR UPDATE OF "estado", "paid_at" ON "public"."pagamento" FOR EACH ROW EXECUTE FUNCTION "public"."fn_pagamento_aplica_na_fatura"();



ALTER TABLE ONLY "public"."admin"
    ADD CONSTRAINT "admin_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."condominio"
    ADD CONSTRAINT "condominio_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contato_condominio"
    ADD CONSTRAINT "contato_condominio_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "public"."condominio"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fatura"
    ADD CONSTRAINT "fatura_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fatura"
    ADD CONSTRAINT "fatura_propriedade_id_fkey" FOREIGN KEY ("propriedade_id") REFERENCES "public"."propriedade"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fornecedor_servico"
    ADD CONSTRAINT "fornecedor_servico_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedor"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."info"
    ADD CONSTRAINT "info_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."info"
    ADD CONSTRAINT "info_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "public"."condominio"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."morador"
    ADD CONSTRAINT "morador_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."morador"
    ADD CONSTRAINT "morador_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pagamento"
    ADD CONSTRAINT "pagamento_fatura_id_fkey" FOREIGN KEY ("fatura_id") REFERENCES "public"."fatura"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pagamento"
    ADD CONSTRAINT "pagamento_morador_id_fkey" FOREIGN KEY ("morador_id") REFERENCES "public"."morador"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pedido"
    ADD CONSTRAINT "pedido_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedor"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pedido"
    ADD CONSTRAINT "pedido_morador_id_fkey" FOREIGN KEY ("morador_id") REFERENCES "public"."morador"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."propriedade"
    ADD CONSTRAINT "propriedade_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "public"."condominio"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."propriedade"
    ADD CONSTRAINT "propriedade_morador_id_fkey" FOREIGN KEY ("morador_id") REFERENCES "public"."morador"("id") ON DELETE SET NULL;



ALTER TABLE "public"."admin" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin delete invoices" ON "public"."fatura" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admin delete properties" ON "public"."propriedade" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admin insert invoices" ON "public"."fatura" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin insert moradores I manage" ON "public"."morador" FOR INSERT TO "authenticated" WITH CHECK ((("public"."is_admin"() AND ("admin_id" = "auth"."uid"())) OR "public"."is_super"()));



CREATE POLICY "admin insert properties" ON "public"."propriedade" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage contacts of condos" ON "public"."contato_condominio" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage infos" ON "public"."info" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin read invoices" ON "public"."fatura" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admin read my moradores" ON "public"."morador" FOR SELECT TO "authenticated" USING ((("public"."is_admin"() AND ("admin_id" = "auth"."uid"())) OR "public"."is_super"()));



CREATE POLICY "admin read self" ON "public"."admin" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "admin read tickets of my condos" ON "public"."pedido" FOR SELECT TO "authenticated" USING ((("public"."is_admin"() AND (EXISTS ( SELECT 1
   FROM ("public"."propriedade" "pr"
     JOIN "public"."condominio" "c" ON (("c"."id" = "pr"."condominio_id")))
  WHERE (("pr"."morador_id" = "pedido"."morador_id") AND ("c"."admin_id" = "auth"."uid"()))))) OR "public"."is_super"()));



CREATE POLICY "admin select condos" ON "public"."condominio" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admin select properties" ON "public"."propriedade" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "admin update invoices" ON "public"."fatura" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin update my moradores" ON "public"."morador" FOR UPDATE TO "authenticated" USING ((("public"."is_admin"() AND ("admin_id" = "auth"."uid"())) OR "public"."is_super"())) WITH CHECK ((("public"."is_admin"() AND ("admin_id" = "auth"."uid"())) OR "public"."is_super"()));



CREATE POLICY "admin update properties" ON "public"."propriedade" FOR UPDATE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "admin update self" ON "public"."admin" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "admin update tickets of my condos" ON "public"."pedido" FOR UPDATE TO "authenticated" USING ((("public"."is_admin"() AND (EXISTS ( SELECT 1
   FROM ("public"."propriedade" "pr"
     JOIN "public"."condominio" "c" ON (("c"."id" = "pr"."condominio_id")))
  WHERE (("pr"."morador_id" = "pedido"."morador_id") AND ("c"."admin_id" = "auth"."uid"()))))) OR "public"."is_super"())) WITH CHECK ((("public"."is_admin"() AND (EXISTS ( SELECT 1
   FROM ("public"."propriedade" "pr"
     JOIN "public"."condominio" "c" ON (("c"."id" = "pr"."condominio_id")))
  WHERE (("pr"."morador_id" = "pedido"."morador_id") AND ("c"."admin_id" = "auth"."uid"()))))) OR "public"."is_super"()));



CREATE POLICY "admins ativos podem ler todos" ON "public"."admin" FOR SELECT TO "authenticated" USING ("public"."is_admin_active"());



ALTER TABLE "public"."condominio" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contato_condominio" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fatura" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."morador" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "morador insert own ticket" ON "public"."pedido" FOR INSERT TO "authenticated" WITH CHECK (("morador_id" = "auth"."uid"()));



CREATE POLICY "morador read contacts of my condos" ON "public"."contato_condominio" FOR SELECT TO "authenticated" USING (("public"."belongs_to_condominio"("condominio_id") AND "public"."has_valid_password"()));



CREATE POLICY "morador read infos" ON "public"."info" FOR SELECT TO "authenticated" USING ("public"."morador_belongs_to_condo"("condominio_id"));



CREATE POLICY "morador read own properties" ON "public"."propriedade" FOR SELECT TO "authenticated" USING ((("morador_id" = "auth"."uid"()) AND "public"."has_valid_password"()));



CREATE POLICY "morador read own tickets" ON "public"."pedido" FOR SELECT TO "authenticated" USING ((("morador_id" = "auth"."uid"()) AND "public"."has_valid_password"()));



CREATE POLICY "morador read self" ON "public"."morador" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) AND "public"."has_valid_password"()));



CREATE POLICY "morador update own properties" ON "public"."propriedade" FOR UPDATE TO "authenticated" USING ((("morador_id" = "auth"."uid"()) AND "public"."has_valid_password"())) WITH CHECK ((("morador_id" = "auth"."uid"()) AND "public"."has_valid_password"()));



CREATE POLICY "morador update own tickets while pending" ON "public"."pedido" FOR UPDATE TO "authenticated" USING ((("morador_id" = "auth"."uid"()) AND ("estado_pedido" = 'pendente'::"public"."estado_pedido") AND "public"."has_valid_password"())) WITH CHECK ((("morador_id" = "auth"."uid"()) AND "public"."has_valid_password"()));



CREATE POLICY "morador update self" ON "public"."morador" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) AND "public"."has_valid_password"())) WITH CHECK ((("id" = "auth"."uid"()) AND "public"."has_valid_password"()));



CREATE POLICY "morador_ve_seus_pagamentos" ON "public"."pagamento" FOR SELECT TO "authenticated" USING (("fatura_id" IN ( SELECT "f"."id"
   FROM ("public"."fatura" "f"
     JOIN "public"."propriedade" "p" ON (("p"."id" = "f"."propriedade_id")))
  WHERE ("p"."morador_id" = "auth"."uid"()))));



CREATE POLICY "morador_ve_suas_faturas" ON "public"."fatura" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."propriedade" "p"
  WHERE (("p"."id" = "fatura"."propriedade_id") AND ("p"."morador_id" = "auth"."uid"())))));



ALTER TABLE "public"."pagamento" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pedido" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "permitir ler a flag antes de trocar senha" ON "public"."morador" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."propriedade" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "super admin insert condos" ON "public"."condominio" TO "authenticated" WITH CHECK (("public"."is_admin"() AND "public"."is_super"()));



CREATE POLICY "super admin update  condos" ON "public"."condominio" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() AND "public"."is_super"())) WITH CHECK (("public"."is_admin"() AND "public"."is_super"()));



CREATE POLICY "super_can_create_admin" ON "public"."admin" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."admin" "me"
  WHERE (("me"."id" = "auth"."uid"()) AND ("me"."is_super" = true)))) AND ("is_super" = false)));



CREATE POLICY "super_can_delete_admins" ON "public"."admin" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin" "me"
  WHERE (("me"."id" = "auth"."uid"()) AND ("me"."is_super" = true)))));



CREATE POLICY "super_can_update_admins" ON "public"."admin" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin" "me"
  WHERE (("me"."id" = "auth"."uid"()) AND ("me"."is_super" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admin" "me"
  WHERE (("me"."id" = "auth"."uid"()) AND ("me"."is_super" = true)))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."admin";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."condominio";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."contato_condominio";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."fatura";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."info";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."morador";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."pedido";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."propriedade";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."belongs_to_condominio"("p_condominio" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."belongs_to_condominio"("p_condominio" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."belongs_to_condominio"("p_condominio" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_pagamento_aplica_na_fatura"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_pagamento_aplica_na_fatura"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_pagamento_aplica_na_fatura"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_valid_password"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_valid_password"() TO "anon";
GRANT ALL ON FUNCTION "public"."has_valid_password"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_valid_password"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin_active"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin_active"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_active"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_active"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_condominio_admin"("p_condominio" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_condominio_admin"("p_condominio" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_condominio_admin"("p_condominio" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_morador"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_morador"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_morador"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."morador_belongs_to_condo"("condo_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."morador_belongs_to_condo"("condo_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."morador_belongs_to_condo"("condo_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."morador_guard_admin_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."morador_guard_admin_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."morador_guard_admin_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."my_condo_admin_is"("p_admin" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."my_condo_admin_is"("p_admin" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."my_condo_admin_is"("p_admin" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."propriedade_set_nome"() TO "anon";
GRANT ALL ON FUNCTION "public"."propriedade_set_nome"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."propriedade_set_nome"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_morador_id_on_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_morador_id_on_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_morador_id_on_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_must_reset_password"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_must_reset_password"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_must_reset_password"() TO "service_role";


















GRANT ALL ON TABLE "public"."condominio" TO "anon";
GRANT ALL ON TABLE "public"."condominio" TO "authenticated";
GRANT ALL ON TABLE "public"."condominio" TO "service_role";



GRANT ALL ON TABLE "public"."morador" TO "anon";
GRANT ALL ON TABLE "public"."morador" TO "authenticated";
GRANT ALL ON TABLE "public"."morador" TO "service_role";



GRANT ALL ON TABLE "public"."propriedade" TO "anon";
GRANT ALL ON TABLE "public"."propriedade" TO "authenticated";
GRANT ALL ON TABLE "public"."propriedade" TO "service_role";



GRANT ALL ON TABLE "public"."activity_feed" TO "anon";
GRANT ALL ON TABLE "public"."activity_feed" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_feed" TO "service_role";



GRANT ALL ON TABLE "public"."admin" TO "anon";
GRANT ALL ON TABLE "public"."admin" TO "authenticated";
GRANT ALL ON TABLE "public"."admin" TO "service_role";



GRANT ALL ON TABLE "public"."contato_condominio" TO "anon";
GRANT ALL ON TABLE "public"."contato_condominio" TO "authenticated";
GRANT ALL ON TABLE "public"."contato_condominio" TO "service_role";



GRANT ALL ON TABLE "public"."condominio_totais_contatos" TO "anon";
GRANT ALL ON TABLE "public"."condominio_totais_contatos" TO "authenticated";
GRANT ALL ON TABLE "public"."condominio_totais_contatos" TO "service_role";



GRANT ALL ON TABLE "public"."fatura" TO "anon";
GRANT ALL ON TABLE "public"."fatura" TO "authenticated";
GRANT ALL ON TABLE "public"."fatura" TO "service_role";



GRANT ALL ON TABLE "public"."fornecedor" TO "anon";
GRANT ALL ON TABLE "public"."fornecedor" TO "authenticated";
GRANT ALL ON TABLE "public"."fornecedor" TO "service_role";



GRANT ALL ON TABLE "public"."fornecedor_servico" TO "anon";
GRANT ALL ON TABLE "public"."fornecedor_servico" TO "authenticated";
GRANT ALL ON TABLE "public"."fornecedor_servico" TO "service_role";



GRANT ALL ON TABLE "public"."info" TO "anon";
GRANT ALL ON TABLE "public"."info" TO "authenticated";
GRANT ALL ON TABLE "public"."info" TO "service_role";



GRANT ALL ON TABLE "public"."pagamento" TO "anon";
GRANT ALL ON TABLE "public"."pagamento" TO "authenticated";
GRANT ALL ON TABLE "public"."pagamento" TO "service_role";



GRANT ALL ON TABLE "public"."pedido" TO "anon";
GRANT ALL ON TABLE "public"."pedido" TO "authenticated";
GRANT ALL ON TABLE "public"."pedido" TO "service_role";



GRANT ALL ON TABLE "public"."v_fatura_ultimo_pagamento" TO "anon";
GRANT ALL ON TABLE "public"."v_fatura_ultimo_pagamento" TO "authenticated";
GRANT ALL ON TABLE "public"."v_fatura_ultimo_pagamento" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER trg_sync_must_reset_password AFTER UPDATE OF encrypted_password ON auth.users FOR EACH ROW WHEN (((new.encrypted_password)::text IS DISTINCT FROM (old.encrypted_password)::text)) EXECUTE FUNCTION public.sync_must_reset_password();


  create policy "admin upload info_anexos"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'info_anexos'::text) AND public.is_admin()));



  create policy "allow_all_user_fotos"
  on "storage"."objects"
  as permissive
  for all
  to public
using ((bucket_id = 'user_fotos'::text))
with check ((bucket_id = 'user_fotos'::text));



  create policy "permitir leitura info_anexos"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'info_anexos'::text));



  create policy "permitir upload info_anexos"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'info_anexos'::text));



  create policy "read_user_fotos_any"
  on "storage"."objects"
  as permissive
  for select
  to authenticated, anon
using ((bucket_id = 'user_fotos'::text));



  create policy "recibos-insert-only-service"
  on "storage"."objects"
  as permissive
  for insert
  to service_role
with check ((bucket_id = 'recibos'::text));



  create policy "recibos-public-read"
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((bucket_id = 'recibos'::text));



  create policy "select_info_fotos_read"
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((bucket_id = 'info_fotos'::text));



  create policy "upload_info_fotos_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'info_fotos'::text));



  create policy "upload_user_fotos_any"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'user_fotos'::text));



