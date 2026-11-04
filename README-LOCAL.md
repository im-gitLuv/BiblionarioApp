# Biblionario · Corona de Gloria

Juego bíblico en español con backend Next.js, Prisma y PostgreSQL. Preguntas, respuestas, comodines, tiempos, partidas y clasificación se validan en el servidor. El cliente no contiene el banco ni decide los puntajes.

## Empezar

Requiere Node.js 22.18+ y PostgreSQL. Desde esta carpeta:

1. Instalar con npm ci.
2. Copiar .env.example a .env y configurar DATABASE_URL (conexión agrupada) y DIRECT_URL (conexión directa). No publicar este archivo.
3. Opcional: docker compose up -d. El .env local se alineó con las credenciales de desarrollo de docker-compose; PostgreSQL no está instalado ni iniciado en este equipo.
4. Ejecutar npm run db:deploy.
5. Ejecutar npm run db:seed.
6. Ejecutar npm run dev y abrir http://localhost:3000.

No se migra el archivo SQLite del scaffold; no era la base activa del juego. Se conserva el archivo preexistente.

## Contenido y perfiles

Semilla: 45 preguntas en español, tres por cada escalón. Requiere revisión editorial antes de publicar. Crecer mediante npm run db:import -- ruta/al/banco.json. El JSON de ejemplo está en prisma/questions.es.json. La importación valida estructura y hace upsert transaccional por ID sin borrar registros ausentes.

Cada jugador tiene un perfil de invitado con nombre público y cookie privada HttpOnly. No hay aún inicio de sesión recuperable ni identidad sincronizada entre dispositivos. La clasificación muestra la mejor partida terminada por perfil; no acepta puntajes enviados por el navegador.

## Verificar

- npm test: reglas de premios y validación/cobertura del banco.
- npm run typecheck: tipos de TypeScript.
- npm run lint: revisión estática.
- npm run build: cliente Prisma y compilación de producción con Webpack (evita un fallo de procesos de Turbopack observado en Windows/Node 26).
- npm run test:integration: requiere build previo, PostgreSQL dedicado de pruebas con migraciones y semilla, y BIBLIONARIO_INTEGRATION=1. Arranca el servidor en puerto 3100. Nunca apuntar a producción. Comprueba propietarios, versiones simultáneas, comodines, victoria, vencimiento y retiro.

.github/workflows/checks.yml prepara PostgreSQL temporal y ejecuta estas verificaciones cuando esta carpeta es la raíz del repositorio GitHub.

## Publicar desde cero

La preferencia confirmada es crear repositorio y base nuevos. Destino previsto: GitHub + Vercel + PostgreSQL (Neon propuesto). Repositorio: https://github.com/im-gitLuv/BiblionarioApp. Proyecto Vercel creado: https://vercel.com/im-gitluvs-projects/biblionario. GitHub y Vercel conectados; falta conectar Neon y crear PostgreSQL. Todavía no hay despliegue funcional.

Publicar esta carpeta como raíz del repositorio; así las notas de Obsidian quedan fuera. En Vercel seleccionar Next.js, build npm run build y configurar las dos variables privadas de conexión. Aplicar db:deploy y db:seed explícitamente antes de abrir el juego. No sembrar ni cambiar esquema automáticamente en cada build. Usar bases separadas para previews y producción.

## Documentación viva

Abrir la bóveda Biblionario App y comenzar por [[Biblionario - Inicio]] en Proyecto/. Incluye producto, reglas, arquitectura, convenciones, banco, implementación, decisiones y roadmap.

## Estado de verificación

Pruebas locales (3), TypeScript, lint y compilación de producción aprobados. Menú inspeccionado en navegador. La prueba integral necesita PostgreSQL y sigue pendiente; no se sustituye por resultados simulados.

Se eliminaron dependencias del scaffold sin uso, se actualizaron Prisma 6.19.3 y Sharp, y se fija deepmerge-ts 8 mediante override para corregir el aviso de recursión de la herramienta de configuración de Prisma. Se verifica generación de cliente y build tras este ajuste.
