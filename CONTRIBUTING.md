# Guía de Contribución

Gracias por contribuir a **CDI0436**. Este es un proyecto colaborativo: el código solo entra a `main` mediante Pull Requests revisados y verificados por CI. Seguí esta guía para que el proceso sea fluido.

## Reglas de oro

1. **Nunca commitear secretos.** No se suben archivos `.env*` con valores reales (ni `.env.production`, `.env.local`, etc.). El pipeline los bloquea y los borra del historial.
2. **Nada de código basura.** No se commitean scripts de debug/scratch (`_*.ts`, `_*.js` en la raíz de `backend/`), dumps de BD, logs ni binarios. El CI lo bloquea.
3. **Nada se mergea directo a `main`.** Siempre por PR con al menos 1 aprobación y todos los checks verdes.
4. **No se hace push a `main`.** Está protegido: los push directos están bloqueados.

## Flujo de trabajo

```bash
# 1. Partí de main actualizado
git checkout main
git pull origin main

# 2. Creá una rama con prefijo semántico
git checkout -b feature/nombre-descriptivo
#   o: fix/arreglo, refactor/cambio, docs/cambio

# 3. Hacé commits pequeños y descriptivos
git add <archivos>
git diff --cached  # Revisá qué cambios van a incluirse
git commit -m "feat: agregar registro masivo de asistencias"

# 4. Subí tu rama y abrí el PR
git push origin feature/nombre-descriptivo
gh pr create   # o desde la web de GitHub
```

## Convenciones de ramas

| Prefijo     | Uso                                   | Ejemplo               |
| ----------- | ------------------------------------- | --------------------- |
| `feature/`  | Nueva funcionalidad                   | `feature/reporte-pdf` |
| `fix/`      | Corrección de bug                     | `fix/join-columnas`   |
| `refactor/` | Mejora de código sin cambio funcional | `refactor/services`   |
| `docs/`     | Documentación                         | `docs/readme-deploy`  |

## Convenciones de commits

Usá formato semántico (Conventional Commits):

- `feat: ...` nueva funcionalidad
- `fix: ...` corrección
- `refactor: ...` reestructuración
- `chore: ...` tareas de mantenimiento
- `docs: ...` documentación
- `test: ...` tests

## Estándares de código

- **TypeScript estricto** en backend y frontend.
- **Backend**: convenciones de NestJS (modular, decorators, DTOs con class-validator).
- **Frontend**: Next.js App Router, componentes en `src/components/`, estilos con Tailwind.
- Ejecutá lint y build antes de abrir el PR:

```bash
# Backend
cd backend && npm run build && npm run lint:check

# Frontend
cd frontend && npm run build && npm run lint && npx tsc --noEmit
```

- Escribí tests para funcionalidades nuevas (`npm run test` en backend).
- Sin `console.log` de debug en código que entra a `main`.

## Definición de listo (Definition of Done)

Un PR está listo para mergear cuando:

- [ ] El CI pasa (Quality Gates + Backend + Frontend)
- [ ] Tiene al menos 1 aprobación de otro colaborador
- [ ] Tiene una descripción clara en el template de PR
- [ ] No contiene secrets ni archivos basura
- [ ] Los cambios están probados localmente
