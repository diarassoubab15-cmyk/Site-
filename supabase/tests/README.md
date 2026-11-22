# Tests de sécurité de la base

58 scénarios d'attaque (faux admin, vendeur qui s'autorise, total truqué, lecture des données d'autrui…).

```bash
createdb nexora_test
psql -d nexora_test -f supabase/tests/auth_stub.sql
psql -d nexora_test -f supabase/migrations/20261121183051_0001_init.sql -f supabase/migrations/20261121183201_0002_app.sql -f supabase/migrations/20261121183501_0003_subscription_payments.sql -f supabase/migrations/20261122092704_0004_rewards.sql -f supabase/migrations/20261122092754_0005_shop_videos.sql -f supabase/migrations/20261122092915_0006_product_media.sql -f supabase/migrations/20261122092957_0007_product_media_delete.sql -f supabase/migrations/20261122093007_0008_product_edit_requests.sql -f supabase/migrations/20261122093614_0009_shop_profile.sql -f supabase/migrations/20261122093700_0010_plans_v2.sql -f supabase/migrations/20261122093709_0011_preferred_payment.sql -f supabase/migrations/20261122093731_0012_tryon.sql -f supabase/migrations/20261122093803_0013_shop_tier.sql -f supabase/migrations/20261122093809_0014_shop_theme.sql -f supabase/migrations/20261122093951_0015_featured_shops.sql -f supabase/migrations/20261122122403_0016_ai_studio.sql -f supabase/migrations/20261122194801_0017_shop_links.sql
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
