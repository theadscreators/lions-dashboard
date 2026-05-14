# Plan de Trabajo V1.1 - Lions Dashboard

Este documento detalla los objetivos exactos y la estrategia técnica para la versión 1.1 del sistema, sin modificar código hasta su aprobación.

---

## 🎯 Objetivo Principal: Foco en la Venta y la Operación Segura
El sistema debe incentivar la venta mostrando claramente los **Minutos Disponibles** por partido, y garantizar una operación a prueba de errores mediante un flujo estricto donde solo el **Admin** aprueba y "congela" los datos operativos.

---

## ⚙️ Etapa 0: Core y Saneamiento Técnico (BLOQUEANTE)

> [!CAUTION]
> Estos problemas deben resolverse ANTES de cualquier otra cosa. Sin esto, nadie puede usar el dashboard.

### 0.1 — Auth: Restauración de Sesión Cuelga la App
- **Síntoma:** Al recargar la página (F5), se queda en "Iniciando sesión..." para siempre.
- **Causa raíz:** `supabase.auth.getSession()` intenta refrescar un token expirado haciendo una llamada de red. Si esa llamada es lenta o falla silenciosamente, la Promise nunca se resuelve.
- **Fix:** Agregar un timeout de 3 segundos a `getSession()`. Si expira, asumir sesión nula y mostrar Login. El `onAuthStateChange` se encargará de restaurar si el token se refresca en background.

### 0.2 — useMatches: Fetch sin Guardia de Auth
- **Síntoma:** Al navegar a Agenda, la página queda en blanco (crash silencioso).
- **Causa raíz:** `useMatches` hace fetch inmediatamente al montarse (`useEffect([], [clubId])`). Si el usuario tiene sesión pero `clubId` es `null`, envía queries que pueden fallar o devolver errores de RLS. Además, el query a `match_status` (vista con SECURITY DEFINER) puede ser problemático.
- **Fix:** Agregar un parámetro `ready` a `useMatches` (igual que en `useClubs`) para que solo haga fetch cuando la sesión esté confirmada.

### 0.3 — Ruteo SPA en GitHub Pages (404 al recargar)
- **Síntoma:** Recargar cualquier ruta que no sea `/` da error 404 de GitHub Pages.
- **Causa raíz:** No existe `404.html` en la carpeta de build. GitHub Pages necesita este archivo para redirigir todas las rutas al `index.html`.
- **Fix:** El script de build ya copia `index.html` → `404.html` (`package.json` build script). Verificar que funcione. Adicionalmente, agregar `<script>` de redirect en `public/404.html` como fallback.

### 0.4 — Credenciales Hardcodeadas en `supabase.js`
- **Síntoma:** La URL y anon key de Supabase están en el código fuente visible.
- **Riesgo:** La anon key es pública por diseño de Supabase (protegida por RLS). Sin embargo, para producción es mejor usar env vars.
- **Fix:** Verificar que las env vars de GitHub Actions (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) se inyecten en el build. Actualizar `supabase.js` para usar `import.meta.env` con fallback al valor hardcodeado para desarrollo local.

### 0.5 — Políticas RLS Duplicadas en Supabase
- **Síntoma:** El Advisor de Supabase muestra "Multiple Permissive Policies" en casi todas las tablas.
- **Causa raíz:** La migración `003_rls.sql` creó políticas con subqueries. La `004_fix_rls.sql` y `V1.1_Patch.sql` recrearon las mismas políticas con `get_my_role()` pero NO eliminaron las originales de `003` que usan subqueries (ej: `"Public read countries"`, `"Public read clubs"`, `"Public read matches"`, etc.).
- **Fix:** Ejecutar un SQL en Supabase que elimine TODAS las políticas antiguas que usan subqueries, dejando solo las que usan `get_my_role()`.

---

## 🏗️ Etapa 1: Navegación (Mejora Funcional)
*   **1.1 Limpieza de Datos:** Eliminar estadísticas falsas del Dashboard (ej: "+12% vs mes anterior") y asegurar que todas las métricas deriven de data real.
*   **1.2 Botón Global de Backup:** Un botón siempre visible (para Admin/Producers) para descargar toda la data operativa (Work Log y Minutos) en un solo Spreadsheet ordenado.

---

## 📅 Etapa 2: Agenda Sincronizada y Agrupada (El Fixture)
*   **2.1 Copia Local Constante:** Utilizar la base de datos (Supabase) como "fuente de la verdad". Se guardará el fixture consultando la API deportiva, lo cual evita límites de requests y permite tener el historial a largo plazo de partidos ya jugados con sus links.
*   **2.2 Edición Manual y Localización:** Los productores podrán editar el horario de un partido si hay reprogramaciones. Además, la UI mostrará siempre el horario del estadio y la hora equivalente en **Buenos Aires (ART)**.
*   **2.3 Agrupación Temporal:** La Agenda mostrará los partidos separados claramente por bloques temporales: "Este Fin de Semana", "Próximo Fin de Semana", etc., facilitando la prospección de ventas.
*   **2.4 Gestión Dinámica de Paises y Equipos:** Capacidad de agregar nuevos **Países/Ligas** (ej: Paraguay) y nuevos **Clubes** (ej: Vallas Fijas u otros sin historial) en cualquier momento directamente desde la plataforma para poder asignarles partidos.

---

## 🔒 Etapa 3: Roles, Flujo de Trabajo y Permisos Estrictos
*   **3.1 El Admin es el Único Aprobador:** El Admin tiene control total. Es el único que puede subir el link final del material, dar la operación por "Lista" y asignar personal (productores/operadores) a los clubes.
*   **3.2 Congelamiento de Datos (Lock):** En el momento que el Admin marca un partido como "Listo", se fija y "congela" la cantidad de minutos de cada marca. Ya no hay margen a modificación.
*   **3.3 Incidencias Post-Partido (Historial y Notas):** Si hubo un problema operativo (corte de luz, error técnico), un admin dejará una nota oficial en el historial del partido (ej: "Bonificar 2 min a X marca en la próxima fecha"). Esta nota generará una advertencia visual permanente hasta resolverse.
*   **3.4 Notificación Inmediata al Operador:** Cuando el Admin sube el material y da el OK, el Operador recibe una notificación instantánea en pantalla de que los archivos están listos para descargarse.
*   **3.5 Simplificación de Ajustes/Tickets:** Eliminar el campo "Prioridad" en las solicitudes para estandarizar todos los pedidos.

---

## 🌍 Etapa 4: Transparencia y Links Públicos Automáticos
*   **4.1 Auto-Generación de Reporte Público:** Al subir la playlist y dar el OK, el sistema creará un enlace temporal público para ese partido (ej: `/public/PALvsHUA`).
*   **4.2 Contenido del Link Público:** Mostrará de forma estética (sin necesidad de loguearse) la tabla de minutos y marcas de ese partido en particular, detallando minutos del club vs. minutos de LIONS.
*   **4.3 Caducidad:** Este enlace será la "prueba oficial de pauta" y caducará automáticamente cuando se hayan jugado **3 fechas posteriores** de ese equipo local, permitiendo mantener historial para revisar en los siguientes partidos.

---

## ⚙️ Etapa 6: UI/UX "Pro Max" y Navegación (Mejora Estética)
*   **6.1 Rediseño Visual:** Implementar un diseño más premium, usando tarjetas limpias, animaciones suaves al cargar o interactuar, y un layout amigable (referencia: UI/UX Pro Max).
*   **6.2 Enfoque en Minutos:** La métrica más grande y llamativa en cada tarjeta de partido debe ser los **"Minutos Libres"**.
*   **6.3 Indicadores de Estado Visuales:** Usar colores y etiquetas claras para los estados de los partidos: Pendiente (Gris/Naranja) -> En Proceso (Azul) -> Listo (Verde con acceso inmediato al link de descarga).