# Definicion del codigo fuente del programa

Documento tecnico generado para apoyar la redaccion formal del apartado **7.1 Definicion del codigo fuente del programa** del plan de pruebas.

Fecha de corte: 2026-05-15. Repositorio analizado: `enduren-back` en `/home/stiigma/Escritorio/VERSION-ACTUAL-ENDURE/Archivador/SierraJuarezDay/back-enduren`.

## 1. Resumen ejecutivo para redaccion formal

El programa corresponde al backend de **Enduren**, una API desarrollada con **NestJS** y **TypeScript** sobre Node.js. El codigo fuente principal se localiza en `src/` y esta organizado como un monolito modular con separacion por contextos funcionales y capas de arquitectura: dominio, aplicacion, infraestructura y presentacion HTTP. La persistencia se implementa con **TypeORM** y **PostgreSQL**, usando migraciones versionadas en `src/migrations/`. El proyecto incluye validacion global de datos con `ValidationPipe`, autenticacion JWT mediante guard global, manejo de cookies para sesiones web, soporte de tokens para clientes moviles, y pruebas unitarias/e2e con **Jest**.

Texto base sugerido para el plan de pruebas:

> El codigo fuente del programa esta implementado principalmente en TypeScript bajo el framework NestJS. La solucion corresponde a un backend modular que expone servicios REST para autenticacion, usuarios, perfil, rutinas de entrenamiento, sesiones de entrenamiento, catalogo de ejercicios y estrategias de entrenamiento. La estructura separa reglas de dominio, casos de uso, adaptadores de persistencia y controladores HTTP, lo cual facilita la trazabilidad de pruebas por modulo y por capa. El proyecto cuenta con 223 archivos TypeScript, de los cuales 190 corresponden a codigo de produccion y 33 a pruebas. En total se identificaron 18,275 lineas TypeScript, 161 clases, 79 interfaces, 5 enumeraciones y 12 alias de tipo. La base de datos se gestiona con TypeORM y PostgreSQL mediante 20 migraciones versionadas.

## 2. Identificacion del proyecto

| Dato | Valor |
|---|---|
| Nombre npm | `enduren-back` |
| Version | `0.0.1` |
| Tipo de proyecto | Backend/API REST |
| Lenguaje principal | TypeScript |
| Framework principal | NestJS |
| Runtime esperado | Node.js |
| Persistencia | TypeORM + PostgreSQL |
| Pruebas | Jest, ts-jest, supertest |
| Entrada principal | `src/main.ts` |
| Modulo raiz | `src/app.module.ts` |
| Salida de compilacion | `./dist` |
| Target TypeScript | `ES2023` |
| Modulo TypeScript | `commonjs` |

## 3. Stack y dependencias relevantes

Dependencias de ejecucion principales:

| Dependencia | Version |
| --- | --- |
| `@nestjs/common` | `^11.0.1` |
| `@nestjs/config` | `^4.0.4` |
| `@nestjs/core` | `^11.0.1` |
| `@nestjs/jwt` | `^11.0.2` |
| `@nestjs/passport` | `^11.0.5` |
| `@nestjs/platform-express` | `^11.0.1` |
| `@nestjs/typeorm` | `^11.0.1` |
| `bcryptjs` | `^3.0.3` |
| `class-transformer` | `^0.5.1` |
| `class-validator` | `^0.15.1` |
| `cookie-parser` | `^1.4.7` |
| `passport` | `^0.7.0` |
| `passport-jwt` | `^4.0.1` |
| `pg` | `^8.20.0` |
| `reflect-metadata` | `^0.2.2` |
| `rxjs` | `^7.8.1` |
| `typeorm` | `^0.3.28` |

Dependencias de desarrollo relevantes para pruebas, compilacion y calidad:

| Dependencia | Version |
| --- | --- |
| `@nestjs/cli` | `^11.0.0` |
| `@nestjs/testing` | `^11.0.1` |
| `better-sqlite3` | `^12.9.0` |
| `eslint` | `^9.18.0` |
| `jest` | `^30.0.0` |
| `prettier` | `^3.4.2` |
| `supertest` | `^7.0.0` |
| `ts-jest` | `^29.2.5` |
| `typescript` | `^5.7.3` |

Scripts disponibles:

| Script | Comando |
| --- | --- |
| `build` | `nest build` |
| `format` | `prettier --write "src/**/*.ts" "test/**/*.ts"` |
| `start` | `nest start` |
| `start:dev` | `nest start --watch` |
| `start:debug` | `nest start --debug --watch` |
| `start:prod` | `node dist/main` |
| `lint` | `eslint "{src,apps,libs,test}/**/*.ts" --fix` |
| `test` | `jest` |
| `test:watch` | `jest --watch` |
| `test:cov` | `jest --coverage` |
| `test:debug` | `node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand` |
| `test:e2e` | `jest --config ./test/jest-e2e.json` |

## 4. Criterio de conteo

- Se excluyeron `.git/`, `node_modules/`, `dist/`, `coverage/`, `.cache/`, `.agents/`, `.codex/` y `docs/`.
- Las lineas son lineas fisicas de archivo, no lineas logicas de codigo.
- La columna "No vacias" cuenta lineas con contenido distinto de espacios.
- No se incluyeron valores reales de `.env`; solo se documenta la existencia de configuracion por entorno.
- El modulo `publication` aparece en la estructura, pero sus archivos estan vacios y se reporta como no implementado.

## 5. Metricas globales

| Metrica | Valor |
|---|---:|
| Archivos totales analizados | 237 |
| Archivos TypeScript | 223 |
| Archivos TypeScript de produccion | 190 |
| Archivos TypeScript de pruebas | 33 |
| Lineas TypeScript totales | 18275 |
| Lineas TypeScript de produccion | 10824 |
| Lineas TypeScript de pruebas | 7451 |
| Clases detectadas | 161 |
| Interfaces detectadas | 79 |
| Enums detectados | 5 |
| Type aliases detectados | 12 |
| Migraciones TypeORM | 20 |
| Archivos vacios | 26 |

Por extension:

| Extension | Archivos | Lineas |
| --- | --- | --- |
| `.ts` | 223 | 18275 |
| `.json` | 7 | 12038 |
| `.md` | 1 | 99 |
| `(none)` | 2 | 62 |
| `.log` | 1 | 56 |
| `.mjs` | 1 | 42 |
| `.env` | 2 | 24 |

Por categoria:

| Categoria | Archivos | Lineas | Lineas no vacias |
| --- | --- | --- | --- |
| Configuracion/documentacion | 12 | 11609 | 11557 |
| Codigo fuente por modulo | 160 | 8875 | 7951 |
| Prueba | 34 | 7461 | 6551 |
| Migracion TypeORM | 20 | 1389 | 1306 |
| Recurso de datos | 1 | 702 | 702 |
| Codigo compartido/observabilidad | 6 | 459 | 396 |
| Codigo fuente raiz | 4 | 101 | 88 |

## 6. Organizacion arquitectonica

La aplicacion usa una organizacion modular compatible con DDD y Clean Architecture ligera:

- `domain`: entidades, value objects, errores de dominio y puertos de repositorio. No deberia depender de HTTP ni TypeORM.
- `application`: casos de uso y puertos de aplicacion. Coordina reglas, repositorios y actor actual.
- `infrastructure`: entidades TypeORM, repositorios concretos, mappers y providers.
- `presentation`: controladores HTTP, DTOs, filtros, guards y decoradores.
- `shared/observability`: servicios transversales de logging, contexto de request y sanitizacion.

Metricas por modulo TypeScript:

| Modulo | Archivos | No vacios | Lineas | Prod | Pruebas | Clases | Interfaces | Enums | Types |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `training` | 117 | 117 | 13468 | 89 | 28 | 94 | 57 | 5 | 4 |
| `migrations` | 20 | 20 | 1389 | 20 | 0 | 20 | 0 | 0 | 0 |
| `auth` | 21 | 21 | 952 | 21 | 0 | 18 | 11 | 0 | 1 |
| `test-e2e` | 4 | 4 | 722 | 0 | 4 | 0 | 0 | 0 | 0 |
| `profile` | 14 | 14 | 719 | 14 | 0 | 12 | 6 | 0 | 4 |
| `shared` | 6 | 6 | 459 | 6 | 0 | 5 | 1 | 0 | 1 |
| `users` | 10 | 10 | 442 | 10 | 0 | 9 | 4 | 0 | 2 |
| `root` | 5 | 5 | 124 | 4 | 1 | 3 | 0 | 0 | 0 |
| `publication` | 26 | 0 | 0 | 26 | 0 | 0 | 0 | 0 | 0 |

Metricas por capa en modulos de produccion:

| Modulo | Capa | Archivos | No vacios | Lineas |
| --- | --- | --- | --- | --- |
| `auth` | `application` | 5 | 5 | 351 |
| `auth` | `domain` | 2 | 2 | 72 |
| `auth` | `infrastructure` | 4 | 4 | 150 |
| `auth` | `module-root` | 1 | 1 | 71 |
| `auth` | `presentation` | 9 | 9 | 308 |
| `profile` | `application` | 3 | 3 | 194 |
| `profile` | `domain` | 3 | 3 | 154 |
| `profile` | `infrastructure` | 3 | 3 | 134 |
| `profile` | `module-root` | 1 | 1 | 26 |
| `profile` | `presentation` | 4 | 4 | 211 |
| `publication` | `application` | 10 | 0 | 0 |
| `publication` | `domain` | 8 | 0 | 0 |
| `publication` | `infrastructure` | 3 | 0 | 0 |
| `publication` | `module-root` | 1 | 0 | 0 |
| `publication` | `presentation` | 4 | 0 | 0 |
| `training` | `application` | 26 | 26 | 2749 |
| `training` | `domain` | 19 | 19 | 1855 |
| `training` | `infrastructure` | 18 | 18 | 899 |
| `training` | `module-root` | 1 | 1 | 9 |
| `training` | `presentation` | 25 | 25 | 1250 |
| `users` | `application` | 1 | 1 | 79 |
| `users` | `domain` | 3 | 3 | 116 |
| `users` | `infrastructure` | 2 | 2 | 120 |
| `users` | `module-root` | 1 | 1 | 30 |
| `users` | `presentation` | 3 | 3 | 97 |

## 7. Descripcion funcional por modulo

| Modulo | Descripcion para el plan de pruebas |
|---|---|
| `auth` | Gestiona registro, inicio de sesion, cierre de sesion, refresh token, verificacion del usuario autenticado, JWT, cookies y hash de contrasena. |
| `users` | Gestiona creacion de usuarios y consulta del usuario autenticado. Define entidad de usuario, repositorio de dominio y adaptador TypeORM. |
| `profile` | Gestiona perfil de usuario y estado de onboarding. Incluye datos personales, objetivo, experiencia, unidad de peso y dias disponibles por semana. |
| `training` | Modulo principal del dominio. Gestiona rutinas, dias de rutina, ejercicios, sets, catalogo de ejercicios, estrategias de entrenamiento, sesiones, progreso e historial. |
| `shared/observability` | Provee logging HTTP, logging de casos de uso, contexto de request y sanitizacion de datos sensibles en logs. |
| `migrations` | Contiene migraciones TypeORM para crear y evolucionar tablas, relaciones, catalogos y semillas. |
| `publication` | Existe como estructura de carpetas, pero todos sus archivos estan vacios. No debe considerarse funcional en el plan de pruebas actual. |

## 8. Endpoints HTTP identificados

La aplicacion registra `JwtAuthGuard` como guard global en `AppModule`. Los endpoints marcados con `@Public()` son publicos; el resto requiere JWT.

| Controller | Metodo HTTP | Ruta | Handler | Autenticacion | Ubicacion |
| --- | --- | --- | --- | --- | --- |
| `AppController` | GET | `/` | `getHello` | JWT/global guard | `src/app.controller.ts:8` |
| `AuthController` | POST | `/auth/register` | `register` | Publico | `src/modules/auth/presentation/http/controllers/auth.controller.ts:69` |
| `AuthController` | POST | `/auth/login` | `login` | Publico | `src/modules/auth/presentation/http/controllers/auth.controller.ts:86` |
| `AuthController` | POST | `/auth/logout` | `logout` | JWT/global guard | `src/modules/auth/presentation/http/controllers/auth.controller.ts:102` |
| `AuthController` | POST | `/auth/refresh` | `refresh` | Publico | `src/modules/auth/presentation/http/controllers/auth.controller.ts:118` |
| `AuthController` | GET | `/auth/me` | `me` | JWT/global guard | `src/modules/auth/presentation/http/controllers/auth.controller.ts:150` |
| `ProfileController` | POST | `/onboarding/profile` | `createOrUpdate` | JWT/global guard | `src/modules/profile/presentation/http/controllers/profile.controller.ts:31` |
| `ProfileController` | GET | `/profile` | `getProfile` | JWT/global guard | `src/modules/profile/presentation/http/controllers/profile.controller.ts:53` |
| `ProfileController` | GET | `/onboarding/status` | `checkOnboardingStatus` | JWT/global guard | `src/modules/profile/presentation/http/controllers/profile.controller.ts:66` |
| `(archivo vacio)` | - | - | sin metodos | No implementado | `src/modules/publication/presentation/http/controllers/publication.controller.ts` |
| `ExerciseCatalogController` | GET | `/exercises/catalog` | `list` | JWT/global guard | `src/modules/training/presentation/http/controllers/exercise-catalog.controller.ts:13` |
| `RoutineController` | GET | `/routines` | `list` | JWT/global guard | `src/modules/training/presentation/http/controllers/routine.controller.ts:67` |
| `RoutineController` | GET | `/routines/:routineId` | `getDetail` | JWT/global guard | `src/modules/training/presentation/http/controllers/routine.controller.ts:75` |
| `RoutineController` | POST | `/routines` | `create` | JWT/global guard | `src/modules/training/presentation/http/controllers/routine.controller.ts:87` |
| `RoutineController` | POST | `/routines/:routineId/days/:dayOfWeek/exercises` | `addExercise` | JWT/global guard | `src/modules/training/presentation/http/controllers/routine.controller.ts:103` |
| `RoutineController` | DELETE | `/routines/:routineId/days/:dayOfWeek/exercises/:exerciseId` | `removeExercise` | JWT/global guard | `src/modules/training/presentation/http/controllers/routine.controller.ts:125` |
| `RoutineController` | PATCH | `/routines/:routineId/days/:dayOfWeek/exercises/:exerciseId` | `configureExercise` | JWT/global guard | `src/modules/training/presentation/http/controllers/routine.controller.ts:149` |
| `RoutineController` | PATCH | `/routines/:routineId/activate` | `activate` | JWT/global guard | `src/modules/training/presentation/http/controllers/routine.controller.ts:175` |
| `RoutineController` | PATCH | `/routines/:routineId/deactivate` | `deactivate` | JWT/global guard | `src/modules/training/presentation/http/controllers/routine.controller.ts:188` |
| `RoutineController` | DELETE | `/routines/:routineId` | `delete` | JWT/global guard | `src/modules/training/presentation/http/controllers/routine.controller.ts:201` |
| `RoutineController` | PATCH | `/routines/:routineId/sync` | `sync` | JWT/global guard | `src/modules/training/presentation/http/controllers/routine.controller.ts:219` |
| `RoutineController` | PATCH | `/routines/:routineId/training-strategy` | `setTrainingStrategy` | JWT/global guard | `src/modules/training/presentation/http/controllers/routine.controller.ts:233` |
| `RoutineController` | POST | `/routines/:routineId/generate-sets` | `generateSets` | JWT/global guard | `src/modules/training/presentation/http/controllers/routine.controller.ts:250` |
| `TrainingStrategyController` | GET | `/training-strategies` | `list` | JWT/global guard | `src/modules/training/presentation/http/controllers/training-strategy.controller.ts:15` |
| `WorkoutSessionController` | POST | `/workout-sessions` | `start` | JWT/global guard | `src/modules/training/presentation/http/controllers/workout-session.controller.ts:65` |
| `WorkoutSessionController` | PATCH | `/workout-sessions/:sessionId/finish` | `finish` | JWT/global guard | `src/modules/training/presentation/http/controllers/workout-session.controller.ts:80` |
| `WorkoutSessionController` | GET | `/workout-sessions/in-progress` | `resume` | JWT/global guard | `src/modules/training/presentation/http/controllers/workout-session.controller.ts:92` |
| `WorkoutSessionController` | GET | `/workout-sessions/history` | `history` | JWT/global guard | `src/modules/training/presentation/http/controllers/workout-session.controller.ts:102` |
| `WorkoutSessionController` | GET | `/workout-sessions/exercises/:exerciseId/progress` | `exerciseProgress` | JWT/global guard | `src/modules/training/presentation/http/controllers/workout-session.controller.ts:123` |
| `WorkoutSessionController` | GET | `/workout-sessions/:sessionId` | `get` | JWT/global guard | `src/modules/training/presentation/http/controllers/workout-session.controller.ts:150` |
| `WorkoutSessionController` | PATCH | `/workout-sessions/:sessionId/exercises/:exerciseIndex/sets/:setNumber` | `registerSetRepsAndWeight` | JWT/global guard | `src/modules/training/presentation/http/controllers/workout-session.controller.ts:162` |
| `WorkoutSessionController` | PATCH | `/workout-sessions/:sessionId/exercises/:exerciseIndex/sets/:setNumber/complete` | `markSetAsCompleted` | JWT/global guard | `src/modules/training/presentation/http/controllers/workout-session.controller.ts:183` |
| `WorkoutSessionController` | POST | `/workout-sessions/:sessionId/advance-exercise` | `advanceToNextExercise` | JWT/global guard | `src/modules/training/presentation/http/controllers/workout-session.controller.ts:197` |
| `UserController` | POST | `/users` | `create` | JWT/global guard | `src/modules/users/presentation/http/controllers/user.controller.ts:21` |
| `UserController` | GET | `/users/me` | `me` | JWT/global guard | `src/modules/users/presentation/http/controllers/user.controller.ts:36` |

## 9. Persistencia y base de datos

La configuracion de `AppModule` usa `TypeOrmModule.forRootAsync` con PostgreSQL. La sincronizacion automatica esta desactivada mediante `synchronize: false`, y las migraciones se ejecutan con `migrationsRun: true`. Las variables esperadas de configuracion son `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` y `DB_DATABASE`.

Entidades TypeORM detectadas:

| Tabla | Clase TypeORM | Columnas principales | Archivo |
| --- | --- | --- | --- |
| `(sin @Entity)` | `(sin clase)` | - | `src/modules/publication/infrastructure/persistence/typeorm/entities/publication-typeorm.entity.ts` |
| `exercise_catalog` | `ExerciseCatalogTypeormEntity` | name, category, primaryMuscleGroup, equipment, videoUrl, imageUrl | `src/modules/training/infrastructure/persistence/typeorm/entities/exercise-catalog-typeorm.entity.ts` |
| `exercise_sets` | `ExerciseSetTypeormEntity` | exerciseId, setNumber, reps, weight, restSeconds | `src/modules/training/infrastructure/persistence/typeorm/entities/exercise-set-typeorm.entity.ts` |
| `exercises` | `ExerciseTypeormEntity` | name, order, routineDayId | `src/modules/training/infrastructure/persistence/typeorm/entities/exercise-typeorm.entity.ts` |
| `refresh_tokens` | `RefreshTokenTypeormEntity` | token, userId, expiresAt, createdAt, usedAt | `src/modules/auth/infrastructure/persistence/typeorm/entities/refresh-token-typeorm.entity.ts` |
| `routine_days` | `RoutineDayTypeormEntity` | dayOfWeek, routineId | `src/modules/training/infrastructure/persistence/typeorm/entities/routine-day-typeorm.entity.ts` |
| `routines` | `RoutineTypeormEntity` | name, userId, isActive, trainingStrategyKey, createdAt, updatedAt | `src/modules/training/infrastructure/persistence/typeorm/entities/routine-typeorm.entity.ts` |
| `training_strategies` | `TrainingStrategyTypeormEntity` | name, description, rules | `src/modules/training/infrastructure/persistence/typeorm/entities/training-strategy-typeorm.entity.ts` |
| `user_profiles` | `ProfileTypeormEntity` | userId, fullName, birthDate, gender, weight, height, experienceLevel, mainGoal, daysAvailablePerWeek, weightUnit, createdAt, updatedAt | `src/modules/profile/infrastructure/persistence/typeorm/entities/profile-typeorm.entity.ts` |
| `users` | `UserTypeormEntity` | email, username, passwordHash, role, emailVerified, status, createdAt, updatedAt | `src/modules/users/infrastructure/persistence/typeorm/entities/user-typeorm.entity.ts` |
| `workout_session_exercises` | `WorkoutSessionExerciseTypeormEntity` | sessionId, exerciseId, exerciseName, orderIndex, targetSets | `src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-exercise-typeorm.entity.ts` |
| `workout_session_sets` | `WorkoutSessionSetTypeormEntity` | sessionExerciseId, setNumber, repsPerformed, weightUsed, targetReps, targetWeight, completed | `src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-set-typeorm.entity.ts` |
| `workout_sessions` | `WorkoutSessionTypeormEntity` | userId, routineId, status, currentExerciseIndex, startedAt, finishedAt | `src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-typeorm.entity.ts` |

Migraciones detectadas: 20 archivos en `src/migrations/`. Estas migraciones crean y modifican tablas como `users`, `refresh_tokens`, `user_profiles`, `routines`, `routine_days`, `exercises`, `exercise_sets`, `exercise_catalog`, `training_strategies`, `workout_sessions`, `workout_session_exercises` y `workout_session_sets`.

## 10. Pruebas existentes

| Tipo de prueba | Archivos | Lineas |
| --- | --- | --- |
| Unitarias de aplicacion | 23 | 4506 |
| Unitarias de dominio | 5 | 2200 |
| E2E/soporte E2E | 4 | 722 |
| Unitarias raiz | 1 | 23 |

Observaciones para el plan de pruebas:

- Las pruebas unitarias se concentran en el modulo `training`, principalmente en casos de uso y reglas de dominio.
- Existen pruebas e2e en `test/` para flujos generales, perfil y rutinas de entrenamiento.
- No se identificaron pruebas directas para `auth`, `users` ni `profile` dentro de `src/**/*.spec.ts`, salvo cobertura e2e relacionada con perfil.
- No se ejecutaron pruebas durante la generacion de este documento porque no existe `node_modules/` en el entorno actual.

## 11. Archivos vacios o no implementados

Los siguientes archivos pertenecen al modulo `publication` y tienen 0 lineas. Deben reportarse como estructura no implementada o fuera del alcance funcional actual:

| Archivo vacio |
| --- |
| `src/modules/publication/application/dto/create-publication.dto.ts` |
| `src/modules/publication/application/dto/publication.dto.ts` |
| `src/modules/publication/application/dto/update-publication.dto.ts` |
| `src/modules/publication/application/mappers/publication.mapper.ts` |
| `src/modules/publication/application/ports/publication-query.port.ts` |
| `src/modules/publication/application/use-cases/create-publication/create-publication.use-case.ts` |
| `src/modules/publication/application/use-cases/get-publication/get-publication.use-case.ts` |
| `src/modules/publication/application/use-cases/list-publications/list-publications.use-case.ts` |
| `src/modules/publication/application/use-cases/publish-publication/publish-publication.use-case.ts` |
| `src/modules/publication/application/use-cases/update-publication/update-publication.use-case.ts` |
| `src/modules/publication/domain/entities/publication.entity.ts` |
| `src/modules/publication/domain/errors/publication-domain.error.ts` |
| `src/modules/publication/domain/events/publication-created.event.ts` |
| `src/modules/publication/domain/events/publication-published.event.ts` |
| `src/modules/publication/domain/repositories/publication.repository.ts` |
| `src/modules/publication/domain/services/publication-domain.service.ts` |
| `src/modules/publication/domain/value-objects/publication-content.value-object.ts` |
| `src/modules/publication/domain/value-objects/publication-title.value-object.ts` |
| `src/modules/publication/infrastructure/persistence/typeorm/entities/publication-typeorm.entity.ts` |
| `src/modules/publication/infrastructure/persistence/typeorm/repositories/typeorm-publication.repository.ts` |
| `src/modules/publication/infrastructure/providers/publication-repository.provider.ts` |
| `src/modules/publication/presentation/http/controllers/publication.controller.ts` |
| `src/modules/publication/presentation/http/requests/create-publication.request.ts` |
| `src/modules/publication/presentation/http/requests/update-publication.request.ts` |
| `src/modules/publication/presentation/http/responses/publication.response.ts` |
| `src/modules/publication/publication.module.ts` |

## 12. Inventario completo de archivos TypeScript

| Archivo | Modulo | Capa | Categoria | Lineas | No vacias |
| --- | --- | --- | --- | --- | --- |
| `src/app.controller.spec.ts` | root | - | Prueba | 23 | 18 |
| `src/app.controller.ts` | root | - | Codigo fuente raiz | 13 | 10 |
| `src/app.module.ts` | root | - | Codigo fuente raiz | 52 | 50 |
| `src/app.service.ts` | root | - | Codigo fuente raiz | 9 | 7 |
| `src/main.ts` | root | - | Codigo fuente raiz | 27 | 21 |
| `src/migrations/1746000000000-CreateRoutinesAndRoutineDays.ts` | migrations | - | Migracion TypeORM | 53 | 48 |
| `src/migrations/1746000000001-CreateExercises.ts` | migrations | - | Migracion TypeORM | 50 | 45 |
| `src/migrations/1746000000002-AddExerciseConfiguration.ts` | migrations | - | Migracion TypeORM | 39 | 34 |
| `src/migrations/1746000000003-CreateWorkoutSessions.ts` | migrations | - | Migracion TypeORM | 152 | 145 |
| `src/migrations/1746000000004-AddCurrentExerciseIndex.ts` | migrations | - | Migracion TypeORM | 20 | 17 |
| `src/migrations/1746000000005-AddRoutineIsActive.ts` | migrations | - | Migracion TypeORM | 20 | 17 |
| `src/migrations/1746000000006-CreateUsersTable.ts` | migrations | - | Migracion TypeORM | 63 | 60 |
| `src/migrations/1746000000007-CreateRefreshTokensTable.ts` | migrations | - | Migracion TypeORM | 47 | 44 |
| `src/migrations/1746000000008-CreateUserProfilesTable.ts` | migrations | - | Migracion TypeORM | 97 | 93 |
| `src/migrations/1746000000009-CreateExerciseCatalogTable.ts` | migrations | - | Migracion TypeORM | 24 | 21 |
| `src/migrations/1746000000010-SeedExerciseCatalog.ts` | migrations | - | Migracion TypeORM | 261 | 257 |
| `src/migrations/1746000000011-CreateExerciseSetsTable.ts` | migrations | - | Migracion TypeORM | 72 | 68 |
| `src/migrations/1746000000012-MigrateExerciseConfigToSets.ts` | migrations | - | Migracion TypeORM | 85 | 75 |
| `src/migrations/1746000000013-CreateTrainingStrategiesTable.ts` | migrations | - | Migracion TypeORM | 36 | 33 |
| `src/migrations/1746000000014-SeedTrainingStrategies.ts` | migrations | - | Migracion TypeORM | 22 | 19 |
| `src/migrations/1746000000015-AddTrainingStrategyToRoutine.ts` | migrations | - | Migracion TypeORM | 20 | 17 |
| `src/migrations/1746000000016-AddTargetFieldsToWorkoutSessionSets.ts` | migrations | - | Migracion TypeORM | 30 | 26 |
| `src/migrations/1746000000017-AddMediaFieldsToExerciseCatalog.ts` | migrations | - | Migracion TypeORM | 23 | 20 |
| `src/migrations/1746000000018-UpdateExerciseCatalogMediaUrls.ts` | migrations | - | Migracion TypeORM | 151 | 147 |
| `src/migrations/1746000000019-SeedFullExerciseCatalogNullUrls.ts` | migrations | - | Migracion TypeORM | 124 | 120 |
| `src/modules/auth/application/use-cases/check-token/check-token.use-case.ts` | auth | application | Codigo fuente por modulo | 34 | 30 |
| `src/modules/auth/application/use-cases/login-user/login-user.use-case.ts` | auth | application | Codigo fuente por modulo | 109 | 97 |
| `src/modules/auth/application/use-cases/logout-user/logout-user.use-case.ts` | auth | application | Codigo fuente por modulo | 20 | 17 |
| `src/modules/auth/application/use-cases/refresh-token/refresh-token.use-case.ts` | auth | application | Codigo fuente por modulo | 79 | 68 |
| `src/modules/auth/application/use-cases/register-user/register-user.use-case.ts` | auth | application | Codigo fuente por modulo | 109 | 97 |
| `src/modules/auth/auth.module.ts` | auth | module-root | Codigo fuente por modulo | 71 | 69 |
| `src/modules/auth/domain/entities/refresh-token.entity.ts` | auth | domain | Codigo fuente por modulo | 59 | 51 |
| `src/modules/auth/domain/repositories/refresh-token.repository.ts` | auth | domain | Codigo fuente por modulo | 13 | 10 |
| `src/modules/auth/infrastructure/persistence/typeorm/entities/refresh-token-typeorm.entity.ts` | auth | infrastructure | Codigo fuente por modulo | 32 | 24 |
| `src/modules/auth/infrastructure/persistence/typeorm/repositories/typeorm-refresh-token.repository.ts` | auth | infrastructure | Codigo fuente por modulo | 56 | 48 |
| `src/modules/auth/infrastructure/providers/cookie-helper.provider.ts` | auth | infrastructure | Codigo fuente por modulo | 41 | 36 |
| `src/modules/auth/infrastructure/providers/password-hasher.provider.ts` | auth | infrastructure | Codigo fuente por modulo | 21 | 16 |
| `src/modules/auth/presentation/http/controllers/auth.controller.ts` | auth | presentation | Codigo fuente por modulo | 164 | 155 |
| `src/modules/auth/presentation/http/decorators/current-user.decorator.ts` | auth | presentation | Codigo fuente por modulo | 11 | 9 |
| `src/modules/auth/presentation/http/decorators/public.decorator.ts` | auth | presentation | Codigo fuente por modulo | 5 | 3 |
| `src/modules/auth/presentation/http/dtos/auth.response.ts` | auth | presentation | Codigo fuente por modulo | 9 | 8 |
| `src/modules/auth/presentation/http/dtos/login.dto.ts` | auth | presentation | Codigo fuente por modulo | 11 | 8 |
| `src/modules/auth/presentation/http/dtos/register.dto.ts` | auth | presentation | Codigo fuente por modulo | 19 | 15 |
| `src/modules/auth/presentation/http/filters/user-domain-error.filter.ts` | auth | presentation | Codigo fuente por modulo | 19 | 16 |
| `src/modules/auth/presentation/http/guards/jwt-auth.guard.ts` | auth | presentation | Codigo fuente por modulo | 40 | 36 |
| `src/modules/auth/presentation/http/strategies/jwt.strategy.ts` | auth | presentation | Codigo fuente por modulo | 30 | 26 |
| `src/modules/profile/application/use-cases/check-onboarding-status/check-onboarding-status.use-case.ts` | profile | application | Codigo fuente por modulo | 28 | 22 |
| `src/modules/profile/application/use-cases/create-or-update-profile/create-or-update-profile.use-case.ts` | profile | application | Codigo fuente por modulo | 106 | 98 |
| `src/modules/profile/application/use-cases/get-profile/get-profile.use-case.ts` | profile | application | Codigo fuente por modulo | 60 | 54 |
| `src/modules/profile/domain/entities/profile.entity.ts` | profile | domain | Codigo fuente por modulo | 129 | 121 |
| `src/modules/profile/domain/errors/profile-domain.error.ts` | profile | domain | Codigo fuente por modulo | 15 | 13 |
| `src/modules/profile/domain/repositories/profile.repository.ts` | profile | domain | Codigo fuente por modulo | 10 | 7 |
| `src/modules/profile/infrastructure/persistence/typeorm/entities/profile-typeorm.entity.ts` | profile | infrastructure | Codigo fuente por modulo | 50 | 36 |
| `src/modules/profile/infrastructure/persistence/typeorm/repositories/typeorm-profile.repository.ts` | profile | infrastructure | Codigo fuente por modulo | 75 | 68 |
| `src/modules/profile/infrastructure/providers/profile-repository.provider.ts` | profile | infrastructure | Codigo fuente por modulo | 9 | 7 |
| `src/modules/profile/presentation/http/controllers/profile.controller.ts` | profile | presentation | Codigo fuente por modulo | 110 | 101 |
| `src/modules/profile/presentation/http/dtos/create-profile.request.ts` | profile | presentation | Codigo fuente por modulo | 58 | 48 |
| `src/modules/profile/presentation/http/dtos/profile.response.ts` | profile | presentation | Codigo fuente por modulo | 17 | 16 |
| `src/modules/profile/presentation/http/filters/profile-domain-error.filter.ts` | profile | presentation | Codigo fuente por modulo | 26 | 24 |
| `src/modules/profile/profile.module.ts` | profile | module-root | Codigo fuente por modulo | 26 | 24 |
| `src/modules/publication/application/dto/create-publication.dto.ts` | publication | application | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/application/dto/publication.dto.ts` | publication | application | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/application/dto/update-publication.dto.ts` | publication | application | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/application/mappers/publication.mapper.ts` | publication | application | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/application/ports/publication-query.port.ts` | publication | application | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/application/use-cases/create-publication/create-publication.use-case.ts` | publication | application | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/application/use-cases/get-publication/get-publication.use-case.ts` | publication | application | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/application/use-cases/list-publications/list-publications.use-case.ts` | publication | application | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/application/use-cases/publish-publication/publish-publication.use-case.ts` | publication | application | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/application/use-cases/update-publication/update-publication.use-case.ts` | publication | application | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/domain/entities/publication.entity.ts` | publication | domain | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/domain/errors/publication-domain.error.ts` | publication | domain | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/domain/events/publication-created.event.ts` | publication | domain | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/domain/events/publication-published.event.ts` | publication | domain | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/domain/repositories/publication.repository.ts` | publication | domain | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/domain/services/publication-domain.service.ts` | publication | domain | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/domain/value-objects/publication-content.value-object.ts` | publication | domain | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/domain/value-objects/publication-title.value-object.ts` | publication | domain | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/infrastructure/persistence/typeorm/entities/publication-typeorm.entity.ts` | publication | infrastructure | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/infrastructure/persistence/typeorm/repositories/typeorm-publication.repository.ts` | publication | infrastructure | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/infrastructure/providers/publication-repository.provider.ts` | publication | infrastructure | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/presentation/http/controllers/publication.controller.ts` | publication | presentation | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/presentation/http/requests/create-publication.request.ts` | publication | presentation | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/presentation/http/requests/update-publication.request.ts` | publication | presentation | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/presentation/http/responses/publication.response.ts` | publication | presentation | Codigo fuente por modulo | 0 | 0 |
| `src/modules/publication/publication.module.ts` | publication | module-root | Codigo fuente por modulo | 0 | 0 |
| `src/modules/training/application/ports/current-actor.port.ts` | training | application | Codigo fuente por modulo | 10 | 9 |
| `src/modules/training/application/training-application.module.ts` | training | application | Codigo fuente por modulo | 227 | 221 |
| `src/modules/training/application/use-cases/activate-routine/activate-routine.use-case.spec.ts` | training | application | Prueba | 184 | 159 |
| `src/modules/training/application/use-cases/activate-routine/activate-routine.use-case.ts` | training | application | Codigo fuente por modulo | 114 | 100 |
| `src/modules/training/application/use-cases/add-exercise-to-routine-day/add-exercise-to-routine-day.use-case.spec.ts` | training | application | Prueba | 219 | 195 |
| `src/modules/training/application/use-cases/add-exercise-to-routine-day/add-exercise-to-routine-day.use-case.ts` | training | application | Codigo fuente por modulo | 115 | 103 |
| `src/modules/training/application/use-cases/advance-to-next-exercise/advance-to-next-exercise.use-case.spec.ts` | training | application | Prueba | 142 | 121 |
| `src/modules/training/application/use-cases/advance-to-next-exercise/advance-to-next-exercise.use-case.ts` | training | application | Codigo fuente por modulo | 113 | 102 |
| `src/modules/training/application/use-cases/configure-exercise/configure-exercise.use-case.spec.ts` | training | application | Prueba | 321 | 288 |
| `src/modules/training/application/use-cases/configure-exercise/configure-exercise.use-case.ts` | training | application | Codigo fuente por modulo | 107 | 96 |
| `src/modules/training/application/use-cases/create-routine/create-routine.use-case.spec.ts` | training | application | Prueba | 304 | 264 |
| `src/modules/training/application/use-cases/create-routine/create-routine.use-case.ts` | training | application | Codigo fuente por modulo | 138 | 122 |
| `src/modules/training/application/use-cases/deactivate-routine/deactivate-routine.use-case.spec.ts` | training | application | Prueba | 146 | 125 |
| `src/modules/training/application/use-cases/deactivate-routine/deactivate-routine.use-case.ts` | training | application | Codigo fuente por modulo | 103 | 91 |
| `src/modules/training/application/use-cases/delete-routine/delete-routine.use-case.spec.ts` | training | application | Prueba | 113 | 95 |
| `src/modules/training/application/use-cases/delete-routine/delete-routine.use-case.ts` | training | application | Codigo fuente por modulo | 55 | 46 |
| `src/modules/training/application/use-cases/finish-workout-session/finish-workout-session.use-case.spec.ts` | training | application | Prueba | 149 | 128 |
| `src/modules/training/application/use-cases/finish-workout-session/finish-workout-session.use-case.ts` | training | application | Codigo fuente por modulo | 116 | 105 |
| `src/modules/training/application/use-cases/generate-exercise-sets/generate-exercise-sets.use-case.spec.ts` | training | application | Prueba | 136 | 119 |
| `src/modules/training/application/use-cases/generate-exercise-sets/generate-exercise-sets.use-case.ts` | training | application | Codigo fuente por modulo | 98 | 85 |
| `src/modules/training/application/use-cases/get-exercise-progress/get-exercise-progress.use-case.spec.ts` | training | application | Prueba | 572 | 510 |
| `src/modules/training/application/use-cases/get-exercise-progress/get-exercise-progress.use-case.ts` | training | application | Codigo fuente por modulo | 129 | 113 |
| `src/modules/training/application/use-cases/get-routine-detail/get-routine-detail.use-case.spec.ts` | training | application | Prueba | 111 | 97 |
| `src/modules/training/application/use-cases/get-routine-detail/get-routine-detail.use-case.ts` | training | application | Codigo fuente por modulo | 77 | 71 |
| `src/modules/training/application/use-cases/get-workout-session-detail/get-workout-session-detail.use-case.spec.ts` | training | application | Prueba | 233 | 199 |
| `src/modules/training/application/use-cases/get-workout-session-detail/get-workout-session-detail.use-case.ts` | training | application | Codigo fuente por modulo | 124 | 114 |
| `src/modules/training/application/use-cases/get-workout-session-history/get-workout-session-history.use-case.spec.ts` | training | application | Prueba | 268 | 228 |
| `src/modules/training/application/use-cases/get-workout-session-history/get-workout-session-history.use-case.ts` | training | application | Codigo fuente por modulo | 71 | 62 |
| `src/modules/training/application/use-cases/get-workout-session/get-workout-session.use-case.ts` | training | application | Codigo fuente por modulo | 94 | 87 |
| `src/modules/training/application/use-cases/list-exercise-catalog/list-exercise-catalog.use-case.spec.ts` | training | application | Prueba | 167 | 143 |
| `src/modules/training/application/use-cases/list-exercise-catalog/list-exercise-catalog.use-case.ts` | training | application | Codigo fuente por modulo | 83 | 73 |
| `src/modules/training/application/use-cases/list-routines/list-routines.use-case.spec.ts` | training | application | Prueba | 108 | 94 |
| `src/modules/training/application/use-cases/list-routines/list-routines.use-case.ts` | training | application | Codigo fuente por modulo | 59 | 54 |
| `src/modules/training/application/use-cases/list-training-strategies/list-training-strategies.use-case.spec.ts` | training | application | Prueba | 45 | 36 |
| `src/modules/training/application/use-cases/list-training-strategies/list-training-strategies.use-case.ts` | training | application | Codigo fuente por modulo | 34 | 28 |
| `src/modules/training/application/use-cases/mark-set-as-completed/mark-set-as-completed.use-case.spec.ts` | training | application | Prueba | 151 | 131 |
| `src/modules/training/application/use-cases/mark-set-as-completed/mark-set-as-completed.use-case.ts` | training | application | Codigo fuente por modulo | 116 | 105 |
| `src/modules/training/application/use-cases/register-set-reps-and-weight/register-set-reps-and-weight.use-case.spec.ts` | training | application | Prueba | 185 | 164 |
| `src/modules/training/application/use-cases/register-set-reps-and-weight/register-set-reps-and-weight.use-case.ts` | training | application | Codigo fuente por modulo | 122 | 111 |
| `src/modules/training/application/use-cases/remove-exercise-from-routine/remove-exercise-from-routine.use-case.spec.ts` | training | application | Prueba | 177 | 158 |
| `src/modules/training/application/use-cases/remove-exercise-from-routine/remove-exercise-from-routine.use-case.ts` | training | application | Codigo fuente por modulo | 93 | 84 |
| `src/modules/training/application/use-cases/resume-workout-session/resume-workout-session.use-case.spec.ts` | training | application | Prueba | 99 | 84 |
| `src/modules/training/application/use-cases/resume-workout-session/resume-workout-session.use-case.ts` | training | application | Codigo fuente por modulo | 90 | 84 |
| `src/modules/training/application/use-cases/set-routine-training-strategy/set-routine-training-strategy.use-case.spec.ts` | training | application | Prueba | 144 | 128 |
| `src/modules/training/application/use-cases/set-routine-training-strategy/set-routine-training-strategy.use-case.ts` | training | application | Codigo fuente por modulo | 123 | 112 |
| `src/modules/training/application/use-cases/start-workout-session/start-workout-session.use-case.spec.ts` | training | application | Prueba | 203 | 181 |
| `src/modules/training/application/use-cases/start-workout-session/start-workout-session.use-case.ts` | training | application | Codigo fuente por modulo | 153 | 141 |
| `src/modules/training/application/use-cases/sync-routine/sync-routine.use-case.spec.ts` | training | application | Prueba | 329 | 300 |
| `src/modules/training/application/use-cases/sync-routine/sync-routine.use-case.ts` | training | application | Codigo fuente por modulo | 185 | 166 |
| `src/modules/training/domain/entities/exercise-catalog-entry.entity.ts` | training | domain | Codigo fuente por modulo | 147 | 135 |
| `src/modules/training/domain/entities/exercise.entity.ts` | training | domain | Codigo fuente por modulo | 77 | 69 |
| `src/modules/training/domain/entities/routine.entity.ts` | training | domain | Codigo fuente por modulo | 255 | 236 |
| `src/modules/training/domain/entities/training-strategy.entity.ts` | training | domain | Codigo fuente por modulo | 156 | 143 |
| `src/modules/training/domain/entities/workout-session.entity.ts` | training | domain | Codigo fuente por modulo | 308 | 282 |
| `src/modules/training/domain/errors/exercise-catalog-domain.error.ts` | training | domain | Codigo fuente por modulo | 27 | 24 |
| `src/modules/training/domain/errors/routine-domain.error.ts` | training | domain | Codigo fuente por modulo | 40 | 37 |
| `src/modules/training/domain/errors/training-strategy-domain.error.ts` | training | domain | Codigo fuente por modulo | 30 | 27 |
| `src/modules/training/domain/errors/workout-session-domain.error.ts` | training | domain | Codigo fuente por modulo | 35 | 32 |
| `src/modules/training/domain/exercise-catalog.domain.spec.ts` | training | domain | Prueba | 187 | 177 |
| `src/modules/training/domain/repositories/exercise-catalog.repository.ts` | training | domain | Codigo fuente por modulo | 22 | 18 |
| `src/modules/training/domain/repositories/routine.repository.ts` | training | domain | Codigo fuente por modulo | 13 | 11 |
| `src/modules/training/domain/repositories/training-strategy.repository.ts` | training | domain | Codigo fuente por modulo | 7 | 5 |
| `src/modules/training/domain/repositories/workout-session.repository.port.ts` | training | domain | Codigo fuente por modulo | 17 | 15 |
| `src/modules/training/domain/routine.domain.spec.ts` | training | domain | Prueba | 775 | 712 |
| `src/modules/training/domain/training-strategy.domain.spec.ts` | training | domain | Prueba | 164 | 150 |
| `src/modules/training/domain/value-objects/routine-day.value-object.ts` | training | domain | Codigo fuente por modulo | 151 | 136 |
| `src/modules/training/domain/value-objects/routine-exercise-set.domain.spec.ts` | training | domain | Prueba | 213 | 187 |
| `src/modules/training/domain/value-objects/routine-exercise-set.value-object.ts` | training | domain | Codigo fuente por modulo | 111 | 101 |
| `src/modules/training/domain/value-objects/strategy-rules.value-object.ts` | training | domain | Codigo fuente por modulo | 79 | 71 |
| `src/modules/training/domain/value-objects/workout-exercise.value-object.ts` | training | domain | Codigo fuente por modulo | 209 | 193 |
| `src/modules/training/domain/value-objects/workout-session-status.value-object.ts` | training | domain | Codigo fuente por modulo | 10 | 9 |
| `src/modules/training/domain/value-objects/workout-set.value-object.ts` | training | domain | Codigo fuente por modulo | 161 | 149 |
| `src/modules/training/domain/workout-session.domain.spec.ts` | training | domain | Prueba | 861 | 731 |
| `src/modules/training/infrastructure/mappers/routine.mapper.ts` | training | infrastructure | Codigo fuente por modulo | 95 | 85 |
| `src/modules/training/infrastructure/mappers/workout-session.mapper.ts` | training | infrastructure | Codigo fuente por modulo | 94 | 84 |
| `src/modules/training/infrastructure/persistence/typeorm/entities/exercise-catalog-typeorm.entity.ts` | training | infrastructure | Codigo fuente por modulo | 26 | 18 |
| `src/modules/training/infrastructure/persistence/typeorm/entities/exercise-set-typeorm.entity.ts` | training | infrastructure | Codigo fuente por modulo | 30 | 22 |
| `src/modules/training/infrastructure/persistence/typeorm/entities/exercise-typeorm.entity.ts` | training | infrastructure | Codigo fuente por modulo | 38 | 31 |
| `src/modules/training/infrastructure/persistence/typeorm/entities/routine-day-typeorm.entity.ts` | training | infrastructure | Codigo fuente por modulo | 35 | 29 |
| `src/modules/training/infrastructure/persistence/typeorm/entities/routine-typeorm.entity.ts` | training | infrastructure | Codigo fuente por modulo | 40 | 31 |
| `src/modules/training/infrastructure/persistence/typeorm/entities/training-strategy-typeorm.entity.ts` | training | infrastructure | Codigo fuente por modulo | 17 | 12 |
| `src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-exercise-typeorm.entity.ts` | training | infrastructure | Codigo fuente por modulo | 53 | 43 |
| `src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-set-typeorm.entity.ts` | training | infrastructure | Codigo fuente por modulo | 38 | 28 |
| `src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-typeorm.entity.ts` | training | infrastructure | Codigo fuente por modulo | 44 | 34 |
| `src/modules/training/infrastructure/persistence/typeorm/repositories/typeorm-exercise-catalog.repository.ts` | training | infrastructure | Codigo fuente por modulo | 69 | 61 |
| `src/modules/training/infrastructure/persistence/typeorm/repositories/typeorm-routine.repository.ts` | training | infrastructure | Codigo fuente por modulo | 85 | 75 |
| `src/modules/training/infrastructure/persistence/typeorm/repositories/typeorm-training-strategy.repository.ts` | training | infrastructure | Codigo fuente por modulo | 52 | 48 |
| `src/modules/training/infrastructure/persistence/typeorm/repositories/typeorm-workout-session.repository.ts` | training | infrastructure | Codigo fuente por modulo | 91 | 81 |
| `src/modules/training/infrastructure/providers/current-actor.provider.ts` | training | infrastructure | Codigo fuente por modulo | 13 | 11 |
| `src/modules/training/infrastructure/providers/request-actor.provider.ts` | training | infrastructure | Codigo fuente por modulo | 12 | 10 |
| `src/modules/training/infrastructure/providers/training-infrastructure.module.ts` | training | infrastructure | Codigo fuente por modulo | 67 | 65 |
| `src/modules/training/presentation/http/controllers/exercise-catalog.controller.ts` | training | presentation | Codigo fuente por modulo | 54 | 50 |
| `src/modules/training/presentation/http/controllers/routine.controller.ts` | training | presentation | Codigo fuente por modulo | 325 | 296 |
| `src/modules/training/presentation/http/controllers/training-strategy.controller.ts` | training | presentation | Codigo fuente por modulo | 31 | 27 |
| `src/modules/training/presentation/http/controllers/workout-session.controller.ts` | training | presentation | Codigo fuente por modulo | 337 | 323 |
| `src/modules/training/presentation/http/decorators/training-actor.decorator.ts` | training | presentation | Codigo fuente por modulo | 10 | 8 |
| `src/modules/training/presentation/http/dtos/add-exercise.request.ts` | training | presentation | Codigo fuente por modulo | 12 | 9 |
| `src/modules/training/presentation/http/dtos/configure-exercise.request.ts` | training | presentation | Codigo fuente por modulo | 34 | 28 |
| `src/modules/training/presentation/http/dtos/create-routine.request.ts` | training | presentation | Codigo fuente por modulo | 22 | 18 |
| `src/modules/training/presentation/http/dtos/delete-routine.response.ts` | training | presentation | Codigo fuente por modulo | 5 | 4 |
| `src/modules/training/presentation/http/dtos/exercise-catalog.response.ts` | training | presentation | Codigo fuente por modulo | 10 | 9 |
| `src/modules/training/presentation/http/dtos/exercise-progress-response.ts` | training | presentation | Codigo fuente por modulo | 17 | 15 |
| `src/modules/training/presentation/http/dtos/generate-exercise-sets.request.ts` | training | presentation | Codigo fuente por modulo | 29 | 24 |
| `src/modules/training/presentation/http/dtos/list-routines.response.ts` | training | presentation | Codigo fuente por modulo | 12 | 9 |
| `src/modules/training/presentation/http/dtos/register-set-reps-and-weight.request.ts` | training | presentation | Codigo fuente por modulo | 16 | 13 |
| `src/modules/training/presentation/http/dtos/routine.response.ts` | training | presentation | Codigo fuente por modulo | 32 | 28 |
| `src/modules/training/presentation/http/dtos/set-training-strategy.request.ts` | training | presentation | Codigo fuente por modulo | 8 | 6 |
| `src/modules/training/presentation/http/dtos/start-workout-session.request.ts` | training | presentation | Codigo fuente por modulo | 7 | 5 |
| `src/modules/training/presentation/http/dtos/sync-routine.request.ts` | training | presentation | Codigo fuente por modulo | 65 | 53 |
| `src/modules/training/presentation/http/dtos/training-strategy.response.ts` | training | presentation | Codigo fuente por modulo | 7 | 6 |
| `src/modules/training/presentation/http/dtos/workout-session-summary.response.ts` | training | presentation | Codigo fuente por modulo | 11 | 10 |
| `src/modules/training/presentation/http/dtos/workout-session.response.ts` | training | presentation | Codigo fuente por modulo | 47 | 42 |
| `src/modules/training/presentation/http/filters/routine-domain-error.filter.ts` | training | presentation | Codigo fuente por modulo | 57 | 55 |
| `src/modules/training/presentation/http/filters/training-strategy-domain-error.filter.ts` | training | presentation | Codigo fuente por modulo | 37 | 35 |
| `src/modules/training/presentation/http/filters/workout-session-domain-error.filter.ts` | training | presentation | Codigo fuente por modulo | 47 | 45 |
| `src/modules/training/presentation/http/training-presentation.module.ts` | training | presentation | Codigo fuente por modulo | 18 | 16 |
| `src/modules/training/training.module.ts` | training | module-root | Codigo fuente por modulo | 9 | 7 |
| `src/modules/users/application/use-cases/create-user/create-user.use-case.ts` | users | application | Codigo fuente por modulo | 79 | 70 |
| `src/modules/users/domain/entities/user.entity.ts` | users | domain | Codigo fuente por modulo | 84 | 74 |
| `src/modules/users/domain/errors/user-domain.error.ts` | users | domain | Codigo fuente por modulo | 19 | 17 |
| `src/modules/users/domain/repositories/user.repository.ts` | users | domain | Codigo fuente por modulo | 13 | 10 |
| `src/modules/users/infrastructure/persistence/typeorm/entities/user-typeorm.entity.ts` | users | infrastructure | Codigo fuente por modulo | 38 | 28 |
| `src/modules/users/infrastructure/persistence/typeorm/repositories/typeorm-user.repository.ts` | users | infrastructure | Codigo fuente por modulo | 82 | 72 |
| `src/modules/users/presentation/http/controllers/user.controller.ts` | users | presentation | Codigo fuente por modulo | 55 | 51 |
| `src/modules/users/presentation/http/dtos/create-user.request.ts` | users | presentation | Codigo fuente por modulo | 29 | 25 |
| `src/modules/users/presentation/http/dtos/user.response.ts` | users | presentation | Codigo fuente por modulo | 13 | 11 |
| `src/modules/users/users.module.ts` | users | module-root | Codigo fuente por modulo | 30 | 28 |
| `src/shared/observability/http-logging.interceptor.ts` | shared | - | Codigo compartido/observabilidad | 98 | 87 |
| `src/shared/observability/log-sanitizer.ts` | shared | - | Codigo compartido/observabilidad | 105 | 86 |
| `src/shared/observability/observability.module.ts` | shared | - | Codigo compartido/observabilidad | 27 | 25 |
| `src/shared/observability/request-context.service.ts` | shared | - | Codigo compartido/observabilidad | 23 | 18 |
| `src/shared/observability/request-logging.middleware.ts` | shared | - | Codigo compartido/observabilidad | 62 | 54 |
| `src/shared/observability/use-case-logging.service.ts` | shared | - | Codigo compartido/observabilidad | 144 | 126 |
| `test/app.e2e-spec.ts` | test-e2e | - | Prueba | 46 | 39 |
| `test/profile.e2e-spec.ts` | test-e2e | - | Prueba | 420 | 358 |
| `test/testing-module.ts` | test-e2e | - | Prueba | 90 | 84 |
| `test/training-routine.e2e-spec.ts` | test-e2e | - | Prueba | 166 | 139 |

## 13. Catalogo de clases, interfaces, enums y types

| Archivo | Clases | Interfaces | Enums | Types |
| --- | --- | --- | --- | --- |
| `src/app.controller.ts` | AppController | - | - | - |
| `src/app.module.ts` | AppModule | - | - | - |
| `src/app.service.ts` | AppService | - | - | - |
| `src/migrations/1746000000000-CreateRoutinesAndRoutineDays.ts` | CreateRoutinesAndRoutineDays1746000000000 | - | - | - |
| `src/migrations/1746000000001-CreateExercises.ts` | CreateExercises1746000000001 | - | - | - |
| `src/migrations/1746000000002-AddExerciseConfiguration.ts` | AddExerciseConfiguration1746000000002 | - | - | - |
| `src/migrations/1746000000003-CreateWorkoutSessions.ts` | CreateWorkoutSessions1746000000003 | - | - | - |
| `src/migrations/1746000000004-AddCurrentExerciseIndex.ts` | AddCurrentExerciseIndex1746000000004 | - | - | - |
| `src/migrations/1746000000005-AddRoutineIsActive.ts` | AddRoutineIsActive1746000000005 | - | - | - |
| `src/migrations/1746000000006-CreateUsersTable.ts` | CreateUsersTable1746000000006 | - | - | - |
| `src/migrations/1746000000007-CreateRefreshTokensTable.ts` | CreateRefreshTokensTable1746000000007 | - | - | - |
| `src/migrations/1746000000008-CreateUserProfilesTable.ts` | CreateUserProfilesTable1746000000008 | - | - | - |
| `src/migrations/1746000000009-CreateExerciseCatalogTable.ts` | CreateExerciseCatalogTable1746000000009 | - | - | - |
| `src/migrations/1746000000010-SeedExerciseCatalog.ts` | SeedExerciseCatalog1746000000010 | - | - | - |
| `src/migrations/1746000000011-CreateExerciseSetsTable.ts` | CreateExerciseSetsTable1746000000011 | - | - | - |
| `src/migrations/1746000000012-MigrateExerciseConfigToSets.ts` | MigrateExerciseConfigToSets1746000000012 | - | - | - |
| `src/migrations/1746000000013-CreateTrainingStrategiesTable.ts` | CreateTrainingStrategiesTable1746000000013 | - | - | - |
| `src/migrations/1746000000014-SeedTrainingStrategies.ts` | SeedTrainingStrategies1746000000014 | - | - | - |
| `src/migrations/1746000000015-AddTrainingStrategyToRoutine.ts` | AddTrainingStrategyToRoutine1746000000015 | - | - | - |
| `src/migrations/1746000000016-AddTargetFieldsToWorkoutSessionSets.ts` | AddTargetFieldsToWorkoutSessionSets1746000000016 | - | - | - |
| `src/migrations/1746000000017-AddMediaFieldsToExerciseCatalog.ts` | AddMediaFieldsToExerciseCatalog1746000000017 | - | - | - |
| `src/migrations/1746000000018-UpdateExerciseCatalogMediaUrls.ts` | UpdateExerciseCatalogMediaUrls1746000000018 | - | - | - |
| `src/migrations/1746000000019-SeedFullExerciseCatalogNullUrls.ts` | SeedFullExerciseCatalogNullUrls1746000000019 | - | - | - |
| `src/modules/auth/application/use-cases/check-token/check-token.use-case.ts` | CheckTokenUseCase | CheckTokenOutput | - | - |
| `src/modules/auth/application/use-cases/login-user/login-user.use-case.ts` | LoginUserUseCase | LoginInput, LoginOutput | - | - |
| `src/modules/auth/application/use-cases/logout-user/logout-user.use-case.ts` | LogoutUserUseCase | - | - | - |
| `src/modules/auth/application/use-cases/refresh-token/refresh-token.use-case.ts` | RefreshTokenUseCase | RefreshTokenOutput | - | - |
| `src/modules/auth/application/use-cases/register-user/register-user.use-case.ts` | RegisterUserUseCase | RegisterInput, RegisterOutput | - | - |
| `src/modules/auth/auth.module.ts` | AuthModule | - | - | - |
| `src/modules/auth/domain/entities/refresh-token.entity.ts` | RefreshToken | RefreshTokenProps | - | - |
| `src/modules/auth/domain/repositories/refresh-token.repository.ts` | - | RefreshTokenRepository | - | - |
| `src/modules/auth/infrastructure/persistence/typeorm/entities/refresh-token-typeorm.entity.ts` | RefreshTokenTypeormEntity | - | - | ColumnType |
| `src/modules/auth/infrastructure/persistence/typeorm/repositories/typeorm-refresh-token.repository.ts` | TypeormRefreshTokenRepository | - | - | - |
| `src/modules/auth/infrastructure/providers/cookie-helper.provider.ts` | AuthCookieHelper | CookieHelper | - | - |
| `src/modules/auth/infrastructure/providers/password-hasher.provider.ts` | BcryptPasswordHasher | PasswordHasher | - | - |
| `src/modules/auth/presentation/http/controllers/auth.controller.ts` | AuthController | - | - | - |
| `src/modules/auth/presentation/http/dtos/auth.response.ts` | AuthResponseDto | - | - | - |
| `src/modules/auth/presentation/http/dtos/login.dto.ts` | LoginDto | - | - | - |
| `src/modules/auth/presentation/http/dtos/register.dto.ts` | RegisterDto | - | - | - |
| `src/modules/auth/presentation/http/filters/user-domain-error.filter.ts` | UserDomainErrorFilter | - | - | - |
| `src/modules/auth/presentation/http/guards/jwt-auth.guard.ts` | JwtAuthGuard | - | - | - |
| `src/modules/auth/presentation/http/strategies/jwt.strategy.ts` | JwtStrategy | JwtPayload | - | - |
| `src/modules/profile/application/use-cases/check-onboarding-status/check-onboarding-status.use-case.ts` | CheckOnboardingStatusUseCase | CheckOnboardingStatusOutput | - | - |
| `src/modules/profile/application/use-cases/create-or-update-profile/create-or-update-profile.use-case.ts` | CreateOrUpdateProfileUseCase | CreateOrUpdateProfileInput, CreateOrUpdateProfileOutput | - | - |
| `src/modules/profile/application/use-cases/get-profile/get-profile.use-case.ts` | GetProfileUseCase | GetProfileOutput | - | - |
| `src/modules/profile/domain/entities/profile.entity.ts` | Profile | ProfileProps | - | Gender, ExperienceLevel, MainGoal, WeightUnit |
| `src/modules/profile/domain/errors/profile-domain.error.ts` | ProfileDomainError | - | - | - |
| `src/modules/profile/domain/repositories/profile.repository.ts` | - | ProfileRepository | - | - |
| `src/modules/profile/infrastructure/persistence/typeorm/entities/profile-typeorm.entity.ts` | ProfileTypeormEntity | - | - | - |
| `src/modules/profile/infrastructure/persistence/typeorm/repositories/typeorm-profile.repository.ts` | TypeormProfileRepository | - | - | - |
| `src/modules/profile/presentation/http/controllers/profile.controller.ts` | ProfileController | - | - | - |
| `src/modules/profile/presentation/http/dtos/create-profile.request.ts` | CreateProfileRequestDto | - | - | - |
| `src/modules/profile/presentation/http/dtos/profile.response.ts` | ProfileResponseDto | - | - | - |
| `src/modules/profile/presentation/http/filters/profile-domain-error.filter.ts` | ProfileDomainErrorFilter | - | - | - |
| `src/modules/profile/profile.module.ts` | ProfileModule | - | - | - |
| `src/modules/training/application/ports/current-actor.port.ts` | - | CurrentActor | - | - |
| `src/modules/training/application/training-application.module.ts` | TrainingApplicationModule | - | - | - |
| `src/modules/training/application/use-cases/activate-routine/activate-routine.use-case.ts` | ActivateRoutineUseCase | ActivateRoutineInput, ActivateRoutineOutput | - | - |
| `src/modules/training/application/use-cases/add-exercise-to-routine-day/add-exercise-to-routine-day.use-case.ts` | AddExerciseToRoutineDayUseCase | AddExerciseToRoutineDayInput, AddExerciseToRoutineDayOutput | - | - |
| `src/modules/training/application/use-cases/advance-to-next-exercise/advance-to-next-exercise.use-case.ts` | AdvanceToNextExerciseUseCase | AdvanceToNextExerciseInput, AdvanceToNextExerciseOutput | - | - |
| `src/modules/training/application/use-cases/configure-exercise/configure-exercise.use-case.ts` | ConfigureExerciseUseCase | ConfigureExerciseSetInput, ConfigureExerciseInput, ConfigureExerciseOutput | - | - |
| `src/modules/training/application/use-cases/create-routine/create-routine.use-case.ts` | CreateRoutineUseCase | CreateRoutineInput, CreateRoutineOutput | - | - |
| `src/modules/training/application/use-cases/deactivate-routine/deactivate-routine.use-case.ts` | DeactivateRoutineUseCase | DeactivateRoutineInput, DeactivateRoutineOutput | - | - |
| `src/modules/training/application/use-cases/delete-routine/delete-routine.use-case.ts` | DeleteRoutineUseCase | DeleteRoutineInput, DeleteRoutineOutput | - | - |
| `src/modules/training/application/use-cases/finish-workout-session/finish-workout-session.use-case.ts` | FinishWorkoutSessionUseCase | FinishWorkoutSessionInput, FinishWorkoutSessionOutput | - | - |
| `src/modules/training/application/use-cases/generate-exercise-sets/generate-exercise-sets.use-case.ts` | GenerateExerciseSetsUseCase | GenerateExerciseSetsInput, GenerateExerciseSetsOutput | - | - |
| `src/modules/training/application/use-cases/get-exercise-progress/get-exercise-progress.use-case.ts` | GetExerciseProgressUseCase | ExerciseProgressRecord, ExerciseProgressOutput | - | - |
| `src/modules/training/application/use-cases/get-routine-detail/get-routine-detail.use-case.ts` | GetRoutineDetailUseCase | GetRoutineDetailOutput | - | - |
| `src/modules/training/application/use-cases/get-workout-session-detail/get-workout-session-detail.use-case.ts` | GetWorkoutSessionDetailUseCase | GetWorkoutSessionDetailInput, WorkoutSessionDetailOutput | - | - |
| `src/modules/training/application/use-cases/get-workout-session-history/get-workout-session-history.use-case.ts` | GetWorkoutSessionHistoryUseCase | WorkoutSessionSummaryOutput | - | - |
| `src/modules/training/application/use-cases/get-workout-session/get-workout-session.use-case.ts` | GetWorkoutSessionUseCase | GetWorkoutSessionInput, GetWorkoutSessionOutput | - | - |
| `src/modules/training/application/use-cases/list-exercise-catalog/list-exercise-catalog.use-case.ts` | ListExerciseCatalogUseCase | ListExerciseCatalogInput, ListExerciseCatalogOutput | - | - |
| `src/modules/training/application/use-cases/list-routines/list-routines.use-case.ts` | ListRoutinesUseCase | ListRoutinesOutput | - | - |
| `src/modules/training/application/use-cases/list-training-strategies/list-training-strategies.use-case.ts` | ListTrainingStrategiesUseCase | ListTrainingStrategiesOutput | - | - |
| `src/modules/training/application/use-cases/mark-set-as-completed/mark-set-as-completed.use-case.ts` | MarkSetAsCompletedUseCase | MarkSetAsCompletedInput, MarkSetAsCompletedOutput | - | - |
| `src/modules/training/application/use-cases/register-set-reps-and-weight/register-set-reps-and-weight.use-case.ts` | RegisterSetRepsAndWeightUseCase | RegisterSetRepsAndWeightInput, RegisterSetRepsAndWeightOutput | - | - |
| `src/modules/training/application/use-cases/remove-exercise-from-routine/remove-exercise-from-routine.use-case.ts` | RemoveExerciseFromRoutineUseCase | RemoveExerciseFromRoutineInput, RemoveExerciseFromRoutineOutput | - | - |
| `src/modules/training/application/use-cases/resume-workout-session/resume-workout-session.use-case.ts` | ResumeWorkoutSessionUseCase | ResumeWorkoutSessionOutput | - | - |
| `src/modules/training/application/use-cases/set-routine-training-strategy/set-routine-training-strategy.use-case.ts` | SetRoutineTrainingStrategyUseCase | SetRoutineTrainingStrategyInput, SetRoutineTrainingStrategyOutput | - | - |
| `src/modules/training/application/use-cases/start-workout-session/start-workout-session.use-case.ts` | StartWorkoutSessionUseCase | StartWorkoutSessionInput, StartWorkoutSessionOutput | - | - |
| `src/modules/training/application/use-cases/sync-routine/sync-routine.use-case.ts` | SyncRoutineUseCase | SyncRoutineExerciseSetInput, SyncRoutineExerciseInput, SyncRoutineDayInput, SyncRoutineInput, SyncRoutineOutput | - | - |
| `src/modules/training/domain/entities/exercise-catalog-entry.entity.ts` | ExerciseCatalogEntry | - | - | ExerciseCategory, ExerciseEquipment |
| `src/modules/training/domain/entities/exercise.entity.ts` | Exercise | - | - | - |
| `src/modules/training/domain/entities/routine.entity.ts` | Routine | - | - | - |
| `src/modules/training/domain/entities/training-strategy.entity.ts` | TrainingStrategy | - | - | - |
| `src/modules/training/domain/entities/workout-session.entity.ts` | WorkoutSession | - | - | - |
| `src/modules/training/domain/errors/exercise-catalog-domain.error.ts` | ExerciseCatalogDomainError | - | ExerciseCatalogErrorCode | - |
| `src/modules/training/domain/errors/routine-domain.error.ts` | RoutineDomainError | - | RoutineErrorCode | - |
| `src/modules/training/domain/errors/training-strategy-domain.error.ts` | TrainingStrategyDomainError | - | TrainingStrategyErrorCode | - |
| `src/modules/training/domain/errors/workout-session-domain.error.ts` | WorkoutSessionDomainError | - | WorkoutSessionErrorCode | - |
| `src/modules/training/domain/repositories/exercise-catalog.repository.ts` | - | ExerciseCatalogQuery, PaginatedExerciseCatalogResult, ExerciseCatalogRepository | - | - |
| `src/modules/training/domain/repositories/routine.repository.ts` | - | RoutineRepository | - | - |
| `src/modules/training/domain/repositories/training-strategy.repository.ts` | - | TrainingStrategyRepository | - | - |
| `src/modules/training/domain/repositories/workout-session.repository.port.ts` | - | WorkoutSessionRepository | - | - |
| `src/modules/training/domain/value-objects/routine-day.value-object.ts` | RoutineDay | - | - | DayOfWeek |
| `src/modules/training/domain/value-objects/routine-exercise-set.value-object.ts` | RoutineExerciseSet | - | - | - |
| `src/modules/training/domain/value-objects/strategy-rules.value-object.ts` | StrategyRules | StrategyRulesJson | - | - |
| `src/modules/training/domain/value-objects/workout-exercise.value-object.ts` | WorkoutExercise | WorkoutExerciseTargetSet | - | - |
| `src/modules/training/domain/value-objects/workout-session-status.value-object.ts` | - | - | WorkoutSessionStatus | - |
| `src/modules/training/domain/value-objects/workout-set.value-object.ts` | WorkoutSet | - | - | - |
| `src/modules/training/infrastructure/mappers/routine.mapper.ts` | RoutineMapper | - | - | - |
| `src/modules/training/infrastructure/mappers/workout-session.mapper.ts` | WorkoutSessionMapper | - | - | - |
| `src/modules/training/infrastructure/persistence/typeorm/entities/exercise-catalog-typeorm.entity.ts` | ExerciseCatalogTypeormEntity | - | - | - |
| `src/modules/training/infrastructure/persistence/typeorm/entities/exercise-set-typeorm.entity.ts` | ExerciseSetTypeormEntity | - | - | - |
| `src/modules/training/infrastructure/persistence/typeorm/entities/exercise-typeorm.entity.ts` | ExerciseTypeormEntity | - | - | - |
| `src/modules/training/infrastructure/persistence/typeorm/entities/routine-day-typeorm.entity.ts` | RoutineDayTypeormEntity | - | - | - |
| `src/modules/training/infrastructure/persistence/typeorm/entities/routine-typeorm.entity.ts` | RoutineTypeormEntity | - | - | - |
| `src/modules/training/infrastructure/persistence/typeorm/entities/training-strategy-typeorm.entity.ts` | TrainingStrategyTypeormEntity | - | - | - |
| `src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-exercise-typeorm.entity.ts` | WorkoutSessionExerciseTypeormEntity | WorkoutSessionTargetSetJson | - | - |
| `src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-set-typeorm.entity.ts` | WorkoutSessionSetTypeormEntity | - | - | - |
| `src/modules/training/infrastructure/persistence/typeorm/entities/workout-session-typeorm.entity.ts` | WorkoutSessionTypeormEntity | - | - | ColumnType |
| `src/modules/training/infrastructure/persistence/typeorm/repositories/typeorm-exercise-catalog.repository.ts` | TypeormExerciseCatalogRepository | - | - | - |
| `src/modules/training/infrastructure/persistence/typeorm/repositories/typeorm-routine.repository.ts` | TypeormRoutineRepository | - | - | - |
| `src/modules/training/infrastructure/persistence/typeorm/repositories/typeorm-training-strategy.repository.ts` | TypeormTrainingStrategyRepository | - | - | - |
| `src/modules/training/infrastructure/persistence/typeorm/repositories/typeorm-workout-session.repository.ts` | TypeormWorkoutSessionRepository | - | - | - |
| `src/modules/training/infrastructure/providers/current-actor.provider.ts` | DevActorService | - | - | - |
| `src/modules/training/infrastructure/providers/request-actor.provider.ts` | RequestActorService | - | - | - |
| `src/modules/training/infrastructure/providers/training-infrastructure.module.ts` | TrainingInfrastructureModule | - | - | - |
| `src/modules/training/presentation/http/controllers/exercise-catalog.controller.ts` | ExerciseCatalogController | - | - | - |
| `src/modules/training/presentation/http/controllers/routine.controller.ts` | RoutineController | - | - | - |
| `src/modules/training/presentation/http/controllers/training-strategy.controller.ts` | TrainingStrategyController | - | - | - |
| `src/modules/training/presentation/http/controllers/workout-session.controller.ts` | WorkoutSessionController | - | - | - |
| `src/modules/training/presentation/http/dtos/add-exercise.request.ts` | AddExerciseRequestDto | - | - | - |
| `src/modules/training/presentation/http/dtos/configure-exercise.request.ts` | ExerciseSetDto, ConfigureExerciseRequestDto | - | - | - |
| `src/modules/training/presentation/http/dtos/create-routine.request.ts` | CreateRoutineRequestDto | - | - | - |
| `src/modules/training/presentation/http/dtos/delete-routine.response.ts` | DeleteRoutineResponseDto | - | - | - |
| `src/modules/training/presentation/http/dtos/exercise-catalog.response.ts` | ExerciseCatalogEntryResponseDto | - | - | - |
| `src/modules/training/presentation/http/dtos/exercise-progress-response.ts` | ExerciseProgressRecordDto, ExerciseProgressResponseDto | - | - | - |
| `src/modules/training/presentation/http/dtos/generate-exercise-sets.request.ts` | GenerateExerciseSetsRequestDto | - | - | - |
| `src/modules/training/presentation/http/dtos/list-routines.response.ts` | ListRoutinesResponseDto | - | - | - |
| `src/modules/training/presentation/http/dtos/register-set-reps-and-weight.request.ts` | RegisterSetRepsAndWeightRequestDto | - | - | - |
| `src/modules/training/presentation/http/dtos/routine.response.ts` | ExerciseSetResponseDto, ExerciseResponseDto, RoutineDayResponseDto, RoutineResponseDto | - | - | - |
| `src/modules/training/presentation/http/dtos/set-training-strategy.request.ts` | SetTrainingStrategyRequestDto | - | - | - |
| `src/modules/training/presentation/http/dtos/start-workout-session.request.ts` | StartWorkoutSessionRequestDto | - | - | - |
| `src/modules/training/presentation/http/dtos/sync-routine.request.ts` | SyncRoutineExerciseSetDto, SyncRoutineExerciseDto, SyncRoutineDayDto, SyncRoutineRequestDto | - | - | - |
| `src/modules/training/presentation/http/dtos/training-strategy.response.ts` | TrainingStrategyResponseDto | - | - | - |
| `src/modules/training/presentation/http/dtos/workout-session-summary.response.ts` | WorkoutSessionSummaryResponseDto | - | - | - |
| `src/modules/training/presentation/http/dtos/workout-session.response.ts` | WorkoutSetResponseDto, WorkoutExerciseTargetSetResponseDto, WorkoutExerciseResponseDto, WorkoutSessionResponseDto, WorkoutSessionDetailResponseDto | - | - | - |
| `src/modules/training/presentation/http/filters/routine-domain-error.filter.ts` | RoutineDomainErrorFilter | - | - | - |
| `src/modules/training/presentation/http/filters/training-strategy-domain-error.filter.ts` | TrainingStrategyDomainErrorFilter | - | - | - |
| `src/modules/training/presentation/http/filters/workout-session-domain-error.filter.ts` | WorkoutSessionDomainErrorFilter | - | - | - |
| `src/modules/training/presentation/http/training-presentation.module.ts` | TrainingPresentationModule | - | - | - |
| `src/modules/training/training.module.ts` | TrainingModule | - | - | - |
| `src/modules/users/application/use-cases/create-user/create-user.use-case.ts` | CreateUserUseCase | CreateUserInput, CreateUserOutput | - | - |
| `src/modules/users/domain/entities/user.entity.ts` | User | UserProps | - | UserRole, UserStatus |
| `src/modules/users/domain/errors/user-domain.error.ts` | UserDomainError | - | - | - |
| `src/modules/users/domain/repositories/user.repository.ts` | - | UserRepository | - | - |
| `src/modules/users/infrastructure/persistence/typeorm/entities/user-typeorm.entity.ts` | UserTypeormEntity | - | - | - |
| `src/modules/users/infrastructure/persistence/typeorm/repositories/typeorm-user.repository.ts` | TypeormUserRepository | - | - | - |
| `src/modules/users/presentation/http/controllers/user.controller.ts` | UserController | - | - | - |
| `src/modules/users/presentation/http/dtos/create-user.request.ts` | CreateUserRequestDto | - | - | - |
| `src/modules/users/presentation/http/dtos/user.response.ts` | UserResponseDto | - | - | - |
| `src/modules/users/users.module.ts` | UsersModule | - | - | - |
| `src/shared/observability/http-logging.interceptor.ts` | HttpLoggingInterceptor | - | - | - |
| `src/shared/observability/observability.module.ts` | ObservabilityModule | - | - | - |
| `src/shared/observability/request-context.service.ts` | RequestContextService | RequestLogContext | - | - |
| `src/shared/observability/request-logging.middleware.ts` | RequestLoggingMiddleware | - | - | - |
| `src/shared/observability/use-case-logging.service.ts` | UseCaseLoggingService | - | - | ExecutableUseCase |

## 14. Puntos clave para el resumen formal

- El codigo fuente esta concentrado en `src/`, con una separacion clara por modulos funcionales.
- El modulo `training` representa la mayor parte del sistema y debe recibir mayor peso en el plan de pruebas.
- El backend expone una API REST protegida por JWT, con rutas publicas solo para registro, login y refresh token.
- La persistencia esta desacoplada mediante repositorios de dominio y adaptadores TypeORM.
- Las reglas de negocio principales estan encapsuladas en entidades, value objects y casos de uso.
- El proyecto cuenta con pruebas unitarias y e2e, pero la distribucion de pruebas no es uniforme entre modulos.
- El modulo `publication` no debe incluirse como funcional porque los archivos estan vacios.
