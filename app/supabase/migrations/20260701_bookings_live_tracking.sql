-- ═══════════════════════════════════════════════════════════════════════════
-- Live provider tracking: bookings table + Row Level Security policies
--
-- Run this in the Supabase Dashboard → SQL Editor (or via the Supabase CLI:
-- `supabase db push`) before using the live tracking feature.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.bookings (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null references auth.users(id) on delete cascade,
    provider_id uuid not null references public.profiles(id) on delete cascade,

    -- Where the customer needs the service
    customer_lat double precision not null,
    customer_lng double precision not null,
    customer_address text,

    -- Provider's live location while a job is in progress. Null until the
    -- provider starts sharing their location (i.e. status = 'on_the_way').
    provider_lat double precision,
    provider_lng double precision,
    provider_location_updated_at timestamptz,

    -- requested       -> customer has asked for this provider
    -- accepted        -> provider has accepted the job
    -- on_the_way      -> provider is actively sharing live location
    -- arrived         -> provider has reached the customer
    -- completed       -> job finished
    -- cancelled       -> either party cancelled
    status text not null default 'requested'
        check (status in ('requested', 'accepted', 'on_the_way', 'arrived', 'completed', 'cancelled')),

    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists bookings_customer_id_idx on public.bookings(customer_id);
create index if not exists bookings_provider_id_idx on public.bookings(provider_id);
create index if not exists bookings_status_idx on public.bookings(status);

-- Keep updated_at current on every row change
create or replace function public.set_bookings_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
    before update on public.bookings
    for each row execute function public.set_bookings_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table public.bookings enable row level security;

-- Customers can see their own bookings
drop policy if exists "Customers can view their own bookings" on public.bookings;
create policy "Customers can view their own bookings"
    on public.bookings for select
    using (auth.uid() = customer_id);

-- Providers can see bookings assigned to them
drop policy if exists "Providers can view their assigned bookings" on public.bookings;
create policy "Providers can view their assigned bookings"
    on public.bookings for select
    using (
        provider_id in (select id from public.profiles where auth_user_id = auth.uid())
    );

-- Customers can create a booking request for themselves
drop policy if exists "Customers can create bookings" on public.bookings;
create policy "Customers can create bookings"
    on public.bookings for insert
    with check (auth.uid() = customer_id);

-- Customers can update their own bookings (e.g. cancel)
drop policy if exists "Customers can update their own bookings" on public.bookings;
create policy "Customers can update their own bookings"
    on public.bookings for update
    using (auth.uid() = customer_id)
    with check (auth.uid() = customer_id);

-- Providers can update bookings assigned to them (accept, share location, complete)
drop policy if exists "Providers can update their assigned bookings" on public.bookings;
create policy "Providers can update their assigned bookings"
    on public.bookings for update
    using (provider_id in (select id from public.profiles where auth_user_id = auth.uid()))
    with check (provider_id in (select id from public.profiles where auth_user_id = auth.uid()));

-- Enable Realtime for live location updates
alter publication supabase_realtime add table public.bookings;
