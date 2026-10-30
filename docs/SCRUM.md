# Proceso Scrum — CDI0436

El trabajo se gestiona en **Jira** (proyecto `CDI`, tablero Scrum) y el código en **GitHub** (`santicodevv/CDI0436`). Jira es la fuente de verdad de *qué* se hace; GitHub, de *cómo* se hizo.

## Roles (equipo de 2–5 personas)

| Rol | Responsabilidad |
| --- | --- |
| Product Owner | Prioriza el backlog, escribe historias y criterios de aceptación, acepta lo entregado en la Review. |
| Scrum Master | Facilita ceremonias, quita bloqueos, cuida que se respete el proceso. Puede ser también Developer. |
| Developers | Estiman, toman tickets del sprint, abren PRs y revisan los de los demás. |

## Sprints y ceremonias

Sprints de **2 semanas**, de lunes a viernes de la semana siguiente.

| Ceremonia | Cuándo | Duración | Resultado |
| --- | --- | --- | --- |
| Sprint Planning | Lunes día 1 | 1–2 h | Objetivo del sprint + tickets comprometidos |
| Daily | Todos los días | 15 min | Qué hice, qué haré, qué me bloquea |
| Refinamiento | Miércoles semana 1 | 1 h | Historias del próximo sprint listas (DoR) y estimadas |
| Sprint Review | Viernes día 10 | 1 h | Demo al PO; tickets aceptados o devueltos |
| Retrospectiva | Viernes día 10 | 45 min | 1–3 acciones de mejora, como tickets en el próximo sprint |

## Tipos de ticket

| Tipo | Uso | Rama |
| --- | --- | --- |
| Épica | Área funcional grande (ver abajo) | — |
| Historia | Valor para el usuario: "Como *rol* quiero *x* para *y*" | `feature/CDI-<n>-...` |
| Tarea | Trabajo técnico sin valor directo (infra, refactor, docs) | `refactor/`, `docs/`, `chore/` |
| Error | Bug encontrado | `fix/CDI-<n>-...` |
| Subtarea | Partición de una historia | Usa la rama de la historia |

## Épicas (por módulo)

| Épica | Módulos |
| --- | --- |
| Autenticación y usuarios | `auth`, `usuarios`, `roles` |
| Beneficiarios | `beneficiarios` |
| Asistencias | `asistencias`, `asistencia-personal` |
| Clases, horarios y clubs | `clases`, `horarios`, `clubs` |
| Tutores | `tutores` |
| Bonos y ayudas | `bonos`, `ayudas`, `supervivencias` |
| Nutrición | `nutricion` |
| Mérito | `merito` |
| Reportes | `reportes` |
| Infraestructura y DevOps | CI, Docker, despliegue, migraciones |

## Flujo del tablero

`Por hacer` → `En curso` → `En revisión` → `Listo`

- **En curso**: hay rama `CDI-<n>` creada. Máximo 2 tickets en curso por persona.
- **En revisión**: hay PR abierto con CI verde esperando aprobación.
- **Listo**: PR mergeado a `main` y cumple la Definition of Done.

## Estimación

Story points en Fibonacci (1, 2, 3, 5, 8, 13). Una historia de más de 8 se parte antes de entrar al sprint. Bugs y tareas pequeñas también se estiman, para que la velocidad sea real.

## Definition of Ready (para entrar al sprint)

- [ ] Título claro y descripción en formato historia (o pasos para reproducir, si es error)
- [ ] Criterios de aceptación verificables
- [ ] Estimada en story points
- [ ] Asignada a una épica
- [ ] Sin dependencias bloqueantes

## Definition of Done

Ver [CONTRIBUTING.md](../CONTRIBUTING.md#definición-de-listo-definition-of-done). Además, el PO aceptó el ticket en la Review.

## Integración Jira ↔ GitHub

- Instalar la app **GitHub for Jira** (Atlassian Marketplace) y conectar la organización/cuenta de GitHub. Requiere permisos de admin en Jira y GitHub.
- Con la clave `CDI-<n>` en ramas, commits y PRs, el ticket muestra el panel *Development* con ramas, commits, PRs y estado de los builds.
- **Smart commits** (opcional): `git commit -m "fix(reportes): CDI-21 #comment corrige filtro #time 1h"`.
- Automatizaciones recomendadas en Jira (*Configuración del proyecto → Automatización*):
  - Rama creada → mover ticket a **En curso**.
  - PR abierto → mover a **En revisión**.
  - PR mergeado → mover a **Listo**.
- El workflow `.github/workflows/jira.yml` falla si el PR no incluye una clave `CDI-<n>`.
