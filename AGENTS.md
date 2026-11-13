# Biblionario

Juego en español con Next.js App Router, Prisma y PostgreSQL. Conservar la estética dorada y el vocabulario: Coronas, Corona de Gloria, Siclos, Los Dos Testigos, Concilio de los Setenta, Consejo de un Sabio y Salón de la Sabiduría (nombres actualizados por el propietario en la v1.1; las claves internas de los comodines siguen siendo fifty, audience y prophet).

La autoridad del juego pertenece al servidor: nunca incluir preguntas con soluciones en componentes cliente ni aceptar premios elegidos por el navegador. Mantener control de propietario, versión y vencimiento en cada mutación. Las instantáneas de preguntas son privadas y no forman parte de PublicGame.

Banco editorial en `prisma/questions.es.json`; importar mediante CLI validada, nunca con un endpoint público sin autenticación administrativa. Cada pregunta pertenece a un escalón exacto 1–15. La semilla requiere revisión editorial antes de publicarse.

Mantener separados secretos y código. No versionar `.env`, bases SQLite ni credenciales. Aplicar migraciones revisadas mediante `db:deploy`; la semilla es una operación explícita, no parte del build.

Comprobar tipos, lint, pruebas y build según el alcance del cambio. Las pruebas integrales necesitan PostgreSQL dedicado, migrado y sembrado; no sustituirlas por simulaciones ni reportarlas como ejecutadas si no hay base disponible.

La documentación viva está en la bóveda de Obsidian, `../../Proyecto/`, índice `Biblionario - Inicio.md`. Si está disponible, actualizar las notas enlazadas de reglas, arquitectura, convenciones, implementación, decisiones y roadmap cuando cambien. Si este código se publica sin la bóveda, mantener README-LOCAL.md actualizado.

Perfiles actuales: invitados por navegador. No describirlos como cuentas recuperables. El roadmap contempla autenticación, revisión editorial, límites distribuidos y métricas de contenido.
