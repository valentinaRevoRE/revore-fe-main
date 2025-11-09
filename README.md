# Revore Frontend

Sistema de gestión inmobiliaria desarrollado con Angular 20.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.0.0.

---

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Ambientes de Desarrollo](#ambientes-de-desarrollo)
- [Desarrollo Local](#desarrollo-local)
- [Build y Despliegue](#build-y-despliegue)
- [Subida de Archivos](#subida-de-archivos)
- [Testing](#testing)
- [Documentación](#documentación)
- [Configuración AWS](#configuración-aws)

---

## 🔧 Requisitos Previos

- Node.js v20.x
- npm v10.x
- Angular CLI v17+

```bash
# Verificar versiones
node --version
npm --version
ng version
```

---

## 📦 Instalación

```bash
# Clonar repositorio
git clone [repository-url]
cd revore-fe-main

# Instalar dependencias
npm install
```

---

## 🌍 Ambientes de Desarrollo

El proyecto utiliza tres ambientes configurados:

### Local (Development)
```typescript
// src/environments/environments.local.ts
{
  production: false,
  isTesting: true,
  apiUrl: 'http://localhost:3000',
  encryptKey: 'RevoreCompany#2023',
  environment: 'local'
}
```

### Staging
```typescript
// src/environments/environments.staging.ts
{
  production: true,
  isTesting: true,
  apiUrl: 'https://api-staging.revore.mx',
  encryptKey: 'RevoreCompany#2023',
  environment: 'staging'
}
```

### Production
```typescript
// src/environments/environments.prod.ts
{
  production: true,
  isTesting: false,
  apiUrl: 'https://api.revore.mx',
  encryptKey: 'RevoreCompany#2023',
  environment: 'production'
}
```

---

## 💻 Desarrollo Local

### Iniciar servidor de desarrollo

```bash
# Ambiente local (por defecto)
npm start
# o
ng serve

# Con configuración específica
ng serve --configuration=development
```

Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente al realizar cambios.

### Servir con configuración de staging

```bash
ng serve --configuration=staging
```

---

## 🏗️ Build y Despliegue

### Build Local

```bash
# Development
ng build --configuration=development

# Staging
ng build --configuration=staging

# Production
ng build --configuration=production
```

Los artefactos se almacenarán en el directorio `dist/revore/browser/`.

### Despliegue a Staging (AWS)

El despliegue a staging es **automático** mediante GitHub Actions cuando se hace push a las ramas `master` o `main`.

**Proceso:**
1. Push código a rama `master`
2. GitHub Actions ejecuta workflow
3. Build con configuración `staging`
4. Deploy a S3 bucket `revore-staging-app`
5. Invalidación de caché de CloudFront
6. Sitio disponible en `https://staging.revore.mx`

**Tiempo estimado:** 3-5 minutos

### Despliegue Manual a S3

```bash
# 1. Build para staging
npm run build -- --configuration=staging

# 2. Deploy a S3 (requiere AWS CLI configurado)
aws s3 sync dist/revore/browser/ s3://revore-staging-app --delete

# 3. Invalidar CloudFront
aws cloudfront create-invalidation \
  --distribution-id [DISTRIBUTION_ID] \
  --paths "/*"
```

### Variables de GitHub Secrets

Para que el despliegue automático funcione, configura estos secrets en GitHub:

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
CLOUDFRONT_DISTRIBUTION_ID=E...
```

---

## 📤 Subida de Archivos

El frontend utiliza el servicio `S3UploadService` para subir archivos directamente a S3 mediante URLs pre-firmadas.

### Uso del servicio

```typescript
import { S3UploadService } from '@/shared/services/s3-upload.service';

constructor(private s3Upload: S3UploadService) {}

uploadFile(file: File) {
  // Validar archivo
  const validation = this.s3Upload.isFileValid(file);
  if (!validation.valid) {
    console.error(validation.error);
    return;
  }

  // Subir archivo
  this.s3Upload.uploadFile(file).subscribe({
    next: (result) => {
      console.log('Archivo subido:', result.key);
    },
    error: (error) => {
      console.error('Error:', error.message);
    }
  });
}
```

### Con seguimiento de progreso

```typescript
uploadFileWithProgress(file: File) {
  this.s3Upload.uploadFileWithProgress(
    file,
    (progress) => {
      console.log(`Progreso: ${progress.percentage}%`);
      this.uploadProgress = progress.percentage;
    }
  ).subscribe({
    next: (result) => {
      console.log('Upload completo:', result.key);
    },
    error: (error) => {
      console.error('Error:', error.message);
    }
  });
}
```

### Tipos de archivo permitidos

- `.xlsx` - Excel
- `.xls` - Excel legacy
- `.csv` - CSV
- `.pdf` - PDF
- `.jpg` - JPEG images
- `.png` - PNG images

**Tamaño máximo:** 10 MB

---

## 🧪 Testing

### Unit Tests

```bash
# Ejecutar tests
npm test

# Tests con coverage
ng test --code-coverage
```

Los tests utilizan [Karma](https://karma-runner.github.io) como test runner.

### End-to-End Tests

```bash
ng e2e
```

Nota: Requiere instalar un paquete adicional para e2e testing.

---

## 📚 Documentación

### Generar y servir documentación

```bash
# Generar y servir documentación
npm run compodoc:build-and-serve

# Solo generar
npm run compodoc:build

# Solo servir (si ya está generada)
npm run compodoc:serve
```

Navega a `http://127.0.0.1:8080/index.html` para ver la documentación.

---

## ☁️ Configuración AWS

### Servicios Utilizados

- **S3**: Hosting estático y almacenamiento de archivos
- **CloudFront**: CDN y distribución de contenido
- **Route 53**: DNS y gestión de dominios
- **ACM**: Certificados SSL
- **VPC**: Red virtual (para backend)
- **EC2**: Instancias para backend
- **CloudWatch**: Monitoreo y logs

### URLs de los Ambientes

| Ambiente | URL | Backend API |
|----------|-----|-------------|
| Local | http://localhost:4200 | http://localhost:3000 |
| Staging | https://staging.revore.mx | https://api-staging.revore.mx |
| Production | https://app.revore.mx | https://api.revore.mx |

### Buckets S3

```
revore-staging-app        → Frontend estático (staging)
revore-staging-uploads    → Archivos de usuarios (staging)
revore-production-app     → Frontend estático (producción)
revore-production-uploads → Archivos de usuarios (producción)
```

Para más detalles sobre la configuración de AWS, consulta [AWS_SERVICES_CONFIGURATION.md](./AWS_SERVICES_CONFIGURATION.md).

---

## 🛠️ Scripts Disponibles

```json
{
  "start": "ng serve",
  "build": "ng build",
  "build:staging": "ng build --configuration=staging",
  "build:prod": "ng build --configuration=production",
  "test": "ng test",
  "watch": "ng build --watch --configuration development",
  "compodoc:build": "compodoc -p tsconfig.doc.json",
  "compodoc:build-and-serve": "compodoc -p tsconfig.doc.json -s",
  "compodoc:serve": "compodoc -s"
}
```

---

## 📝 Code Scaffolding

```bash
# Generar componente
ng generate component component-name

# Generar servicio
ng generate service service-name

# Otras opciones
ng generate directive|pipe|class|guard|interface|enum|module
```

---

## 🤝 Contribución

1. Crea una rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Commit cambios: `git commit -m 'feat: nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Abre un Pull Request

### Convención de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formateo, punto y coma faltante, etc.
refactor: refactorización de código
test: agregar tests
chore: actualizar dependencias
```

---

## 📄 Licencia

Copyright © 2025 Revore Company

---

## 👥 Equipo

**Desarrollado por:**
- Nico Robles - [LinkedIn](https://www.linkedin.com/in/annicorobles/)

---

## 📞 Soporte

Para más información o ayuda:
- Documentación técnica: [AWS_SERVICES_CONFIGURATION.md](./AWS_SERVICES_CONFIGURATION.md)
- Angular CLI: `ng help` o [Angular CLI Overview](https://angular.io/cli)
- Contacto: annicorobles@gmail.com

---

**Última actualización:** 2025-01-06
