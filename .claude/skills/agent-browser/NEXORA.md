# agent-browser dans les sessions cloud de NEXORA

Le CLI n'est pas installé d'office dans le conteneur. Pour l'utiliser :

```bash
npm i -g agent-browser
export AGENT_BROWSER_EXECUTABLE_PATH=/opt/pw-browsers/chromium   # Chromium déjà présent, pas besoin de « agent-browser install »
agent-browser open http://localhost:3100/
```

Pour tester le site sans Supabase (mode démo) : `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npx next dev -p 3100`.
