export const environment = {
    production: true,
    name: 'production',

    apiUrl: 'https://revo-report-hub.fly.dev',
    encryptKey: 'RevoreCompany#2023',

    enableDebugMode: false,
    apiTimeout: 30000,

    // WhatsApp en alertas deshabilitado en producción
    enableWhatsappAlerts: false,

    // RevoRE Self-Service — Supabase (anon key es pública por diseño)
    supabase: {
        url: 'https://xujscamqorwckpqamnie.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1anNjYW1xb3J3Y2twcWFtbmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzE0ODgsImV4cCI6MjA5MTg0NzQ4OH0.CyaO57G8PrreOShaqRdySdtkcaKJ9rJ21zoVQC6dD9g',
    },
    // Proyecto separado para Metas/Proyectos/Desarrolladores
    supabaseMetas: {
        url: 'https://xujscamqorwckpqamnie.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1anNjYW1xb3J3Y2twcWFtbmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzE0ODgsImV4cCI6MjA5MTg0NzQ4OH0.CyaO57G8PrreOShaqRdySdtkcaKJ9rJ21zoVQC6dD9g',
    },
    revore: {
        allowedDomain: 'revore.mx',
        // TODO BACKEND: reemplazar con URL de Fly.io cuando esté desplegado
        backendUrl: 'https://revo-report-hub.fly.dev',
    },
};