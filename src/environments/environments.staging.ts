export const environment = {
    production: false,
    name: 'staging',

    isTesting: true,
    apiUrl: 'http://revore-elb-718876917.us-east-1.elb.amazonaws.com',
    encryptKey: 'RevoreCompany#2023',
    environment: 'staging',

    enableDebugMode: false,
    apiTimeout: 30000,

    // WhatsApp en alertas deshabilitado en staging
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
        backendUrl: 'https://api-revore-reports-staging.fly.dev',
    },
};

