export const UI_TEXTS = {
  app: {
    loading: 'Cargando...',
  },
  auth: {
    appName: 'Psicólogo Virtual',
    login: {
      subtitle: 'Tu espacio seguro para hablar',
      emailPlaceholder: 'Correo electrónico',
      passwordPlaceholder: 'Contraseña',
      submitIdle: 'Iniciar sesión',
      submitLoading: 'Entrando...',
      registerQuestion: '¿No tienes cuenta?',
      registerAction: 'Regístrate',
      fallbackError: 'Error al iniciar sesión',
    },
    register: {
      title: 'Crear cuenta',
      subtitle: 'Únete a tu espacio de bienestar',
      namePlaceholder: 'Nombre completo',
      emailPlaceholder: 'Correo electrónico',
      passwordPlaceholder: 'Contraseña',
      submitIdle: 'Registrarse',
      submitLoading: 'Creando cuenta...',
      loginQuestion: '¿Ya tienes cuenta?',
      loginAction: 'Inicia sesión',
      fallbackError: 'Error al registrarse',
    },
  },
  chatPage: {
    navbarTitle: 'Psicólogo Virtual',
    userPrefix: 'Usuario',
    logout: 'Salir',
    tipTitle: '¿Cómo funciona?',
    tipDescription: 'La cámara detecta tu emoción y yo adapto mis respuestas para acompañarte mejor.',
  },
  chatWindow: {
    title: 'Psicólogo Virtual',
    online: 'En línea',
    welcomeMessage: (userName?: string) =>
      `¡Hola, ${userName || 'usuario'}! Soy tu acompañante emocional. Estoy aquí para escucharte. ¿Cómo te sientes hoy?`,
    genericErrorResponse: 'Lo siento, hubo un problema al procesar tu mensaje. ¿Puedes intentarlo de nuevo?',
  },
  chatInput: {
    placeholder: 'Escribe cómo te sientes hoy...',
    submitIcon: '➤',
    loadingIcon: '⏳',
  },
  camera: {
    loadingDetection: 'Cargando detección...',
    cameraAccessErrorPrefix: 'Aviso:',
    hint: 'Tu cámara analiza tu estado emocional en tiempo real para personalizar las respuestas.',
    hookCameraError: 'No se pudo acceder a la cámara. La emoción se enviará como NEUTRAL.',
  },
  emotionBadge: {
    detectedEmotionLabel: 'Emoción detectada',
    labels: {
      FELIZ: 'Feliz',
      TRISTE: 'Triste',
      ESTRESADO: 'Estresado',
      ENOJADO: 'Enojado',
      ANSIOSO: 'Ansioso',
      SORPRENDIDO: 'Sorprendido',
      NEUTRAL: 'Neutral',
    },
  },
} as const
