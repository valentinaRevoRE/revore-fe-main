export const environment = {
    production: false,
    name: 'local',

    apiUrl: 'http://localhost:3000',
    encryptKey: 'RevoreCompany#2023',

    enableDebugMode: true,
    apiTimeout: 30000,

    // Habilita el canal WhatsApp en las alertas (solo local por ahora)
    enableWhatsappAlerts: true,

    // RevoRE Self-Service — Supabase (anon key es pública por diseño, seguro para commit)
    supabase: {
        url: 'https://xujscamqorwckpqamnie.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1anNjYW1xb3J3Y2twcWFtbmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzE0ODgsImV4cCI6MjA5MTg0NzQ4OH0.CyaO57G8PrreOShaqRdySdtkcaKJ9rJ21zoVQC6dD9g',
    },
    // Proyecto separado para Metas/Proyectos/Desarrolladores (Sales Tools — configuración de metas mensuales)
    supabaseMetas: {
        url: 'https://xujscamqorwckpqamnie.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1anNjYW1xb3J3Y2twcWFtbmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzE0ODgsImV4cCI6MjA5MTg0NzQ4OH0.CyaO57G8PrreOShaqRdySdtkcaKJ9rJ21zoVQC6dD9g',
    },
    revore: {
        allowedDomain: 'revore.mx',
        // TODO BACKEND: reemplazar con URL de Fly.io cuando esté desplegado
        backendUrl: 'http://localhost:8000',
    },
};
