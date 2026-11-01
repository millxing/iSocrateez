# Previous version

`v1/` preserves the tracked source of iSocrateez at commit `617b018`, before the v2 promotion. It is excluded from the current app's tests and build. Local secrets, dependencies, and generated files are intentionally not archived.

To run it separately:

```sh
cd archive/v1
npm install
npm run dev -- --port 5175
```

Configure its API endpoint using `.env.example` if needed. The root app is the maintained version.
