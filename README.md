# Mindsee Frontend — Interfaz de Acompañamiento Emocional Inteligente

La interfaz web de **Mindsee** es una aplicación moderna, interactiva y de fidelidad estética premium construida sobre **React 18** y **Vite**. Incorpora captura y procesamiento de expresiones faciales en tiempo real mediante la cámara del usuario (`face-api.js`), visualización avanzada de reportes analíticos de bienestar, simulador de videollamadas con IA y un chat conversacional cognitivo de última generación.

---

## 🎨 Características Estéticas & Funcionales

*   **Aparato Estético Premium:** Diseño basado en componentes traslúcidos (**glassmorphism**), gradientes dinámicos adaptados al estado emocional del usuario, tipografía moderna, animaciones suaves y transiciones reactivas de alto impacto visual.
*   **Detección de Expresiones Faciales:** Detección de emociones en tiempo real a través de la cámara utilizando redes neuronales convolucionales ligeras servidas de forma estática.
*   **Simulador de Llamada por Voz/Video:** Pantalla inmersiva de llamada para interactuar virtualmente con la IA, mostrando logs del análisis emocional en tiempo real.
*   **Dashboard Clínico Avanzado:** Un completo centro de analíticas con gráficos interactivos que plasman la evolución del usuario de los últimos 10 días, distribución de emociones, alertas clínicas activas y nubes de palabras emocionales frecuentes.
*   **Notas y Memorias Persistentes:** Sección clínica para la persistencia de observaciones conductuales guardadas por la IA sobre el usuario, con soporte para crear notas manuales por el terapeuta/usuario.

---

## 📁 Estructura Detallada del Proyecto (Frontend)

A continuación se muestra el árbol de directorios de la aplicación React y la descripción técnica de lo que hace cada parte en el código fuente:

```text
src/
│
├── App.tsx                     # Gestor de rutas de la aplicación. Configura las rutas protegidas (Dashboard, Chat, Call) y públicas (Login, Registro).
├── main.tsx                    # Punto de entrada de React, monta la aplicación en el DOM y la envuelve en el proveedor de sesión global.
├── index.css                   # Hoja de estilos principal del sistema. Define los tokens estéticos (colores de emociones, gradientes, glassmorphism y fuentes de Google Fonts).
│
├── constants/                  # Constantes y textos centralizados
│   └── texts.ts                # Diccionario de textos (UI) de la aplicación para facilitar mantenimiento e internacionalización.
│
├── context/                    # Contextos y Manejo de Estado Global
│   ├── AuthContext.tsx         # [Context Provider] Gestiona la sesión del usuario. Almacena el token JWT, metadatos, y provee las funciones `login`, `register` y `logout`.
│   └── ToastContext.tsx        # [Context Provider] Sistema global de notificaciones (toasts) y modales de confirmación interactivos.
│
├── types/                      # Definiciones de Tipos TypeScript
│   └── domain.ts               # Tipos e interfaces globales del dominio (User, Message, EmotionType, etc.) estandarizados en inglés.
│
├── hooks/                      # Hooks Personalizados
│   └── useEmotionDetector.ts   # [Hook de face-api.js] Encargado de cargar en memoria los pesos de la red neuronal facial, inicializar la webcam, capturar frames periódicos del canvas y retornar la emoción activa del usuario.
│
├── services/                   # Clientes de API y Red
│   └── api.ts                  # Cliente Axios centralizado. Cuenta con interceptores automáticos que inyectan el header `Authorization: Bearer <token>` a cada petición saliente y gestiona errores globales.
│
├── components/                 # Componentes de Interfaz Reutilizables
│   │
│   ├── Camera/                 # Panel e Indicadores de Video
│   │   ├── CameraPanel.tsx     # Inicializa el flujo de video HTML5 de la cámara y dibuja la caja de detección de rostros en tiempo real sobre el feed.
│   │   └── EmotionBadge.tsx    # Insignia flotante estilizada que mapea la emoción actual a un color y gradiente premium correspondiente.
│   │
│   ├── Chat/                   # Módulos de la Ventana Conversacional
│   │   ├── ChatWindow.tsx      # Contenedor del chat. Administra la carga de diálogos, la simulación de escritura interactiva de la IA y permite cambiar la personalidad del terapeuta (TCC o Humanista).
│   │   ├── ChatBubble.tsx      # Renderiza los mensajes del chat diferenciando usuario y psicólogo IA, con soporte completo para markdown y espaciado fluido.
│   │   └── ChatInput.tsx       # Caja de texto enriquecida. Administra el estado de escritura y gatilla las notificaciones al presionar Enter o hacer click en enviar.
│   │
│   ├── Memory/                 # Registro Clínico del Paciente
│   │   ├── MemoryCard.tsx      # Tarjeta interactiva que despliega detalles de las observaciones conductuales guardadas por la IA (título, descripción, fecha y tags).
│   │   └── AddMemoryModal.tsx  # Ventana modal que expone un formulario para registrar manualmente observaciones terapéuticas sobre el usuario.
│   │
│   └── ObfuscatedEmail.tsx     # Utilidad visual para ocultar partes sensibles de correos electrónicos en interfaces públicas.
│
└── pages/                      # Vistas Completas de la Aplicación
    ├── LoginPage.tsx           # Formulario seguro de inicio de sesión que valida campos locales, consume la API y redirige al Dashboard al completarse con éxito.
    ├── RegisterPage.tsx        # Interfaz de registro para la creación de cuenta, configuración inicial de la personalidad preferida del terapeuta IA y selección del primer avatar.
    ├── ChatPage.tsx            # Layout de chat. Contiene el sidebar de conversaciones históricas cargadas de la API, permite cerrar y reanudar chats, e integra la ventana de conversación.
    ├── CallPage.tsx            # Interfaz inmersiva de videollamada virtual. Integra el hook de la cámara, simula el ringtone, temporiza la llamada y analiza las expresiones faciales durante la sesión.
    ├── DashboardPage.tsx       # Consola analítica completa. Despliega gráficos interactivos de la fluctuación de los últimos 10 días de ánimo, alertas clínicas de seguridad y la distribución del bienestar del paciente.
    ├── MemoriesPage.tsx        # Panel que expone el historial de observaciones clínicas de la IA del paciente y permite disparar la creación de nuevas notas.
    └── ProfilePage.tsx         # Panel de configuraciones que permite actualizar los avatares disponibles, contraseñas y las preferencias de la Inteligencia Artificial del usuario.
```

---

## 🛠️ Stack Tecnológico

*   **Framework:** React 18 + TypeScript (JSX)
*   **Entorno de Compilación:** Vite
*   **Ruteo:** React Router DOM v6
*   **Detección de Expresiones:** `face-api.js` (red neuronal convolucional ligera en el cliente).
*   **Gráficos:** Recharts / Chart.js

---

## 🚀 Cómo Iniciar el Frontend

### 1. Descargar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Env (Crear archivo `.env` en la raíz de `psico-frontend/`)
```env
VITE_API_URL=http://localhost:8080
```

### 3. Servir Modelos de face-api.js
Asegúrate de que la carpeta `/public/models/` contenga los pesos oficiales de face-api.js:
*   `tiny_face_detector_model-weights_manifest.json`
*   `tiny_face_detector_model-shard1`
*   `face_expression_recognition_model-weights_manifest.json`
*   `face_expression_recognition_model-shard1`

### 4. Ejecutar Servidor Local de Vite
```bash
npm run dev
```
La aplicación web se levantará de inmediato en el navegador en la dirección: `http://localhost:5173`
