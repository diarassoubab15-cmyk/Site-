# Tests de sécurité de la base

58 scénarios d'attaque (faux admin, vendeur qui s'autorise, total truqué, lecture des données d'autrui…).

```bash
createdb nexora_test
psql -d nexora_test -f supabase/tests/auth_stub.sql
psql -d nexora_test -f supabase/migrations/0001_init.sql -f supabase/migrations/0002_app.sql -f supabase/migrations/0003_subscription_payments.sql -f supabase/migrations/0004_rewards.sql -f supabase/migrations/0005_shop_videos.sql -f supabase/migrations/0006_product_media.sql -f supabase/migrations/0007_product_media_delete.sql -f supabase/migrations/0008_product_edit_requests.sql
psql -d nexora_test -f supabase/tests/rls_test.sql
psql -d nexora_test -f supabase/tests/payments_test.sql
psql -d nexora_test -f supabase/tests/rewards_test.sql
psql -d nexora_test -f supabase/tests/videos_test.sql
psql -d nexora_test -f supabase/tests/media_test.sql
psql -d nexora_test -f supabase/tests/edits_test.sql
```

Chaque ligne « doit échouer » doit afficher une erreur, chaque « doit réussir » non.
