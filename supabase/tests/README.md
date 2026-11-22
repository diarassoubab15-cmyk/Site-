# Tests de sécurité de la base

58 scénarios d'attaque (faux admin, vendeur qui s'autorise, total truqué, lecture des données d'autrui…).

```bash
createdb nexora_test
psql -d nexora_test -f supabase/tests/auth_stub.sql
psql -d nexora_test -f supabase/migrations/0001_init.sql -f supabase/migrations/0002_app.sql -f supabase/migrations/0003_subscription_payments.sql -f supabase/migrations/0004_rewards.sql -f supabase/migrations/0005_shop_videos.sql -f supabase/migrations/0006_product_media.sql -f supabase/migrations/0007_product_media_delete.sql -f supabase/migrations/0008_product_edit_requests.sql -f supabase/migrations/0009_shop_profile.sql -f supabase/migrations/0010_plans_v2.sql -f supabase/migrations/0011_preferred_payment.sql -f supabase/migrations/0012_tryon.sql -f supabase/migrations/0013_shop_tier.sql -f supabase/migrations/0014_shop_theme.sql -f supabase/migrations/0015_featured_shops.sql -f supabase/migrations/0016_ai_studio.sql -f supabase/migrations/0017_shop_links.sql
psql -d nexora_test -f supabase/tests/rls_test.sql
psql -d nexora_test -f supabase/tests/payments_test.sql
psql -d nexora_test -f supabase/tests/rewards_test.sql
psql -d nexora_test -f supabase/tests/videos_test.sql
psql -d nexora_test -f supabase/tests/media_test.sql
psql -d nexora_test -f supabase/tests/edits_test.sql
psql -d nexora_test -f supabase/tests/shop_profile_test.sql
psql -d nexora_test -f supabase/tests/plans_test.sql
psql -d nexora_test -f supabase/tests/tryon_test.sql
psql -d nexora_test -f supabase/tests/theme_test.sql
psql -d nexora_test -f supabase/tests/featured_test.sql
psql -d nexora_test -f supabase/tests/ai_studio_test.sql
psql -d nexora_test -f supabase/tests/shop_links_test.sql
```

Chaque ligne « doit échouer » doit afficher une erreur, chaque « doit réussir » non.
