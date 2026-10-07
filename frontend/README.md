# Frontend

Interfaz web de CDI0436, desarrollada con Next.js y React.

## Requisitos

- Node.js y npm
- API de CDI0436 disponible (por defecto en `http://localhost:3001`)

## Desarrollo local

Desde esta carpeta, instala las dependencias y crea el archivo de variables de entorno:

```powershell
npm install
Copy-Item .env.example .env.local
```

Si la API corre en otra dirección, actualiza `NEXT_PUBLIC_API_URL` en `.env.local`. Esta variable se expone en el navegador, así que no debe contener secretos.

Inicia el servidor de desarrollo:

```powershell
npm run dev
```

Abre `http://localhost:3000`.

## Validaciones

```powershell
npm run lint
npx tsc --noEmit
```
