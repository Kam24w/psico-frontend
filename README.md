# 🧠 Psicólogo Virtual - Frontend

Interfaz web del acompañante emocional inteligente con detección facial en tiempo real.

## 🛠 Stack
- React 18 + Vite
- React Router DOM
- Axios
- face-api.js (detección emocional por cámara)

## 🚀 Levantar localmente

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con la URL del backend
```

### 3. Descargar modelos de face-api.js
Los modelos deben estar en `/public/models/`. Descárgalos de:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Archivos necesarios:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_expression_recognition_model-weights_manifest.json`
- `face_expression_recognition_model-shard1`

### 4. Ejecutar
```bash
npm run dev
```

La app corre en: `http://localhost:5173`

## ▲ Deploy en Vercel

1. Crear proyecto en [vercel.com](https://vercel.com)
2. Conectar repositorio GitHub
3. Agregar variable de entorno: `VITE_API_URL=https://tu-backend.railway.app`
4. Vercel despliega automáticamente en cada push

## 📁 Estructura

```
src/
├── components/
│   ├── Camera/
│   │   ├── CameraPanel.jsx     # Video + detección facial
│   │   └── EmotionBadge.jsx    # Badge de emoción actual
│   └── Chat/
│       ├── ChatWindow.jsx      # Ventana principal del chat
│       ├── ChatBubble.jsx      # Burbuja de mensaje
│       └── ChatInput.jsx       # Input de texto
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── ChatPage.jsx            # Layout principal (cámara + chat)
├── context/
│   └── AuthContext.jsx         # Estado global de autenticación
├── hooks/
│   └── useEmotionDetector.js   # Hook de face-api.js
├── services/
│   └── api.js                  # Axios + endpoints
└── App.jsx                     # Routing
```
