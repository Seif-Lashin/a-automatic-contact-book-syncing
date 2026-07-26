CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'vendor', 'waiter', 'kds', 'customer');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled', 'paid');
CREATE TYPE public.session_status AS ENUM ('active', 'ordering', 'closed', 'paid');
CREATE TYPE public.payment_status AS ENUM ('pending', 'succeeded', 'failed');
CREATE TYPE public.split_mode AS ENUM ('itemized', 'equal');
CREATE TYPE public.payment_method AS ENUM ('card', 'apple_pay', 'instapay', 'vodafone_cash', 'paymob');

CREATE TABLE public.restaurants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    address text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    proximity_radius_meters integer DEFAULT 50 NOT NULL,
    tax_rate decimal(5,4) DEFAULT 0.14 NOT NULL,
    service_charge_rate decimal(5,4) DEFAULT 0.12 NOT NULL,
    currency text DEFAULT 'EGP' NOT NULL,
    logo_url text,
    settings jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.vendors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    logo_url text,
    payout_settings jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.tables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
    table_number text NOT NULL,
    capacity integer DEFAULT 4 NOT NULL,
    qr_code_payload text NOT NULL UNIQUE,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (restaurant_id, table_number)
);

CREATE TABLE public.menu_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.menu_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
    category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL,
    name text NOT NULL,
    description text,
    price integer NOT NULL,
    image_url text,
    dietary_tags text[] DEFAULT '{}',
    allergens text[] DEFAULT '{}',
    is_available boolean DEFAULT true NOT NULL,
    is_best_seller boolean DEFAULT false NOT NULL,
    is_hot boolean DEFAULT false NOT NULL,
    popularity_score integer DEFAULT 0 NOT NULL,
    preparation_time_minutes integer DEFAULT 15 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name text,
    phone text,
    avatar_url text,
    dietary_preferences text[] DEFAULT '{}',
    allergies text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
    vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (user_id, role, restaurant_id, vendor_id)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    );
$$;

CREATE TABLE public.table_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id uuid REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
    restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    status public.session_status DEFAULT 'active' NOT NULL,
    split_mode public.split_mode DEFAULT 'itemized' NOT NULL,
    currency text DEFAULT 'EGP' NOT NULL,
    total_due integer DEFAULT 0 NOT NULL,
    total_paid integer DEFAULT 0 NOT NULL,
    service_charge_rate decimal(5,4) DEFAULT 0.12 NOT NULL,
    tax_rate decimal(5,4) DEFAULT 0.14 NOT NULL,
    started_at timestamptz DEFAULT now() NOT NULL,
    closed_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.session_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES public.table_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    joined_at timestamptz DEFAULT now() NOT NULL,
    left_at timestamptz,
    is_host boolean DEFAULT false NOT NULL,
    UNIQUE (session_id, user_id)
);

CREATE TABLE public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES public.table_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
    status public.order_status DEFAULT 'pending' NOT NULL,
    subtotal integer DEFAULT 0 NOT NULL,
    tax_amount integer DEFAULT 0 NOT NULL,
    service_charge_amount integer DEFAULT 0 NOT NULL,
    total integer DEFAULT 0 NOT NULL,
    special_instructions text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    confirmed_at timestamptz
);

CREATE TABLE public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price integer NOT NULL,
    total_price integer NOT NULL,
    special_instructions text,
    claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    paid_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    status public.order_status DEFAULT 'pending' NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES public.table_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
    amount integer NOT NULL,
    tip_amount integer DEFAULT 0 NOT NULL,
    charity_roundup integer DEFAULT 0 NOT NULL,
    method public.payment_method DEFAULT 'card' NOT NULL,
    status public.payment_status DEFAULT 'pending' NOT NULL,
    external_reference text,
    idempotency_key text UNIQUE,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.payment_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
    order_item_id uuid REFERENCES public.order_items(id) ON DELETE CASCADE NOT NULL,
    amount integer NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (payment_id, order_item_id)
);

CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text text,
    video_url text,
    points_awarded integer DEFAULT 0 NOT NULL,
    is_approved boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (user_id, menu_item_id, order_id)
);

CREATE TABLE public.friendships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    addressee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status text NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (requester_id, addressee_id)
);

CREATE TABLE public.loyalty_points (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    redeemed_points integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (user_id, restaurant_id)
);

CREATE TABLE public.saved_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    default_split_mode public.split_mode DEFAULT 'itemized' NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.saved_group_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid REFERENCES public.saved_groups(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (group_id, user_id)
);

CREATE TABLE public.waiter_calls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES public.table_sessions(id) ON DELETE CASCADE NOT NULL,
    table_id uuid REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reason text,
    is_resolved boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    resolved_at timestamptz
);

CREATE TABLE public.visit_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    session_id uuid REFERENCES public.table_sessions(id) ON DELETE SET NULL,
    visited_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.gift_meals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id uuid REFERENCES public.table_sessions(id) ON DELETE CASCADE NOT NULL,
    amount integer NOT NULL,
    message text,
    status public.payment_status DEFAULT 'pending' NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT ON public.restaurants TO authenticated;
GRANT ALL ON public.restaurants TO service_role;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restaurants are readable by authenticated users" ON public.restaurants FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendors are readable by authenticated users" ON public.vendors FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.tables TO authenticated;
GRANT ALL ON public.tables TO service_role;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tables are readable by authenticated users" ON public.tables FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.menu_categories TO authenticated;
GRANT ALL ON public.menu_categories TO service_role;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Menu categories are readable by authenticated users" ON public.menu_categories FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Menu items are readable by authenticated users" ON public.menu_items FOR SELECT TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.table_sessions TO authenticated;
GRANT ALL ON public.table_sessions TO service_role;
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Session participants can read sessions" ON public.table_sessions FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.session_participants WHERE session_id = table_sessions.id AND user_id = auth.uid()
    )
);
CREATE POLICY "Staff can read all sessions" ON public.table_sessions FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'waiter') OR
    public.has_role(auth.uid(), 'kds')
);

GRANT SELECT, INSERT, UPDATE ON public.session_participants TO authenticated;
GRANT ALL ON public.session_participants TO service_role;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own participations" ON public.session_participants FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can join sessions" ON public.session_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON public.session_participants FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own orders and session orders" ON public.orders FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.session_participants WHERE session_id = orders.session_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending orders" ON public.orders FOR UPDATE TO authenticated USING (
    auth.uid() = user_id AND status = 'pending'
) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own and session order items" ON public.order_items FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    claimed_by = auth.uid() OR
    paid_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.session_participants sp ON sp.session_id = o.session_id
        WHERE o.id = order_items.order_id AND sp.user_id = auth.uid()
    )
);

GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own payments and session payments" ON public.payments FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.session_participants WHERE session_id = payments.session_id AND user_id = auth.uid()
    )
);

GRANT SELECT, INSERT ON public.payment_items TO authenticated;
GRANT ALL ON public.payment_items TO service_role;
ALTER TABLE public.payment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own payment items" ON public.payment_items FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.payments WHERE payments.id = payment_items.payment_id AND payments.user_id = auth.uid()
    )
);

GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read approved reviews" ON public.reviews FOR SELECT TO authenticated USING (is_approved = true);
CREATE POLICY "Users can read own reviews" ON public.reviews FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own friendships" ON public.friendships FOR SELECT TO authenticated USING (
    requester_id = auth.uid() OR addressee_id = auth.uid()
);
CREATE POLICY "Users can manage own friendships" ON public.friendships FOR ALL TO authenticated USING (
    requester_id = auth.uid() OR addressee_id = auth.uid()
) WITH CHECK (requester_id = auth.uid() OR addressee_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.loyalty_points TO authenticated;
GRANT ALL ON public.loyalty_points TO service_role;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own points" ON public.loyalty_points FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own points" ON public.loyalty_points FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_groups TO authenticated;
GRANT ALL ON public.saved_groups TO service_role;
ALTER TABLE public.saved_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saved groups" ON public.saved_groups FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_group_members TO authenticated;
GRANT ALL ON public.saved_group_members TO service_role;
ALTER TABLE public.saved_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own group members" ON public.saved_group_members FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.saved_groups WHERE saved_groups.id = group_id AND saved_groups.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.saved_groups WHERE saved_groups.id = group_id AND saved_groups.user_id = auth.uid())
);

GRANT SELECT, INSERT, UPDATE ON public.waiter_calls TO authenticated;
GRANT ALL ON public.waiter_calls TO service_role;
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read session waiter calls" ON public.waiter_calls FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.session_participants WHERE session_id = waiter_calls.session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create waiter calls" ON public.waiter_calls FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can manage waiter calls" ON public.waiter_calls FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'waiter')
) WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'waiter')
);

GRANT SELECT, INSERT ON public.visit_history TO authenticated;
GRANT ALL ON public.visit_history TO service_role;
ALTER TABLE public.visit_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own visits" ON public.visit_history FOR SELECT TO authenticated USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.gift_meals TO authenticated;
GRANT ALL ON public.gift_meals TO service_role;
ALTER TABLE public.gift_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own gifts" ON public.gift_meals FOR SELECT TO authenticated USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

ALTER PUBLICATION supabase_realtime ADD TABLE public.table_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;