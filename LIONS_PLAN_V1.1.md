# Plan de Trabajo V1.1 - Lions Dashboard

Este documento detalla los objetivos exactos y la estrategia técnica para la versión 1.1 del sistema, sin modificar código hasta su aprobación.

---

## 🎯 Objetivo Principal: Foco en la Venta y la Operación Segura
El sistema debe incentivar la venta mostrando claramente los **Minutos Disponibles** por partido, y garantizar una operación a prueba de errores mediante un flujo estricto donde solo el **Admin** aprueba y "congela" los datos operativos.

---

## 🏗️ Etapa 1: UI/UX "Pro Max" y Navegación (Mejora Estética y Funcional)
*   **1.1 Rediseño Visual:** Implementar un diseño más premium, usando tarjetas limpias, animaciones suaves al cargar o interactuar, y un layout amigable (referencia: UI/UX Pro Max).
*   **1.2 Enfoque en Minutos:** La métrica más grande y llamativa en cada tarjeta de partido debe ser los **"Minutos Libres"**. 
*   **1.3 Indicadores de Estado Visuales:** Usar colores y etiquetas claras para los estados de los partidos: Pendiente (Gris/Naranja) -> En Proceso (Azul) -> Listo (Verde con acceso inmediato al link de descarga).
*   **1.4 Limpieza de Datos:** Eliminar estadísticas falsas del Dashboard (ej: "+12% vs mes anterior") y asegurar que todas las métricas deriven de data real.
*   **1.5 Botón Global de Backup:** Un botón siempre visible (para Admin/Producers) para descargar toda la data operativa (Work Log y Minutos) en un solo Spreadsheet ordenado.

---

## 📅 Etapa 2: Agenda Sincronizada y Agrupada (El Fixture)
*   **2.1 Copia Local Constante:** Utilizar la base de datos (Supabase) como "fuente de la verdad". Se guardará el fixture consultando la API deportiva, lo cual evita límites de requests y permite tener el historial a largo plazo de partidos ya jugados con sus links.
*   **2.2 Edición Manual y Localización:** Los productores podrán editar el horario de un partido si hay reprogramaciones. Además, la UI mostrará siempre el horario del estadio y la hora equivalente en **Buenos Aires (ART)**.
*   **2.3 Agrupación Temporal:** La Agenda mostrará los partidos separados claramente por bloques temporales: "Este Fin de Semana", "Próximo Fin de Semana", etc., facilitando la prospección de ventas.
*   **2.4 Gestión Dinámica de Equipos:** Capacidad de agregar nuevos equipos/clubes (ej: Vallas Fijas u otros sin historial) en cualquier momento directamente desde la plataforma para poder asignarles partidos.

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

## ⚙️ Etapa 5: Core y Saneamiento Técnico (Trabajo Invisible)
*   **5.1 Arreglar Relaciones SQL:** Solucionar los errores `400` y `PGRST200` que bloquean Clientes, Agenda y Solicitudes ajustando los nombres de las tablas y las *Foreign Keys*.
*   **5.2 Arreglar Auth Session Timeout:** Aumentar la velocidad de validación y eliminar la pantalla de "Cargando" infinita.
*   **5.3 Reparar botón "Salir" (Log out).**
*   **5.4 Soporte de Ruteo SPA:** Implementar el archivo `404.html` en public/ para que al refrescar cualquier URL en GitHub Pages (ej: `/agenda`) cargue sin arrojar error 404.
