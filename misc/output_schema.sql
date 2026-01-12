--
-- PostgreSQL database dump
--

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: conversation_status_enum; Type: TYPE; Schema: public; Owner: michael.angelo.diaz
--

CREATE TYPE public.conversation_status_enum AS ENUM (
    'PENDING',
    'START',
    'ON_REQ',
    'ON_JOB_QUESTIONS',
    'DONE'
);


ALTER TYPE public.conversation_status_enum OWNER TO "michael.angelo.diaz";

--
-- Name: message_sender_enum; Type: TYPE; Schema: public; Owner: michael.angelo.diaz
--

CREATE TYPE public.message_sender_enum AS ENUM (
    'USER',
    'ASSISTANT',
    'SYSTEM'
);


ALTER TYPE public.message_sender_enum OWNER TO "michael.angelo.diaz";

--
-- Name: requirement_status_enum; Type: TYPE; Schema: public; Owner: michael.angelo.diaz
--

CREATE TYPE public.requirement_status_enum AS ENUM (
    'PENDING',
    'MET',
    'NOT_MET'
);


ALTER TYPE public.requirement_status_enum OWNER TO "michael.angelo.diaz";

--
-- Name: screening_decision_enum; Type: TYPE; Schema: public; Owner: michael.angelo.diaz
--

CREATE TYPE public.screening_decision_enum AS ENUM (
    'APPROVED',
    'DENIED',
    'USER_CANCELED',
    'PENDING'
);


ALTER TYPE public.screening_decision_enum OWNER TO "michael.angelo.diaz";

--
-- Name: job_requirement_type_enum; Type: TYPE; Schema: public; Owner: michael.angelo.diaz
--

CREATE TYPE public.job_requirement_type_enum AS ENUM (
    'CDL_CLASS',
    'YEARS_EXPERIENCE',
    'DRIVING_RECORD',
    'ENDORSEMENTS',
    'AGE_REQUIREMENT',
    'PHYSICAL_EXAM',
    'DRUG_TEST',
    'BACKGROUND_CHECK',
    'GEOGRAPHIC_RESTRICTION'
);


ALTER TYPE public.job_requirement_type_enum OWNER TO "michael.angelo.diaz";

--
-- Name: job_fact_type_enum; Type: TYPE; Schema: public; Owner: michael.angelo.diaz
--

CREATE TYPE public.job_fact_type_enum AS ENUM (
    'ROUTE_TYPE',
    'EQUIPMENT',
    'BENEFITS',
    'SCHEDULE',
    'COMPANY_SIZE',
    'SAFETY_RATING',
    'MILES_PER_WEEK',
    'LOAD_TYPE'
);


ALTER TYPE public.job_fact_type_enum OWNER TO "michael.angelo.diaz";

--
-- Name: are_all_requirements_completed(uuid); Type: FUNCTION; Schema: public; Owner: michael.angelo.diaz
--

CREATE FUNCTION public.are_all_requirements_completed(p_conversation_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    SELECT NOT EXISTS (
        SELECT 1 
        FROM conversation_job_requirements
        WHERE conversation_id = p_conversation_id
            AND status = 'PENDING'
    );
$$;


ALTER FUNCTION public.are_all_requirements_completed(p_conversation_id uuid) OWNER TO "michael.angelo.diaz";

--
-- Name: get_conversation_job_facts(uuid); Type: FUNCTION; Schema: public; Owner: michael.angelo.diaz
--

CREATE FUNCTION public.get_conversation_job_facts(p_conversation_id uuid) RETURNS TABLE(fact_type character varying, content text)
    LANGUAGE sql STABLE
    AS $$
    SELECT jf.fact_type, jf.content
    FROM conversations c
    JOIN applications a ON c.application_id = a.id
    JOIN job_facts jf ON a.job_id = jf.job_id
    WHERE c.id = p_conversation_id
    ORDER BY jf.fact_type;
$$;


ALTER FUNCTION public.get_conversation_job_facts(p_conversation_id uuid) OWNER TO "michael.angelo.diaz";

--
-- Name: get_conversation_messages(uuid); Type: FUNCTION; Schema: public; Owner: michael.angelo.diaz
--

CREATE FUNCTION public.get_conversation_messages(p_conversation_id uuid) RETURNS TABLE(id uuid, conversation_id uuid, sender public.message_sender_enum, content text, created_at timestamp with time zone)
    LANGUAGE sql STABLE
    AS $$
    SELECT id, conversation_id, sender, content, created_at
    FROM messages
    WHERE conversation_id = p_conversation_id
    ORDER BY created_at ASC;
$$;


ALTER FUNCTION public.get_conversation_messages(p_conversation_id uuid) OWNER TO "michael.angelo.diaz";

--
-- Name: FUNCTION get_conversation_messages(p_conversation_id uuid); Type: COMMENT; Schema: public; Owner: michael.angelo.diaz
--

COMMENT ON FUNCTION public.get_conversation_messages(p_conversation_id uuid) IS 'Fast ordered message retrieval for conversation history.';


--
-- Name: get_conversation_requirements(uuid); Type: FUNCTION; Schema: public; Owner: michael.angelo.diaz
--

CREATE FUNCTION public.get_conversation_requirements(p_conversation_id uuid) RETURNS TABLE(conversation_job_requirement_id uuid, job_requirement_id uuid, requirement_type public.job_requirement_type_enum, requirement_description text, criteria jsonb, priority integer, status public.requirement_status_enum, extracted_value jsonb, evaluated_at timestamp with time zone, message_id uuid)
    LANGUAGE sql STABLE
    AS $$
    SELECT 
        cjr.id as conversation_job_requirement_id,
        jr.id as job_requirement_id,
        jr.requirement_type,
        jr.requirement_description,
        jr.criteria,
        jr.priority,
        cjr.status,
        cjr.extracted_value,
        cjr.evaluated_at,
        cjr.message_id
    FROM conversation_job_requirements cjr
    JOIN job_requirements jr ON cjr.job_requirement_id = jr.id
    WHERE cjr.conversation_id = p_conversation_id
    ORDER BY jr.priority ASC;
$$;


ALTER FUNCTION public.get_conversation_requirements(p_conversation_id uuid) OWNER TO "michael.angelo.diaz";

--
-- Name: FUNCTION get_conversation_requirements(p_conversation_id uuid); Type: COMMENT; Schema: public; Owner: michael.angelo.diaz
--

COMMENT ON FUNCTION public.get_conversation_requirements(p_conversation_id uuid) IS 'Get all requirements with status for a conversation in priority order.';


--
-- Name: get_next_pending_requirement(uuid); Type: FUNCTION; Schema: public; Owner: michael.angelo.diaz
--

CREATE FUNCTION public.get_next_pending_requirement(p_conversation_id uuid) RETURNS TABLE(conversation_job_requirement_id uuid, job_requirement_id uuid, requirement_type public.job_requirement_type_enum, requirement_description text, criteria jsonb, priority integer)
    LANGUAGE sql STABLE
    AS $$
    SELECT 
        cjr.id as conversation_job_requirement_id,
        jr.id as job_requirement_id,
        jr.requirement_type,
        jr.requirement_description,
        jr.criteria,
        jr.priority
    FROM conversation_job_requirements cjr
    JOIN job_requirements jr ON cjr.job_requirement_id = jr.id
    WHERE cjr.conversation_id = p_conversation_id
        AND cjr.status = 'PENDING'
    ORDER BY jr.priority ASC
    LIMIT 1;
$$;


ALTER FUNCTION public.get_next_pending_requirement(p_conversation_id uuid) OWNER TO "michael.angelo.diaz";

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: michael.angelo.diaz
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO "michael.angelo.diaz";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: michael.angelo.diaz
--

CREATE TABLE public.applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    job_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.applications OWNER TO "michael.angelo.diaz";

--
-- Name: conversation_job_requirements; Type: TABLE; Schema: public; Owner: michael.angelo.diaz
--

CREATE TABLE public.conversation_job_requirements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    job_requirement_id uuid NOT NULL,
    status public.requirement_status_enum DEFAULT 'PENDING'::public.requirement_status_enum,
    extracted_value jsonb,
    evaluated_at timestamp with time zone,
    message_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.conversation_job_requirements OWNER TO "michael.angelo.diaz";

--
-- Name: TABLE conversation_job_requirements; Type: COMMENT; Schema: public; Owner: michael.angelo.diaz
--

COMMENT ON TABLE public.conversation_job_requirements IS 'Tracks evaluation status of each job requirement in a conversation. Better name than conversation_requirements.';


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: michael.angelo.diaz
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    is_active boolean DEFAULT true,
    conversation_status public.conversation_status_enum DEFAULT 'PENDING'::public.conversation_status_enum,
    screening_decision public.screening_decision_enum DEFAULT 'PENDING'::public.screening_decision_enum,
    screening_summary text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.conversations OWNER TO "michael.angelo.diaz";

--
-- Name: job_facts; Type: TABLE; Schema: public; Owner: michael.angelo.diaz
--

CREATE TABLE public.job_facts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    fact_type public.job_fact_type_enum NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.job_facts OWNER TO "michael.angelo.diaz";

--
-- Name: job_requirements; Type: TABLE; Schema: public; Owner: michael.angelo.diaz
--

CREATE TABLE public.job_requirements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    requirement_type public.job_requirement_type_enum NOT NULL,
    requirement_description text NOT NULL,
    criteria jsonb NOT NULL,
    priority integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.job_requirements OWNER TO "michael.angelo.diaz";

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: michael.angelo.diaz
--

CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    location text,
    is_active boolean DEFAULT true,
    payment_info jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.jobs OWNER TO "michael.angelo.diaz";

--
-- Name: messages; Type: TABLE; Schema: public; Owner: michael.angelo.diaz
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender public.message_sender_enum NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.messages OWNER TO "michael.angelo.diaz";

--
-- Name: TABLE messages; Type: COMMENT; Schema: public; Owner: michael.angelo.diaz
--

COMMENT ON TABLE public.messages IS 'Chat messages in conversations. Optimized for fast ordered reads for websocket.';


--
-- Name: users; Type: TABLE; Schema: public; Owner: michael.angelo.diaz
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email text NOT NULL,
    password text,
    address text,
    apt_num character varying(20),
    state character varying(50),
    zip_code character varying(10),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO "michael.angelo.diaz";

--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: applications applications_user_id_job_id_key; Type: CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_user_id_job_id_key UNIQUE (user_id, job_id);


--
-- Name: conversation_job_requirements conversation_job_requirements_conversation_id_job_requireme_key; Type: CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.conversation_job_requirements
    ADD CONSTRAINT conversation_job_requirements_conversation_id_job_requireme_key UNIQUE (conversation_id, job_requirement_id);


--
-- Name: conversation_job_requirements conversation_job_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.conversation_job_requirements
    ADD CONSTRAINT conversation_job_requirements_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: job_facts job_facts_job_id_fact_type_key; Type: CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.job_facts
    ADD CONSTRAINT job_facts_job_id_fact_type_key UNIQUE (job_id, fact_type);


--
-- Name: job_facts job_facts_pkey; Type: CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.job_facts
    ADD CONSTRAINT job_facts_pkey PRIMARY KEY (id);


--
-- Name: job_requirements job_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.job_requirements
    ADD CONSTRAINT job_requirements_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_conv_job_req_conversation_status; Type: INDEX; Schema: public; Owner: michael.angelo.diaz
--

CREATE INDEX idx_conv_job_req_conversation_status ON public.conversation_job_requirements USING btree (conversation_id, status);


--
-- Name: idx_conversations_application; Type: INDEX; Schema: public; Owner: michael.angelo.diaz
--

CREATE INDEX idx_conversations_application ON public.conversations USING btree (application_id) WHERE (is_active = true);


--
-- Name: idx_job_facts_job_type; Type: INDEX; Schema: public; Owner: michael.angelo.diaz
--

CREATE INDEX idx_job_facts_job_type ON public.job_facts USING btree (job_id, fact_type);


--
-- Name: idx_job_requirements_job_priority; Type: INDEX; Schema: public; Owner: michael.angelo.diaz
--

CREATE INDEX idx_job_requirements_job_priority ON public.job_requirements USING btree (job_id, priority);


--
-- Name: idx_messages_conversation_created; Type: INDEX; Schema: public; Owner: michael.angelo.diaz
--

CREATE INDEX idx_messages_conversation_created ON public.messages USING btree (conversation_id, created_at);


--
-- Name: conversation_job_requirements update_conversation_job_requirements_updated_at; Type: TRIGGER; Schema: public; Owner: michael.angelo.diaz
--

CREATE TRIGGER update_conversation_job_requirements_updated_at BEFORE UPDATE ON public.conversation_job_requirements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: michael.angelo.diaz
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: applications applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: applications applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversation_job_requirements conversation_job_requirements_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.conversation_job_requirements
    ADD CONSTRAINT conversation_job_requirements_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_job_requirements conversation_job_requirements_job_requirement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.conversation_job_requirements
    ADD CONSTRAINT conversation_job_requirements_job_requirement_id_fkey FOREIGN KEY (job_requirement_id) REFERENCES public.job_requirements(id) ON DELETE CASCADE;


--
-- Name: conversation_job_requirements conversation_job_requirements_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.conversation_job_requirements
    ADD CONSTRAINT conversation_job_requirements_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- Name: job_facts job_facts_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.job_facts
    ADD CONSTRAINT job_facts_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: job_requirements job_requirements_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.job_requirements
    ADD CONSTRAINT job_requirements_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: michael.angelo.diaz
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

