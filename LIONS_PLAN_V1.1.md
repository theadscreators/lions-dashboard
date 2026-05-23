# Plan de Trabajo V1.1 - Lions Dashboard

Este documento detalla los objetivos exactos y la estrategia técnica para la versión 1.1 del sistema.

---

## 🎯 Objetivo Principal: Foco en la Venta y la Operación Segura
El sistema debe incentivar la venta mostrando claramente los **Minutos Disponibles** por partido, y garantizar una operación a prueba de errores mediante un flujo estricto donde solo el **Admin** aprueba y "congela" los datos operativos.

---

## ⚙️ Etapa 0: Core y Saneamiento Técnico (BLOQUEANTE)

> [!CAUTION]
> Estos problemas deben resolverse ANTES de cualquier otra cosa. Sin esto, nadie puede usar el dashboard.

*   [x] **0.1 — Auth:** Restauración de Sesión Cuelga la App (timeout de 3s a `getSession()`).
*   [x] **0.2 — useMatches:** Fetch sin Guardia de Auth (parámetro `ready`).
*   [x] **0.3 — Ruteo SPA en GitHub Pages:** Build script copia `index.html` → `404.html`.
*   [x] **0.4 — Credenciales en supabase.js:** Uso de env vars (`import.meta.env` con fallback).
*   [x] **0.5 — Políticas RLS Duplicadas:** Saneamiento de políticas de base de datos.

---

## 🏗️ Etapa 1: Navegación (Mejora Funcional)
*   [x] **1.1 Limpieza de Datos:** Eliminar estadísticas falsas del Dashboard y asegurar que todas las métricas deriven de data real.
*   [x] **1.2 Botón Global de Backup:** Botón siempre visible para descargar toda la data operativa (Historial de Trabajo y Distribución de Minutos Comerciales) en un solo Spreadsheet ordenado (UTF-8 BOM CSV).

---

## 📅 Etapa 2: Agenda Sincronizada y Agrupada (El Fixture)
*   [x] **2.1 Copia Local Constante:** Sincronización mediante Edge Function llamando a `sync-matches`.
*   [x] **2.2 Edición Manual y Localización:** Reprogramación manual de partidos (Edición de hora local, estadio, notas operativas) por Productores/Admins. La UI muestra siempre el horario del estadio y la hora equivalente en **Buenos Aires (ART)**.
*   [x] **2.3 Agrupación Temporal:** La Agenda separa partidos por bloques temporales: "HOY", "MAÑANA", "ESTE FIN DE SEMANA", "ESTA SEMANA", "PRÓXIMO FIN DE SEMANA", "PRÓXIMA SEMANA", etc.
*   [x] **2.4 Gestión Dinámica de Paises y Equipos:** Creación dinámica de Países y Clubes directamente desde la interfaz.

---

## 🔒 Etapa 3: Roles, Flujo de Trabajo y Permisos Estrictos
*   [x] **3.1 El Admin es el Único Aprobador:** Flujo controlado de estados con subida de playlist y confirmaciones.
*   [x] **3.2 Congelamiento de Datos (Lock):** Bloqueo de cambios en minutos una vez emitido el reporte.
*   [x] **3.3 Incidencias Post-Partido (Historial y Notas):** Control de notas operativas y avisos permanentes.
*   [x] **3.4 Notificación Inmediata al Operador:** Flujo visual reactivo del estado de material.
*   [x] **3.5 Simplificación de Ajustes/Tickets:** Remoción del campo "Prioridad" en las solicitudes para estandarización.

---

## 🌍 Etapa 4: Transparencia y Links Públicos Automáticos
*   [x] **4.1 Auto-Generación de Reporte Público:** Enlace temporal público para cada partido (`/public/:id`).
*   [x] **4.2 Contenido del Link Público:** Reporte estético y detallado de minutos de LIONS vs CLUB sin requerir login.
*   [ ] **4.3 Caducidad:** Expiración por transcurso de fechas.

---

## ⚙️ Etapa 6: UI/UX "Pro Max" y Navegación (Mejora Estética)
*   [x] **6.1 Rediseño Visual:** Tarjetas, layouts y transiciones fluidas.
*   [x] **6.2 Enfoque en Minutos:** Indicador de "MINUTOS LIBRES" resaltado de forma destacada y llamativa como la métrica principal.
*   [x] **6.3 Indicadores de Estado Visuales:** Colores y badges reactivos al estado del partido.estados de los partidos: Pendiente (Gris/Naranja) -> En Proceso (Azul) -> Listo (Verde con acceso inmediato al link de descarga).

---

## 🔮 Etapa 7: Filtrado de Operadores por Club (FUTURO)

> [!NOTE]
> Actualmente los operadores ven todos los partidos en modo lectura. Esta etapa agrega la posibilidad de filtrar.

*   [ ] **7.1 Asignación de Clubs desde Panel Admin:** Interfaz en Ajustes o Panel para que un Admin asigne uno o varios clubes a un operador específico via `user_club_assignments`.
*   [ ] **7.2 Filtrado Automático en Agenda:** Si el operador tiene clubs asignados, la Agenda filtra automáticamente solo los partidos de esos equipos.
*   [ ] **7.3 Multi-Club:** Soporte para operadores asignados a más de un club (filtro `.in()` en lugar de `.eq()`).