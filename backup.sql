--
-- PostgreSQL database dump
--

\restrict r8eBheEqatsmp7YzkTq87Nht0nxlqi05aMURJLeA4weOLdEnnzULsVDLf6KsT1C

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: AuthProvider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuthProvider" AS ENUM (
    'LOCAL',
    'GOOGLE',
    'FACEBOOK',
    'ZALO'
);


--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'BOOKING_CREATED',
    'BOOKING_CONFIRMED',
    'BOOKING_CANCELLED',
    'BOOKING_REMINDER',
    'PAYMENT_RECEIVED',
    'REVIEW_RECEIVED',
    'PROMOTION',
    'SYSTEM'
);


--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'BANK_TRANSFER',
    'VIETQR'
);


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'UNPAID',
    'PENDING',
    'PAID',
    'REFUNDED'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'CUSTOMER',
    'STAFF',
    'SALON_OWNER',
    'SUPER_ADMIN'
);


--
-- Name: ServiceCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ServiceCategory" AS ENUM (
    'HAIRCUT',
    'HAIR_STYLING',
    'HAIR_COLORING',
    'HAIR_TREATMENT',
    'SHAVE',
    'FACIAL',
    'COMBO',
    'OTHER'
);


--
-- Name: StaffPosition; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StaffPosition" AS ENUM (
    'STYLIST',
    'SENIOR_STYLIST',
    'MASTER_STYLIST',
    'SKINNER',
    'MANAGER'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: booking_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_services (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "serviceId" text NOT NULL,
    price numeric(10,0) NOT NULL,
    duration integer NOT NULL
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id text NOT NULL,
    "bookingCode" text NOT NULL,
    "customerId" text NOT NULL,
    "salonId" text NOT NULL,
    "staffId" text,
    date date NOT NULL,
    "timeSlot" text NOT NULL,
    "endTime" text NOT NULL,
    "totalDuration" integer NOT NULL,
    "totalAmount" numeric(10,0) NOT NULL,
    status public."BookingStatus" DEFAULT 'PENDING'::public."BookingStatus" NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'UNPAID'::public."PaymentStatus" NOT NULL,
    "paymentMethod" public."PaymentMethod",
    note text,
    "cancelReason" text,
    "cancelledAt" timestamp(3) without time zone,
    "cancelledBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    amount numeric(10,0) NOT NULL,
    method public."PaymentMethod" NOT NULL,
    "qrCode" text,
    "qrContent" text,
    "bankCode" text,
    "bankAccount" text,
    "sepayTransId" text,
    "sepayRef" text,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "deviceInfo" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "customerId" text NOT NULL,
    "salonId" text NOT NULL,
    rating integer NOT NULL,
    comment text,
    images text[],
    reply text,
    "repliedAt" timestamp(3) without time zone,
    "isVisible" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: salons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salons (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    address text NOT NULL,
    city text NOT NULL,
    district text NOT NULL,
    ward text,
    latitude double precision,
    longitude double precision,
    phone text NOT NULL,
    email text,
    "openTime" text DEFAULT '08:30'::text NOT NULL,
    "closeTime" text DEFAULT '20:30'::text NOT NULL,
    "workingDays" text[] DEFAULT ARRAY['Mon'::text, 'Tue'::text, 'Wed'::text, 'Thu'::text, 'Fri'::text, 'Sat'::text, 'Sun'::text],
    logo text,
    "coverImage" text,
    images text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "ownerId" text NOT NULL,
    "bankCode" text,
    "bankAccount" text,
    "bankName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,0) NOT NULL,
    duration integer NOT NULL,
    category public."ServiceCategory" NOT NULL,
    image text,
    "isActive" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "salonId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: staff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff (
    id text NOT NULL,
    "position" public."StaffPosition" NOT NULL,
    bio text,
    rating double precision DEFAULT 5.0 NOT NULL,
    "totalReviews" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "userId" text NOT NULL,
    "salonId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: staff_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_schedules (
    id text NOT NULL,
    "staffId" text NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "isOff" boolean DEFAULT false NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text,
    phone text,
    password text,
    name text,
    avatar text,
    "googleId" text,
    "facebookId" text,
    "zaloId" text,
    "authProvider" public."AuthProvider" DEFAULT 'LOCAL'::public."AuthProvider" NOT NULL,
    role public."Role" DEFAULT 'CUSTOMER'::public."Role" NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastLoginAt" timestamp(3) without time zone
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
aae84edf-76d9-4c6e-b4dc-c5566a9b627d	c9194d70c2a0bce7078e5f88e6c21499d11bdf448d8e88b992b788293b258d21	2026-02-04 18:27:52.40101+00	20260204182752_init	\N	\N	2026-02-04 18:27:52.257169+00	1
950f9746-0716-4943-8dcf-b58520abf556	be8f754de0d94d737f5bebf3a4c47abcda5aafb22f7940e9d3fb39afa21e4bfe	2026-02-05 08:15:26.005344+00	20260205081525_add_password_reset_token	\N	\N	2026-02-05 08:15:25.982256+00	1
\.


--
-- Data for Name: booking_services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booking_services (id, "bookingId", "serviceId", price, duration) FROM stdin;
353a9f36-be2d-417f-852e-872d4c8cda92	e0026f1c-809a-49ab-aab1-c8521f7fa8ad	14412c2e-521b-4e16-a073-85b7156447af	300000	90
e798e831-65ad-4037-acc1-2c3d86067d5d	3ccabd8f-b53f-41b5-a0e8-ca802ee731eb	50424977-06b1-4148-9756-525adfb992fe	100000	30
14e61b73-35f6-436a-92cb-466cff2ab090	a3389179-7718-4082-96b6-ed1d41ff90c4	ba7f84c8-5bf0-4ef3-99cf-ff610307764e	350000	120
0d7f4aa2-0ebb-411a-bbea-a0dd83d851f1	3815b906-711f-4056-a74e-51a4752d5752	5867fa7c-a945-4fbf-877e-fe8a405e003b	150000	45
da22d82e-3b26-485f-ace6-cbc6cbd8742e	fbf62dc0-ff64-40aa-9388-251c62f62f8c	e7c49263-0137-44a4-8662-449cb8eb523a	80000	25
de3238f3-5f42-4b19-91ae-1ed90e786bce	f9ae0d5d-ac0d-4cbf-bae5-055f964c5a27	36fd3251-cb41-4efe-b275-0171fd5d0785	350000	120
f13c8e1f-350a-4d5d-9d61-b807f8671b6e	e3a11e2c-5e15-4b37-af71-360403c31a20	36fd3251-cb41-4efe-b275-0171fd5d0785	350000	120
6a7e0abf-a9fc-46a6-80b5-6bb9cbf4416f	06d2399d-9527-4d06-9fd0-a1888844369f	3386cdf9-c3f1-4962-9f2f-47a6890f5bab	150000	45
89ea03c0-8329-445d-b69c-2cd472f4ea24	85c929fd-f7d5-43a5-b17b-fc0d1f39da0f	5867fa7c-a945-4fbf-877e-fe8a405e003b	150000	45
b5335f0a-8a0f-4b27-86ae-e2c18ace6169	7100c074-34f7-41b6-a5b6-608b1817c70c	cf972808-250f-4598-bb78-c524a042f92d	80000	25
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, "bookingCode", "customerId", "salonId", "staffId", date, "timeSlot", "endTime", "totalDuration", "totalAmount", status, "paymentStatus", "paymentMethod", note, "cancelReason", "cancelledAt", "cancelledBy", "createdAt", "updatedAt") FROM stdin;
e0026f1c-809a-49ab-aab1-c8521f7fa8ad	BK17702301020130	00fc5e4a-6a37-45e8-a384-8d314f2257e4	120a4eeb-a638-4993-99d1-73a0c345d310	6895789d-7fe4-4b32-b3a9-2b5f394526d0	2026-01-31	15:00	17:00	90	300000	CANCELLED	UNPAID	\N	\N	\N	\N	\N	2026-02-04 18:35:02.015	2026-02-04 18:35:02.015
3ccabd8f-b53f-41b5-a0e8-ca802ee731eb	BK17702301020261	00fc5e4a-6a37-45e8-a384-8d314f2257e4	0aa90c3a-2218-409d-afc5-f2bbdc94384a	74674b67-8d93-4f83-ae4f-97843ddf99df	2026-01-30	15:00	16:00	30	100000	PENDING	UNPAID	\N	\N	\N	\N	\N	2026-02-04 18:35:02.027	2026-02-04 18:35:02.027
a3389179-7718-4082-96b6-ed1d41ff90c4	BK17702301020322	28cceb16-b40a-4148-9f12-527daa0fa670	0aa90c3a-2218-409d-afc5-f2bbdc94384a	305a9b3c-64d0-4584-8109-ca8d2d3d4072	2026-01-31	09:00	11:00	120	350000	CANCELLED	UNPAID	\N	\N	\N	\N	\N	2026-02-04 18:35:02.033	2026-02-04 18:35:02.033
3815b906-711f-4056-a74e-51a4752d5752	BK17702301020383	28cceb16-b40a-4148-9f12-527daa0fa670	120a4eeb-a638-4993-99d1-73a0c345d310	6895789d-7fe4-4b32-b3a9-2b5f394526d0	2026-02-01	10:00	11:00	45	150000	CANCELLED	UNPAID	\N	\N	\N	\N	\N	2026-02-04 18:35:02.039	2026-02-04 18:35:02.039
fbf62dc0-ff64-40aa-9388-251c62f62f8c	BK17702301020444	2912da8b-1f24-437c-9164-5c467e67519c	120a4eeb-a638-4993-99d1-73a0c345d310	d6860356-5385-4fab-8834-e6101d5a5932	2026-02-04	18:00	19:00	25	80000	PENDING	UNPAID	\N	\N	\N	\N	\N	2026-02-04 18:35:02.045	2026-02-04 18:35:02.045
e3a11e2c-5e15-4b37-af71-360403c31a20	BK17702301020566	00fc5e4a-6a37-45e8-a384-8d314f2257e4	120a4eeb-a638-4993-99d1-73a0c345d310	d6860356-5385-4fab-8834-e6101d5a5932	2026-02-02	18:00	20:00	120	350000	CANCELLED	UNPAID	\N	\N	\N	\N	\N	2026-02-04 18:35:02.057	2026-02-04 18:35:02.057
06d2399d-9527-4d06-9fd0-a1888844369f	BK17702301020617	28cceb16-b40a-4148-9f12-527daa0fa670	0aa90c3a-2218-409d-afc5-f2bbdc94384a	305a9b3c-64d0-4584-8109-ca8d2d3d4072	2026-01-29	16:00	17:00	45	150000	CONFIRMED	UNPAID	\N	\N	\N	\N	\N	2026-02-04 18:35:02.062	2026-02-04 18:35:02.062
f9ae0d5d-ac0d-4cbf-bae5-055f964c5a27	BK17702301020495	28cceb16-b40a-4148-9f12-527daa0fa670	120a4eeb-a638-4993-99d1-73a0c345d310	6895789d-7fe4-4b32-b3a9-2b5f394526d0	2026-02-01	09:00	11:00	120	350000	COMPLETED	PAID	CASH	\N	\N	\N	\N	2026-02-04 18:35:02.05	2026-02-04 18:35:02.085
85c929fd-f7d5-43a5-b17b-fc0d1f39da0f	BK17702301020678	28cceb16-b40a-4148-9f12-527daa0fa670	120a4eeb-a638-4993-99d1-73a0c345d310	6895789d-7fe4-4b32-b3a9-2b5f394526d0	2026-01-29	13:00	14:00	45	150000	COMPLETED	PAID	CASH	\N	\N	\N	\N	2026-02-04 18:35:02.068	2026-02-04 18:35:02.091
7100c074-34f7-41b6-a5b6-608b1817c70c	BK17702301020739	00fc5e4a-6a37-45e8-a384-8d314f2257e4	0aa90c3a-2218-409d-afc5-f2bbdc94384a	305a9b3c-64d0-4584-8109-ca8d2d3d4072	2026-02-03	16:00	17:00	25	80000	COMPLETED	PAID	CASH	\N	\N	\N	\N	2026-02-04 18:35:02.075	2026-02-04 18:35:02.097
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, "userId", type, title, message, data, "isRead", "readAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, token, "userId", "expiresAt", "usedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, "bookingId", amount, method, "qrCode", "qrContent", "bankCode", "bankAccount", "sepayTransId", "sepayRef", status, "paidAt", "createdAt", "updatedAt") FROM stdin;
d34f0812-32c0-48da-b3f1-7febc80ffbb4	f9ae0d5d-ac0d-4cbf-bae5-055f964c5a27	350000	CASH	\N	\N	\N	\N	\N	\N	PAID	2026-02-04 18:35:02.079	2026-02-04 18:35:02.08	2026-02-04 18:35:02.08
7040d4c8-842c-40e9-8a6e-f5b72ccf8157	85c929fd-f7d5-43a5-b17b-fc0d1f39da0f	150000	CASH	\N	\N	\N	\N	\N	\N	PAID	2026-02-04 18:35:02.087	2026-02-04 18:35:02.088	2026-02-04 18:35:02.088
7cd8d8fa-f72e-4635-83c6-bed6751c86e9	7100c074-34f7-41b6-a5b6-608b1817c70c	80000	CASH	\N	\N	\N	\N	\N	\N	PAID	2026-02-04 18:35:02.092	2026-02-04 18:35:02.094	2026-02-04 18:35:02.094
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, token, "userId", "deviceInfo", "expiresAt", "createdAt") FROM stdin;
bd4d5900-8b25-45b8-b215-163880d0e10c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGUyOGM5MC03YzVmLTRiZDYtYmNmZi1kOWRjNWJlMjQ5ZWYiLCJlbWFpbCI6ImFkbWluQHJlZXRyby52biIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTc3MDI5NDE4MywiZXhwIjoxNzcwODk4OTgzfQ.eHO87aIx8M3ei6lB0CY9uea1lQr9OQyWWv_IRhTy5JE	80e28c90-7c5f-4bd6-bcff-d9dc5be249ef	\N	2026-02-12 12:23:03.577	2026-02-05 12:23:03.58
da1f717a-b122-45a1-b640-5bcc436d9c18	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYjFjMWZhMC0zOThmLTRlN2MtYTg4YS1mZGY4MGIyMjhkNzEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NzAzOTczMzQsImV4cCI6MTc3MTAwMjEzNH0.6_26MXkkLSaOraUSbYRB5kRv9TfmG8TeusSQUUhs228	ab1c1fa0-398f-4e7c-a88a-fdf80b228d71	\N	2026-02-13 17:02:14.854	2026-02-06 17:02:14.856
db225417-14d3-47c9-9670-e6de18e088a4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwY2MwZDU0OS04NDNiLTQ4ODgtYmIyMS03ZTVhMTJhZjNkODUiLCJlbWFpbCI6InBhZEBnbWFpbC5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NzAzOTczNzYsImV4cCI6MTc3MTAwMjE3Nn0.LQhe5SmxlhzSTGUlx5FkhLyuc9rmVdFDzCNRxWqpksI	0cc0d549-843b-4888-bb21-7e5a12af3d85	\N	2026-02-13 17:02:56.369	2026-02-06 17:02:56.37
959633e9-b7ab-47f4-aecf-63a7974c069f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwY2MwZDU0OS04NDNiLTQ4ODgtYmIyMS03ZTVhMTJhZjNkODUiLCJlbWFpbCI6InBhZEBnbWFpbC5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NzAzOTc2MzQsImV4cCI6MTc3MTAwMjQzNH0.sCT6zN9VJ1Rr-h7NCgv9d09gcCMn7dAVbLVKN513FT8	0cc0d549-843b-4888-bb21-7e5a12af3d85	\N	2026-02-13 17:07:14.805	2026-02-06 17:07:14.806
f59b8d8a-c8cb-4ca1-8ea6-25e2564ad182	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwY2MwZDU0OS04NDNiLTQ4ODgtYmIyMS03ZTVhMTJhZjNkODUiLCJlbWFpbCI6InBhZEBnbWFpbC5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NzAzOTc3MTUsImV4cCI6MTc3MTAwMjUxNX0.lgUBn_lTRICaIVjBYUrbbqG2GJQKUZSN0iUm8cgdAWI	0cc0d549-843b-4888-bb21-7e5a12af3d85	\N	2026-02-13 17:08:35.299	2026-02-06 17:08:35.301
ce106d94-0b93-4215-b2fa-0e47729e5d17	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwY2MwZDU0OS04NDNiLTQ4ODgtYmIyMS03ZTVhMTJhZjNkODUiLCJlbWFpbCI6InBhZEBnbWFpbC5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NzAzOTc3MjQsImV4cCI6MTc3MTAwMjUyNH0.xeniGWav-fdTgrs6elnN40zxeZ8LJqlMETdZ4x7Sf6c	0cc0d549-843b-4888-bb21-7e5a12af3d85	\N	2026-02-13 17:08:44.612	2026-02-06 17:08:44.613
02775b89-3039-429a-89e6-b3378814c505	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwY2MwZDU0OS04NDNiLTQ4ODgtYmIyMS03ZTVhMTJhZjNkODUiLCJlbWFpbCI6InBhZEBnbWFpbC5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NzAzOTc4NDEsImV4cCI6MTc3MTAwMjY0MX0.0-bpz3mCnWk6kis_mtVO6moRnnK5r0oeL7M7ftaTwDk	0cc0d549-843b-4888-bb21-7e5a12af3d85	\N	2026-02-13 17:10:41.275	2026-02-06 17:10:41.276
1b66050c-c700-427b-b6cc-ac06447d28c5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwY2MwZDU0OS04NDNiLTQ4ODgtYmIyMS03ZTVhMTJhZjNkODUiLCJlbWFpbCI6InBhZEBnbWFpbC5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NzAzOTc5NTAsImV4cCI6MTc3MTAwMjc1MH0.xwLrwlqg-h7SJUOqTGY4y9BTBsruK6K3DguTXTXnMGs	0cc0d549-843b-4888-bb21-7e5a12af3d85	\N	2026-02-13 17:12:30.966	2026-02-06 17:12:30.967
5a5170e7-1e3c-47a0-8fa6-ff6c08a74848	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwY2MwZDU0OS04NDNiLTQ4ODgtYmIyMS03ZTVhMTJhZjNkODUiLCJlbWFpbCI6InBhZEBnbWFpbC5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NzAzOTg0MTYsImV4cCI6MTc3MTAwMzIxNn0.sM4lls9M043ocuNmwS2ZeofC3wOIBfZMayASEqpJhLw	0cc0d549-843b-4888-bb21-7e5a12af3d85	\N	2026-02-13 17:20:16.131	2026-02-06 17:20:16.133
1b924da1-37df-4c99-871b-fa80631741ac	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGUyOGM5MC03YzVmLTRiZDYtYmNmZi1kOWRjNWJlMjQ5ZWYiLCJlbWFpbCI6ImFkbWluQHJlZXRyby52biIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTc3MDM5OTQ0NywiZXhwIjoxNzcxMDA0MjQ3fQ.egEl5VI4OmgL3Q8GJZgnN4fW3Nr2g9b6fiBp5kq8LWQ	80e28c90-7c5f-4bd6-bcff-d9dc5be249ef	\N	2026-02-13 17:37:27.28	2026-02-06 17:37:27.282
76246df5-9770-46ff-90ff-c3c66c3e68ad	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwY2MwZDU0OS04NDNiLTQ4ODgtYmIyMS03ZTVhMTJhZjNkODUiLCJlbWFpbCI6InBhZEBnbWFpbC5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NzAzOTk4NjYsImV4cCI6MTc3MTAwNDY2Nn0.uL73WtUb5s0gf4HpocBWmRSjvyNtMRMq-6rLsmL3YfQ	0cc0d549-843b-4888-bb21-7e5a12af3d85	\N	2026-02-13 17:44:26.68	2026-02-06 17:44:26.681
84d714ca-3a76-4d83-8e94-4270a1276c10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwY2MwZDU0OS04NDNiLTQ4ODgtYmIyMS03ZTVhMTJhZjNkODUiLCJlbWFpbCI6InBhZEBnbWFpbC5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NzA0MDA0MTgsImV4cCI6MTc3MTAwNTIxOH0.Yb0VPmzMbMVzdNnvtkLZ1ypYCpkvHLa0wyDiSGCMLTM	0cc0d549-843b-4888-bb21-7e5a12af3d85	\N	2026-02-13 17:53:38.282	2026-02-06 17:53:38.283
6529bd2b-f884-40e9-96a4-2e79c227e972	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwY2MwZDU0OS04NDNiLTQ4ODgtYmIyMS03ZTVhMTJhZjNkODUiLCJlbWFpbCI6InBhZEBnbWFpbC5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NzA0MDA1MDIsImV4cCI6MTc3MTAwNTMwMn0.ixh_L_kEHHXI3WMx44VwhZWlZE6bZ_2uN85PIzW6iwM	0cc0d549-843b-4888-bb21-7e5a12af3d85	\N	2026-02-13 17:55:02.486	2026-02-06 17:55:02.487
0d0c54bc-26bb-46a7-9f2c-d08609ef4c4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGUyOGM5MC03YzVmLTRiZDYtYmNmZi1kOWRjNWJlMjQ5ZWYiLCJlbWFpbCI6ImFkbWluQHJlZXRyby52biIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTc3MDQwMDczMiwiZXhwIjoxNzcxMDA1NTMyfQ.JxS3nyzR2gsGIM1h_2D7AJmM1rZ69bfe-R5TFlXarE8	80e28c90-7c5f-4bd6-bcff-d9dc5be249ef	\N	2026-02-13 17:58:52.8	2026-02-06 17:58:52.802
01703912-bb48-4603-8deb-e8a35ffbb0b0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwY2MwZDU0OS04NDNiLTQ4ODgtYmIyMS03ZTVhMTJhZjNkODUiLCJlbWFpbCI6InBhZEBnbWFpbC5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NzA0MDI1NTIsImV4cCI6MTc3MTAwNzM1Mn0.oU5-pwXKT93ke1gsfNQDEHgYe38WKXuhIXFoaNskzq0	0cc0d549-843b-4888-bb21-7e5a12af3d85	\N	2026-02-13 18:29:12.562	2026-02-06 18:29:12.564
f20671ba-ba84-4353-b916-119cc5618d7c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwY2MwZDU0OS04NDNiLTQ4ODgtYmIyMS03ZTVhMTJhZjNkODUiLCJlbWFpbCI6InBhZEBnbWFpbC5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NzA0MDQxODksImV4cCI6MTc3MTAwODk4OX0.1mEQ5T4w31mkNAeIZYitVTUdYM0DGRQhmTU1fOV91sI	0cc0d549-843b-4888-bb21-7e5a12af3d85	\N	2026-02-13 18:56:29.203	2026-02-06 18:56:29.204
54f28d37-4fd4-4ea5-a101-29b1762ba220	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGUyOGM5MC03YzVmLTRiZDYtYmNmZi1kOWRjNWJlMjQ5ZWYiLCJlbWFpbCI6ImFkbWluQHJlZXRyby52biIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTc3MDQwNDM1MCwiZXhwIjoxNzcxMDA5MTUwfQ.EDtDa8JGWxjHVLVShbn1zrJBs1Kkdz-TvJCdg0Pto9Y	80e28c90-7c5f-4bd6-bcff-d9dc5be249ef	\N	2026-02-13 18:59:10.172	2026-02-06 18:59:10.173
53b0c2cb-3c2e-40a7-9193-3c3a903c6fc5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGUyOGM5MC03YzVmLTRiZDYtYmNmZi1kOWRjNWJlMjQ5ZWYiLCJlbWFpbCI6ImFkbWluQHJlZXRyby52biIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTc3MDQwNTMzOCwiZXhwIjoxNzcxMDEwMTM4fQ.EY1Vw8si0dQqUiAixEfS31r3Rf4lnjxAev3mdLB1Z8g	80e28c90-7c5f-4bd6-bcff-d9dc5be249ef	\N	2026-02-13 19:15:38.281	2026-02-06 19:15:38.282
a2a386d1-7a86-4ce4-bc72-e85245b95d04	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGUyOGM5MC03YzVmLTRiZDYtYmNmZi1kOWRjNWJlMjQ5ZWYiLCJlbWFpbCI6ImFkbWluQHJlZXRyby52biIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTc3MDQwNjM5MCwiZXhwIjoxNzcxMDExMTkwfQ.NkqLtu6bS0MMKVec_eEVhh5GcPRR_zVWWXb40N76y9o	80e28c90-7c5f-4bd6-bcff-d9dc5be249ef	\N	2026-02-13 19:33:10.083	2026-02-06 19:33:10.085
2e9026db-2fa7-4cbd-9c5b-f98fccb1e9f1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGUyOGM5MC03YzVmLTRiZDYtYmNmZi1kOWRjNWJlMjQ5ZWYiLCJlbWFpbCI6ImFkbWluQHJlZXRyby52biIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTc3MDQwNzQzMSwiZXhwIjoxNzcxMDEyMjMxfQ.WrQspd3vohQ_BtnjV5I09r9u91uLaO0wohUW--HY8eA	80e28c90-7c5f-4bd6-bcff-d9dc5be249ef	\N	2026-02-13 19:50:31.315	2026-02-06 19:50:31.317
ec7e8f50-161d-4cf2-9598-ee2eaa7fcead	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGUyOGM5MC03YzVmLTRiZDYtYmNmZi1kOWRjNWJlMjQ5ZWYiLCJlbWFpbCI6ImFkbWluQHJlZXRyby52biIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTc3MDQwODYwNSwiZXhwIjoxNzcxMDEzNDA1fQ.2ELrybSniCkVi-ZD7mNkLadVlgYRR-qcHtjl3HXzMgU	80e28c90-7c5f-4bd6-bcff-d9dc5be249ef	\N	2026-02-13 20:10:05.997	2026-02-06 20:10:05.998
65531f78-b60c-4f1b-907e-533612e919c2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGUyOGM5MC03YzVmLTRiZDYtYmNmZi1kOWRjNWJlMjQ5ZWYiLCJlbWFpbCI6ImFkbWluQHJlZXRyby52biIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTc3MDQwOTYyNCwiZXhwIjoxNzcxMDE0NDI0fQ.cCDTlIGxnexMYQ6W4R_QDktj34882y8mkyCnoTogqHw	80e28c90-7c5f-4bd6-bcff-d9dc5be249ef	\N	2026-02-13 20:27:04.548	2026-02-06 20:27:04.549
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, "bookingId", "customerId", "salonId", rating, comment, images, reply, "repliedAt", "isVisible", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: salons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salons (id, name, slug, description, address, city, district, ward, latitude, longitude, phone, email, "openTime", "closeTime", "workingDays", logo, "coverImage", images, "isActive", "ownerId", "bankCode", "bankAccount", "bankName", "createdAt", "updatedAt") FROM stdin;
120a4eeb-a638-4993-99d1-73a0c345d310	Reetro Quận 1	reetro-quan-1	Tiệm cắt tóc nam cao cấp tại Quận 1	123 Nguyễn Huệ, Q.1, TP.HCM	Hồ Chí Minh	Quận 1	Phường Bến Nghé	10.7739	106.7004	0909 123 456	q1@reetro.vn	08:00	21:00	{Mon,Tue,Wed,Thu,Fri,Sat,Sun}	\N	\N	{https://placeholder.com/branch1.jpg}	t	80e28c90-7c5f-4bd6-bcff-d9dc5be249ef	970422	0123456789	MB Bank	2026-02-04 18:35:01.859	2026-02-04 18:35:01.859
0aa90c3a-2218-409d-afc5-f2bbdc94384a	Reetro Quận 3	reetro-quan-3	Tiệm cắt tóc nam cao cấp tại Quận 3	456 Võ Văn Tần, Q.3, TP.HCM	Hồ Chí Minh	Quận 3	Phường 6	10.7823	106.6875	0909 123 457	q3@reetro.vn	08:00	21:00	{Mon,Tue,Wed,Thu,Fri,Sat,Sun}	\N	\N	{https://placeholder.com/branch2.jpg}	t	80e28c90-7c5f-4bd6-bcff-d9dc5be249ef	970422	0123456790	MB Bank	2026-02-04 18:35:01.859	2026-02-04 18:35:01.859
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, name, description, price, duration, category, image, "isActive", "order", "salonId", "createdAt", "updatedAt") FROM stdin;
99c823fa-4588-4b85-9b9f-eb0bbab41e25	Cắt tóc nam	Cắt tóc nam cơ bản, tạo kiểu theo yêu cầu	100000	30	HAIRCUT	\N	t	1	120a4eeb-a638-4993-99d1-73a0c345d310	2026-02-04 18:35:01.977	2026-02-04 18:35:01.977
5867fa7c-a945-4fbf-877e-fe8a405e003b	Cắt tóc + Gội massage	Combo cắt tóc kèm gội đầu massage thư giãn	150000	45	COMBO	\N	t	2	120a4eeb-a638-4993-99d1-73a0c345d310	2026-02-04 18:35:01.98	2026-02-04 18:35:01.98
e7c49263-0137-44a4-8662-449cb8eb523a	Cạo mặt + Đắp mặt nạ	Cạo râu, cạo mặt kèm đắp mặt nạ dưỡng da	80000	25	FACIAL	\N	t	3	120a4eeb-a638-4993-99d1-73a0c345d310	2026-02-04 18:35:01.983	2026-02-04 18:35:01.983
0be561c4-e702-41a7-a9a8-a246adbc9731	Nhuộm tóc	Nhuộm tóc các màu theo xu hướng	250000	90	HAIR_COLORING	\N	t	4	120a4eeb-a638-4993-99d1-73a0c345d310	2026-02-04 18:35:01.986	2026-02-04 18:35:01.986
36fd3251-cb41-4efe-b275-0171fd5d0785	Uốn tóc Hàn Quốc	Uốn tóc Hàn Quốc, tạo kiểu độc đáo	350000	120	HAIR_STYLING	\N	t	5	120a4eeb-a638-4993-99d1-73a0c345d310	2026-02-04 18:35:01.988	2026-02-04 18:35:01.988
14412c2e-521b-4e16-a073-85b7156447af	VIP Combo	Cắt + Gội + Cạo mặt + Đắp mặt nạ + Massage vai cổ	300000	90	COMBO	\N	t	6	120a4eeb-a638-4993-99d1-73a0c345d310	2026-02-04 18:35:01.991	2026-02-04 18:35:01.991
50424977-06b1-4148-9756-525adfb992fe	Cắt tóc nam	Cắt tóc nam cơ bản, tạo kiểu theo yêu cầu	100000	30	HAIRCUT	\N	t	1	0aa90c3a-2218-409d-afc5-f2bbdc94384a	2026-02-04 18:35:01.994	2026-02-04 18:35:01.994
3386cdf9-c3f1-4962-9f2f-47a6890f5bab	Cắt tóc + Gội massage	Combo cắt tóc kèm gội đầu massage thư giãn	150000	45	COMBO	\N	t	2	0aa90c3a-2218-409d-afc5-f2bbdc94384a	2026-02-04 18:35:01.998	2026-02-04 18:35:01.998
cf972808-250f-4598-bb78-c524a042f92d	Cạo mặt + Đắp mặt nạ	Cạo râu, cạo mặt kèm đắp mặt nạ dưỡng da	80000	25	FACIAL	\N	t	3	0aa90c3a-2218-409d-afc5-f2bbdc94384a	2026-02-04 18:35:02.001	2026-02-04 18:35:02.001
b151100c-1e80-41be-87e9-9616691c12fc	Nhuộm tóc	Nhuộm tóc các màu theo xu hướng	250000	90	HAIR_COLORING	\N	t	4	0aa90c3a-2218-409d-afc5-f2bbdc94384a	2026-02-04 18:35:02.005	2026-02-04 18:35:02.005
ba7f84c8-5bf0-4ef3-99cf-ff610307764e	Uốn tóc Hàn Quốc	Uốn tóc Hàn Quốc, tạo kiểu độc đáo	350000	120	HAIR_STYLING	\N	t	5	0aa90c3a-2218-409d-afc5-f2bbdc94384a	2026-02-04 18:35:02.007	2026-02-04 18:35:02.007
b5c233a5-1a87-452a-80b3-e98fca3d4d55	VIP Combo	Cắt + Gội + Cạo mặt + Đắp mặt nạ + Massage vai cổ	300000	90	COMBO	\N	t	6	0aa90c3a-2218-409d-afc5-f2bbdc94384a	2026-02-04 18:35:02.01	2026-02-04 18:35:02.01
\.


--
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff (id, "position", bio, rating, "totalReviews", "isActive", "userId", "salonId", "createdAt", "updatedAt") FROM stdin;
8b405b32-ff75-4477-a38d-0b7371caf319	STYLIST	Huy Barber - Chuyên gia tạo kiểu tóc nam	4.927330835906317	34	t	1dfa8a1e-4eca-40d2-9ca8-592c687c77e3	120a4eeb-a638-4993-99d1-73a0c345d310	2026-02-04 18:35:01.869	2026-02-04 18:35:01.869
d6860356-5385-4fab-8834-e6101d5a5932	SENIOR_STYLIST	Tùng Barber - Chuyên gia tạo kiểu tóc nam	4.533246932672427	23	t	d74d8abe-f716-433d-988f-64e9c1565af3	120a4eeb-a638-4993-99d1-73a0c345d310	2026-02-04 18:35:01.869	2026-02-04 18:35:01.869
74674b67-8d93-4f83-ae4f-97843ddf99df	MASTER_STYLIST	Đức Barber - Chuyên gia tạo kiểu tóc nam	4.872834195914082	8	t	eec3099e-552f-40d6-8b6f-cd04fc6b61b4	0aa90c3a-2218-409d-afc5-f2bbdc94384a	2026-02-04 18:35:01.869	2026-02-04 18:35:01.869
6895789d-7fe4-4b32-b3a9-2b5f394526d0	MASTER_STYLIST	Minh Barber - Chuyên gia tạo kiểu tóc nam	4.782046917458125	23	t	4c2e8bf4-44ad-49d9-8de3-4de4a6c734ab	120a4eeb-a638-4993-99d1-73a0c345d310	2026-02-04 18:35:01.869	2026-02-04 18:35:01.869
305a9b3c-64d0-4584-8109-ca8d2d3d4072	SENIOR_STYLIST	Long Barber - Chuyên gia tạo kiểu tóc nam	4.800370815809097	21	f	16585a4e-e349-4882-884a-c169cb2c97fc	0aa90c3a-2218-409d-afc5-f2bbdc94384a	2026-02-04 18:35:01.869	2026-02-06 19:57:02.07
\.


--
-- Data for Name: staff_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_schedules (id, "staffId", "dayOfWeek", "startTime", "endTime", "isOff") FROM stdin;
dd7dee54-cb39-4cf4-a20b-c8bd0105e2ba	6895789d-7fe4-4b32-b3a9-2b5f394526d0	1	08:00	21:00	f
caff0b18-9c6b-466e-8a17-8ed74875731e	6895789d-7fe4-4b32-b3a9-2b5f394526d0	2	08:00	21:00	f
abc73b7f-c16a-45e0-a2b0-973ab1f988c5	6895789d-7fe4-4b32-b3a9-2b5f394526d0	3	08:00	21:00	f
b5b94bff-5f4e-4976-8b47-2256db46fee9	6895789d-7fe4-4b32-b3a9-2b5f394526d0	4	08:00	21:00	f
df15e1fc-eb7d-4a30-a8d2-09d16987d097	6895789d-7fe4-4b32-b3a9-2b5f394526d0	5	08:00	21:00	f
3c3cd7b8-c621-4786-bbfa-7400022b06c4	6895789d-7fe4-4b32-b3a9-2b5f394526d0	6	08:00	21:00	f
98dddb8a-2a3a-4d6d-967f-03d97efa2f24	6895789d-7fe4-4b32-b3a9-2b5f394526d0	0	00:00	00:00	t
10570157-012b-4608-8fc4-a83773007ec6	d6860356-5385-4fab-8834-e6101d5a5932	1	08:00	21:00	f
d767106b-f99b-4eeb-bc35-aef1355358a4	d6860356-5385-4fab-8834-e6101d5a5932	2	08:00	21:00	f
fff626ce-9184-4e1c-8ec5-4dbf064dc099	d6860356-5385-4fab-8834-e6101d5a5932	3	08:00	21:00	f
17a8980d-3c50-428d-94ed-3a41e8ed44d5	d6860356-5385-4fab-8834-e6101d5a5932	4	08:00	21:00	f
f2328d68-45a8-40f0-aae8-cb2eab130ff4	d6860356-5385-4fab-8834-e6101d5a5932	5	08:00	21:00	f
d8c3df99-7312-473e-a807-7520599df930	d6860356-5385-4fab-8834-e6101d5a5932	6	08:00	21:00	f
f474c174-27af-477a-bd66-4d146cf05904	d6860356-5385-4fab-8834-e6101d5a5932	0	00:00	00:00	t
29407391-897f-495a-8811-05a49ab49b98	8b405b32-ff75-4477-a38d-0b7371caf319	1	08:00	21:00	f
a4247fc9-dd99-4449-82a9-3f9a047638b5	8b405b32-ff75-4477-a38d-0b7371caf319	2	08:00	21:00	f
0618ebea-5afa-42d6-b19b-36fa7c6bad9c	8b405b32-ff75-4477-a38d-0b7371caf319	3	08:00	21:00	f
85acfd54-6dcd-46ed-93c6-bbc9b357a183	8b405b32-ff75-4477-a38d-0b7371caf319	4	08:00	21:00	f
47cc0b27-4777-4388-8a6e-f15b97c37686	8b405b32-ff75-4477-a38d-0b7371caf319	5	08:00	21:00	f
1e92812f-5bdd-4bfd-a3b5-fb7d896710eb	8b405b32-ff75-4477-a38d-0b7371caf319	6	08:00	21:00	f
624294d2-9364-4373-a22d-100f6df1bc1b	8b405b32-ff75-4477-a38d-0b7371caf319	0	00:00	00:00	t
f20974b7-ed73-437d-ab15-618444c2faf1	74674b67-8d93-4f83-ae4f-97843ddf99df	1	08:00	21:00	f
3d8642c1-742e-4625-bac1-64deb4797de5	74674b67-8d93-4f83-ae4f-97843ddf99df	2	08:00	21:00	f
ac531f49-5e88-4e90-8cdb-59decffaa340	74674b67-8d93-4f83-ae4f-97843ddf99df	3	08:00	21:00	f
482e8acc-04cc-495b-90e9-c7cf8aa1f0eb	74674b67-8d93-4f83-ae4f-97843ddf99df	4	08:00	21:00	f
f7c0285d-2982-4938-a6cb-23697b710908	74674b67-8d93-4f83-ae4f-97843ddf99df	5	08:00	21:00	f
338cd8d7-1445-422d-9e14-22cd1d095cec	74674b67-8d93-4f83-ae4f-97843ddf99df	6	08:00	21:00	f
8f7bcfce-798a-4bdd-bbd8-8e6e3994dbdd	74674b67-8d93-4f83-ae4f-97843ddf99df	0	00:00	00:00	t
03605d0b-68f2-4a2d-a264-ee5b372926d0	305a9b3c-64d0-4584-8109-ca8d2d3d4072	1	08:00	21:00	f
21dec220-b984-44fd-b380-5370ea6cb986	305a9b3c-64d0-4584-8109-ca8d2d3d4072	2	08:00	21:00	f
dab40061-dea0-4543-bb7b-92e984d69e02	305a9b3c-64d0-4584-8109-ca8d2d3d4072	3	08:00	21:00	f
272d7158-df8d-40b4-af80-419f59daa0a9	305a9b3c-64d0-4584-8109-ca8d2d3d4072	4	08:00	21:00	f
0045acbc-19f3-46b5-8d4c-d65ebec0510a	305a9b3c-64d0-4584-8109-ca8d2d3d4072	5	08:00	21:00	f
fc6f8c19-fc50-4e33-a5c5-ebc50aadb81f	305a9b3c-64d0-4584-8109-ca8d2d3d4072	6	08:00	21:00	f
9eadbc6f-4df9-4fa4-9a4d-53ac5fc72075	305a9b3c-64d0-4584-8109-ca8d2d3d4072	0	00:00	00:00	t
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, phone, password, name, avatar, "googleId", "facebookId", "zaloId", "authProvider", role, "isVerified", "isActive", "createdAt", "updatedAt", "lastLoginAt") FROM stdin;
00fc5e4a-6a37-45e8-a384-8d314f2257e4	\N	0909333333	\N	Lê Văn C	https://ui-avatars.com/api/?name=Le+Van+C&background=random	\N	\N	\N	LOCAL	CUSTOMER	t	t	2026-02-04 18:35:01.828	2026-02-04 18:35:01.828	\N
28cceb16-b40a-4148-9f12-527daa0fa670	\N	0909111111	\N	Nguyễn Văn A	https://ui-avatars.com/api/?name=Nguyen+Van+A&background=random	\N	\N	\N	LOCAL	CUSTOMER	t	t	2026-02-04 18:35:01.828	2026-02-04 18:35:01.828	\N
2912da8b-1f24-437c-9164-5c467e67519c	\N	0909222222	\N	Trần Văn B	https://ui-avatars.com/api/?name=Tran+Van+B&background=random	\N	\N	\N	LOCAL	CUSTOMER	t	t	2026-02-04 18:35:01.828	2026-02-04 18:35:01.828	\N
eec3099e-552f-40d6-8b6f-cd04fc6b61b4	duc.barber@reetro.vn	0909001004	$2b$10$1ozJsQ4tJyz2rQn1ZNGEBOOQkZS71/eS25xWnCPbGkDPub/ASpYv.	Đức Barber	https://ui-avatars.com/api/?name=Duc&background=random	\N	\N	\N	LOCAL	STAFF	t	t	2026-02-04 18:35:01.846	2026-02-04 18:35:01.846	\N
4c2e8bf4-44ad-49d9-8de3-4de4a6c734ab	minh.barber@reetro.vn	0909001001	$2b$10$1ozJsQ4tJyz2rQn1ZNGEBOOQkZS71/eS25xWnCPbGkDPub/ASpYv.	Minh Barber	https://ui-avatars.com/api/?name=Minh&background=random	\N	\N	\N	LOCAL	STAFF	t	t	2026-02-04 18:35:01.846	2026-02-04 18:35:01.846	\N
d74d8abe-f716-433d-988f-64e9c1565af3	tung.barber@reetro.vn	0909001002	$2b$10$1ozJsQ4tJyz2rQn1ZNGEBOOQkZS71/eS25xWnCPbGkDPub/ASpYv.	Tùng Barber	https://ui-avatars.com/api/?name=Tung&background=random	\N	\N	\N	LOCAL	STAFF	t	t	2026-02-04 18:35:01.846	2026-02-04 18:35:01.846	\N
16585a4e-e349-4882-884a-c169cb2c97fc	long.barber@reetro.vn	0909001005	$2b$10$1ozJsQ4tJyz2rQn1ZNGEBOOQkZS71/eS25xWnCPbGkDPub/ASpYv.	Long Barber	https://ui-avatars.com/api/?name=Long&background=random	\N	\N	\N	LOCAL	STAFF	t	t	2026-02-04 18:35:01.846	2026-02-04 18:35:01.846	\N
1dfa8a1e-4eca-40d2-9ca8-592c687c77e3	huy.barber@reetro.vn	0909001003	$2b$10$1ozJsQ4tJyz2rQn1ZNGEBOOQkZS71/eS25xWnCPbGkDPub/ASpYv.	Huy Barber	https://ui-avatars.com/api/?name=Huy&background=random	\N	\N	\N	LOCAL	STAFF	t	t	2026-02-04 18:35:01.847	2026-02-04 18:35:01.847	\N
ab1c1fa0-398f-4e7c-a88a-fdf80b228d71	test@example.com	\N	$2b$10$01uhcBNfZbVmUSOgC5eOVeSwX0u81NlUAF7m2ns.QRlaGGuZeaBE.	Test User	\N	\N	\N	\N	LOCAL	CUSTOMER	f	t	2026-02-06 17:02:14.834	2026-02-06 17:02:14.834	\N
80e28c90-7c5f-4bd6-bcff-d9dc5be249ef	admin@reetro.vn	0909000001	$2a$10$5Y0BX2/v/6GAmbsL5NN/ZOc3Zdc5lGeKGHV8cgt3sq78HXmsOdMRe	Admin	https://ui-avatars.com/api/?name=Admin&background=1a365d&color=fff	\N	\N	\N	LOCAL	SUPER_ADMIN	t	t	2026-02-04 18:35:01.814	2026-02-06 20:27:04.539	2026-02-06 20:27:04.537
0cc0d549-843b-4888-bb21-7e5a12af3d85	pad@gmail.com	0987654321	$2b$10$3A0Ky.CMEWBsyA5eGFmcfeV4T87a4AR9.KHiFgETERn6Ht2/G78TG	Phan Anh Duy123	\N	\N	\N	\N	LOCAL	CUSTOMER	f	t	2026-02-06 17:02:56.361	2026-02-06 18:56:39.021	2026-02-06 18:56:29.189
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: booking_services booking_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT booking_services_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: salons salons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salons
    ADD CONSTRAINT salons_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: staff_schedules staff_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_schedules
    ADD CONSTRAINT staff_schedules_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: bookings_bookingCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "bookings_bookingCode_key" ON public.bookings USING btree ("bookingCode");


--
-- Name: bookings_customerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "bookings_customerId_idx" ON public.bookings USING btree ("customerId");


--
-- Name: bookings_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_date_idx ON public.bookings USING btree (date);


--
-- Name: bookings_salonId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "bookings_salonId_idx" ON public.bookings USING btree ("salonId");


--
-- Name: bookings_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_status_idx ON public.bookings USING btree (status);


--
-- Name: notifications_userId_isRead_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notifications_userId_isRead_idx" ON public.notifications USING btree ("userId", "isRead");


--
-- Name: password_reset_tokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX password_reset_tokens_token_key ON public.password_reset_tokens USING btree (token);


--
-- Name: payments_bookingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "payments_bookingId_key" ON public.payments USING btree ("bookingId");


--
-- Name: payments_sepayTransId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "payments_sepayTransId_key" ON public.payments USING btree ("sepayTransId");


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: reviews_bookingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "reviews_bookingId_key" ON public.reviews USING btree ("bookingId");


--
-- Name: salons_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX salons_slug_key ON public.salons USING btree (slug);


--
-- Name: staff_schedules_staffId_dayOfWeek_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "staff_schedules_staffId_dayOfWeek_key" ON public.staff_schedules USING btree ("staffId", "dayOfWeek");


--
-- Name: staff_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "staff_userId_key" ON public.staff USING btree ("userId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_facebookId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "users_facebookId_key" ON public.users USING btree ("facebookId");


--
-- Name: users_googleId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "users_googleId_key" ON public.users USING btree ("googleId");


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: users_zaloId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "users_zaloId_key" ON public.users USING btree ("zaloId");


--
-- Name: booking_services booking_services_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT "booking_services_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: booking_services booking_services_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT "booking_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_salonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES public.salons(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviews reviews_salonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES public.salons(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: salons salons_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salons
    ADD CONSTRAINT "salons_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: services services_salonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "services_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES public.salons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff staff_salonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT "staff_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES public.salons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff_schedules staff_schedules_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_schedules
    ADD CONSTRAINT "staff_schedules_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff staff_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT "staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict r8eBheEqatsmp7YzkTq87Nht0nxlqi05aMURJLeA4weOLdEnnzULsVDLf6KsT1C

