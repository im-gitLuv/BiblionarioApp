# ¿Quién quiere ser Biblionario?

Juego bíblico en español con backend Next.js, Prisma y PostgreSQL. Preguntas, respuestas, comodines, tiempos, partidas y clasificación se validan en el servidor. El cliente no contiene el banco ni decide los puntajes.

## Empezar

Requiere Node.js 22.18+ y PostgreSQL. Desde esta carpeta:

1. Instalar con npm ci.
2. Copiar .env.example a .env y configurar DATABASE_URL (conexión agrupada) y DIRECT_URL (conexión directa). No publicar este archivo.
3. Configurar una base de desarrollo aislada. La rama Neon development-ui-review está separada de producción y configurada en el .env local; también se puede usar docker compose up -d.
4. Ejecutar npm run db:deploy.
5. Ejecutar npm run db:seed.
6. Ejecutar npm run dev y abrir http://localhost:3000.

No se migra el archivo SQLite del scaffold; no era la base activa del juego. Se conserva el archivo preexistente.

## Contenido y perfiles

Banco: 495 preguntas en español, 33 por escalón, con referencias a los 66 libros. Crecer mediante npm run db:import -- prisma/questions.es.json. La importación valida estructura y hace upsert transaccional por ID sin borrar registros ausentes. La revisión web inicial contrasta pasajes seleccionados; no equivale a una auditoría bíblica independiente de las 495 preguntas. La dificultad es editorial y debe calibrarse con el piloto.

Cada jugador tiene un perfil de invitado con nombre público y cookie privada HttpOnly. No hay aún inicio de sesión recuperable ni identidad sincronizada entre dispositivos. La clasificación suma los premios históricos de todas las partidas terminadas de cada perfil; cada victoria completa concede una Corona de conocimiento. Los premios parciales no conceden esa distinción. Los totales se calculan en el servidor desde las partidas existentes, sin migraciones ni reinicio de resultados.

## Verificar

- npm test: reglas de premios y validación/cobertura del banco.
- npm run typecheck: tipos de TypeScript.
- npm run lint: revisión estática.
- npm run build: cliente Prisma y compilación de producción con Webpack (evita un fallo de procesos de Turbopack observado en Windows/Node 26).
- npm run test:integration: requiere build previo, PostgreSQL dedicado de pruebas con migraciones y semilla, y BIBLIONARIO_INTEGRATION=1. Arranca el servidor en puerto 3100. Nunca apuntar a producción. Comprueba propietarios, versiones simultáneas, comodines, victoria, vencimiento y retiro.
- npx playwright test: recorrido real en Chromium de escritorio y viewport móvil con PostgreSQL dedicado, build previo y BIBLIONARIO_INTEGRATION=1; verifica nombre, tres comodines, pausa persistente, reloj nuevo y resultado. Instalar antes Chromium con npx playwright install --with-deps chromium.

.github/workflows/checks.yml prepara PostgreSQL temporal y ejecuta estas verificaciones cuando esta carpeta es la raíz del repositorio GitHub.

## Publicar desde cero

Repositorio: https://github.com/im-gitLuv/BiblionarioApp. Proyecto activo de Vercel: biblionario-app. Producción: https://biblionario-app.vercel.app. PostgreSQL de producción en Neon, proyecto Biblionario. La rama development-ui-review se usa para desarrollo local.

Publicar esta carpeta como raíz del repositorio; así las notas de Obsidian quedan fuera. En Vercel seleccionar Next.js, build npm run build y configurar las dos variables privadas de conexión. Aplicar db:deploy y db:seed explícitamente antes de abrir el juego. No sembrar ni cambiar esquema automáticamente en cada build. Usar bases separadas para previews y producción.

## Documentación viva

Abrir la bóveda Biblionario App y comenzar por [[Biblionario - Inicio]] en Proyecto/. Incluye producto, reglas, arquitectura, convenciones, banco, implementación, decisiones y roadmap.

## Estado de verificación

Pruebas locales (3), TypeScript, lint y compilación de producción aprobados. Menú inspeccionado en navegador. La prueba integral también pasó en GitHub Actions contra PostgreSQL temporal, con migración y semilla reales: https://github.com/im-gitLuv/BiblionarioApp/actions/runs/41830985426. La base permanente de producción está conectada y el juego publicado.

Se eliminaron dependencias del scaffold sin uso, se actualizaron Prisma 6.19.3 y Sharp, y se fija deepmerge-ts 8 mediante override para corregir el aviso de recursión de la herramienta de configuración de Prisma. Se verifica generación de cliente y build tras este ajuste.


## Interacción de preguntas y comodines
Al comenzar sin nombre válido, el campo recibe foco, desplazamiento automático y brillo. Los aciertos se guardan en pausa de lectura; «Siguiente pregunta» inicia el reloj completo del siguiente escalón mediante la acción next. El estado se conserva al recuperar la partida. Tras fallar o completar el recorrido se lee el resultado antes de «Ver resultado». Los tres comodines se confirman con el anfitrión. El 50:50 desactiva dos respuestas directamente; la congregación y la voz profética muestran un diálogo con fondo desenfocado, el mismo reloj circular del juego y «Volver a la pregunta». La escalera móvil se abre desde una pestaña cuadrada en el borde derecho que sobresale del panel abierto. No requiere migraciones de esquema.
