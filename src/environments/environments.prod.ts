export const environment = {
    production: true,
    name: 'production',

    apiUrl: 'https://revo-report-hub.fly.dev',
    encryptKey: 'RevoreCompany#2023',

    enableDebugMode: false,
    apiTimeout: 30000,

    // RevoRE Self-Service — Supabase (anon key es pública por diseño)
    supabase: {
        url: 'https://ywetvbuwyqucijbozeiy.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZXR2YnV3eXF1Y2lqYm96ZWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NzE1MTgsImV4cCI6MjA5MzE0NzUxOH0.uwBzkBVktqxfYMjHIbu9WlM-XuIbbhEQKMQ4zn3ZSmg',
    },
    revore: {
        allowedDomain: 'revore.mx',
        // TODO BACKEND: reemplazar con URL de Fly.io cuando esté desplegado
        backendUrl: 'https://revo-report-hub.fly.dev',
    },
};