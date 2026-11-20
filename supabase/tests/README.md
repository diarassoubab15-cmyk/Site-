# Tests de sécurité de la base

14 scénarios d'attaque (faux admin, vendeur qui s'autorise, total truqué, lecture des données d'autrui…).

```bash
createdb nexora_test
psql -d nexora_test -f supabase/tests/auth_stub.sql
psql -d nexora_test -f supabase/migrations/0001_init.sql -f supabase/migrations/0002_app.sql
psql -d nexora_test -f supabase/tests/rls_test.sql
```

Chaque ligne « doit échouer » doit afficher une erreur, chaque « doit réussir » non.
