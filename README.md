# EcoMart – Auditoría de seguridad y optimización

| Carpeta | Contenido |
|---|---|
| `antes/` | EcoMart original: `service_role` en el cliente, RLS "permitir todo", XSS, bundle de un solo chunk (+ `src/audit.test.tsx`: sondas que reproducen los exploits) |
| `despues/` | EcoMart endurecido y optimizado (rutas con `lazy`/`Suspense`, `date-fns`, RLS por dueño, guardas contra secretos) + `src/security.test.tsx` |
| `auditoria/` | 8 ataques a Postgres real (PGlite) contra la base "antes" y la endurecida |
| `reportes/` | Treemaps de `rollup-plugin-visualizer` antes/después (HTML y PNG) |

```bash
cd despues && npm install && npm test && npm run build     # pruebas de seguridad + build
ANALYZE=1 npm run build                                    # genera stats.html (visualizer)
cd ../auditoria && npm install && npm test                 # 8 ataques: antes 8/8 exitosos → después 0/8
```
Variables: copia `despues/.env.example` a `.env`. **Nunca** pongas la `service_role` en una variable `VITE_*`.
