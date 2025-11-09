# Configuración de Servicios AWS - Revore Frontend

## 📋 Resumen de Servicios

Este documento describe la configuración de todos los servicios AWS utilizados para el despliegue y operación del frontend de Revore en staging.

---

## 🪣 S3 (Simple Storage Service)

### Buckets Configurados

#### 1. revore-staging-app
**Propósito:** Hosting del frontend Angular compilado

**Configuración:**
- Región: `us-east-1`
- Static Website Hosting: Habilitado
  - Index document: `index.html`
  - Error document: `index.html`
- Versioning: Habilitado
- Encryption: SSE-S3
- Public Access: Bloqueado (acceso solo vía CloudFront)

**Tags:**
```
Project: revore
Environment: staging
Purpose: frontend-hosting
ManagedBy: github-actions
Team: internal
```


#### 2. revore-staging-uploads
**Propósito:** Almacenamiento de archivos subidos por usuarios

**Configuración:**
- Región: `us-east-1`
- Static Website Hosting: Deshabilitado
- Versioning: Habilitado
- Encryption: SSE-S3
- Public Access: Completamente bloqueado

**Estructura de carpetas:**
```
staging/
├── users/
│   └── {userId}/
│       ├── spreadsheets/
│       │   └── {yyyy}/{mm}/{uuid}.xlsx
│       ├── documents/
│       │   └── {yyyy}/{mm}/{uuid}.pdf
│       └── images/
│           └── {yyyy}/{mm}/{uuid}.jpg
├── projects/
│   └── {projectId}/
│       └── attachments/{uuid}.{ext}
└── exports/
    └── {yyyy}/{mm}/{dd}/{uuid}.{ext}
```

**Acceso:**
- Solo mediante URLs pre-firmadas generadas por el backend
- Tiempo de expiración: 5 minutos (uploads), 1 hora (downloads)

---

## ☁️ CloudFront (CDN)

### Distribution Configuration

**Distribution ID:** `[TU_DISTRIBUTION_ID_AQUÍ]`

**Origin Configuration:**
- Origin Domain: `revore-staging-app.s3.us-east-1.amazonaws.com`
- Origin Access: Origin Access Control (OAC)
- Protocol: HTTPS only

**Default Cache Behavior:**
- Viewer Protocol Policy: Redirect HTTP to HTTPS
- Allowed HTTP Methods: GET, HEAD, OPTIONS
- Cached HTTP Methods: GET, HEAD
- Compress Objects Automatically: Yes

**Custom Domain:**
- Alternate Domain Names (CNAMEs): `staging.revore.mx`
- SSL Certificate: `*.revore.mx` (AWS Certificate Manager)

**Custom Error Responses:**
```
403 → /index.html (TTL: 0) - Para Angular routing
404 → /index.html (TTL: 0) - Para Angular routing
```

**Cache Policy:**
- Static Assets (JS, CSS, images): 1 año
- HTML files: Sin cache
- JSON files: 5 minutos

**URLs:**
- CloudFront: `https://d123456789.cloudfront.net`
- Custom Domain: `https://staging.revore.mx`

---

## 🌐 Route 53 (DNS)

### Hosted Zone

**Domain:** `revore.mx`

### Records Configurados

#### staging.revore.mx (Frontend)
```
Type: A (Alias)
Alias Target: [CloudFront Distribution]
Routing Policy: Simple
```

#### api-staging.revore.mx (Backend)
```
Type: A (o CNAME)
Value: [EC2 Public IP o Load Balancer]
Routing Policy: Simple
TTL: 300
```

---

## 🔐 ACM (AWS Certificate Manager)

### Certificado SSL

**Domain:** `*.revore.mx`

**Status:** Issued

**Validation Method:** DNS validation

**Domains Covered:**
- `staging.revore.mx`
- `api-staging.revore.mx`
- `*.revore.mx` (wildcard)

**Región:** `us-east-1` (CloudFront requiere certificados en us-east-1)

**Renewal:** Automático (gestionado por AWS)

---

## 🏢 VPC (Virtual Private Cloud)

### VPC Configuration

**VPC Name:** `revore-staging-vpc`

**CIDR Block:** `10.0.0.0/16`

**Región:** `us-east-1`

**Availability Zones:** 2
- `us-east-1a`
- `us-east-1b`

### Subnets

#### Public Subnets
```
revore-staging-vpc-subnet-public1 (us-east-1a): 10.0.1.0/24
revore-staging-vpc-subnet-public2 (us-east-1b): 10.0.2.0/24
```

#### Private Subnets (si aplica)
```
revore-staging-vpc-subnet-private1 (us-east-1a): 10.0.10.0/24
revore-staging-vpc-subnet-private2 (us-east-1b): 10.0.11.0/24
```

### Internet Gateway
```
Name: revore-staging-igw
Attached to: revore-staging-vpc
```

### Route Tables
```
Public Route Table: revore-staging-public-rt
  - 0.0.0.0/0 → Internet Gateway

Private Route Table: revore-staging-private-rt (si aplica)
  - Sin acceso directo a Internet
```

---

## 💻 EC2 (Elastic Compute Cloud)

### Backend Instance(s)

**Purpose:** Hosting del backend NestJS API

**Configuration (ejemplo):**
- Instance Type: `t3.micro` o superior
- AMI: Amazon Linux 2 o Ubuntu 22.04
- VPC: `revore-staging-vpc`
- Subnet: Public Subnet (temporalmente, mover a privada con ALB)
- Security Group: `revore-staging-backend-sg`

### Security Groups

#### revore-staging-backend-sg
**Inbound Rules:**
```
Type: Custom TCP
Port: 3000
Source: [ALB Security Group o 0.0.0.0/0 temporalmente]
Description: Allow NestJS API from ALB

Type: SSH
Port: 22
Source: [Tu IP o Bastion Host]
Description: SSH access for maintenance
```

**Outbound Rules:**
```
All traffic to 0.0.0.0/0 (default)
```

#### revore-staging-alb-sg (si usas ALB)
**Inbound Rules:**
```
Type: HTTPS
Port: 443
Source: 0.0.0.0/0
Description: Allow HTTPS from Internet

Type: HTTP
Port: 80
Source: 0.0.0.0/0
Description: Redirect HTTP to HTTPS
```

**Outbound Rules:**
```
Type: Custom TCP
Port: 3000
Destination: [Backend Security Group]
Description: Forward to backend
```

---

## 📊 CloudWatch (Monitoring)

### Logs del Backend

**Log Group Name:** `/aws/ec2/revore-staging-backend`

**Log Streams:**
- `application.log` - Logs de la aplicación NestJS
- `error.log` - Logs de errores
- `access.log` - Logs de acceso HTTP

**Retention:** 7 días (staging), 30 días (production)

### Métricas Recomendadas

**EC2 Metrics:**
- CPUUtilization
- NetworkIn/NetworkOut
- DiskReadOps/DiskWriteOps

**CloudFront Metrics:**
- Requests
- BytesDownloaded
- 4xxErrorRate
- 5xxErrorRate

**S3 Metrics:**
- NumberOfObjects
- BucketSizeBytes

### Alarmas (Opcional para staging)

```yaml
Backend CPU High:
  Metric: CPUUtilization
  Threshold: > 80%
  Period: 5 minutes
  
Backend Instance Down:
  Metric: StatusCheckFailed
  Threshold: >= 1
  Period: 2 minutes

CloudFront 5xx Errors:
  Metric: 5xxErrorRate
  Threshold: > 5%
  Period: 5 minutes
```

---

## 🔑 IAM (Identity and Access Management)

### Users/Roles Configurados

#### github-actions-revore-frontend
**Type:** IAM User

**Purpose:** Despliegue automatizado desde GitHub Actions

**Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::revore-staging-app",
        "arn:aws:s3:::revore-staging-app/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "arn:aws:cloudfront::*:distribution/*"
    }
  ]
}
```

**Access Keys:**
- Almacenadas en GitHub Secrets
- Rotar cada 90 días

#### revore-backend-staging
**Type:** IAM Role (para EC2) o IAM User

**Purpose:** Acceso del backend a recursos AWS

**Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::revore-staging-uploads",
        "arn:aws:s3:::revore-staging-uploads/*"
      ]
    }
  ]
}
```

---

## 🔧 Variables de Ambiente

### Frontend (Angular)

**environments.staging.ts:**
```typescript
export const environment = {
  production: true,
  isTesting: true,
  apiUrl: 'https://api-staging.revore.mx',
  encryptKey: 'RevoreCompany#2023',
  environment: 'staging'
};
```

### Backend (NestJS)

**.env (staging):**
```env
# Application
NODE_ENV=staging
PORT=3000
APP_NAME=revore-backend

# Database
DATABASE_URL=postgresql://user:password@host:5432/revore_staging

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# JWT
JWT_SECRET=your-staging-secret-min-32-characters
JWT_EXPIRATION=7d

# CORS
ALLOWED_ORIGINS=https://staging.revore.mx,http://localhost:4200

# S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_UPLOADS_BUCKET=revore-staging-uploads
AWS_S3_UPLOADS_PREFIX=staging/

# Frontend
FRONTEND_URL=https://staging.revore.mx
```

### GitHub Secrets

**Necesarios para GitHub Actions:**
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
CLOUDFRONT_DISTRIBUTION_ID=E...
```

---

## 📈 Estimación de Costos (Staging)

### Costos Mensuales Estimados

| Servicio | Uso Estimado | Costo |
|----------|--------------|-------|
| S3 (revore-staging-app) | 1 GB storage | $0.02 |
| S3 (revore-staging-uploads) | 10 GB storage | $0.23 |
| CloudFront | 100 GB transfer | Gratis (1TB free tier) |
| Route 53 | Hosted zone + queries | $0.50 |
| ACM | SSL certificate | Gratis |
| EC2 (t3.micro) | 24/7 | $7.50 |
| CloudWatch Logs | 5 GB ingestion | $2.50 |
| **Total** | | **~$11/mes** |

**Nota:** Costos pueden variar según uso real. Monitorear con AWS Cost Explorer.

---

## 🚀 Proceso de Despliegue

### Frontend (Automático vía GitHub Actions)

1. Push a branch `master` o `main`
2. GitHub Actions ejecuta workflow
3. Build con configuración `staging`
4. Deploy a S3 con cache strategies
5. Invalidación de CloudFront
6. Sitio disponible en `https://staging.revore.mx`

**Tiempo estimado:** 3-5 minutos

### Backend (Manual o CI/CD)

1. SSH a instancia EC2
2. Pull latest code
3. Install dependencies
4. Build aplicación
5. Restart PM2/systemd service
6. Verificar health check

---

## 🔍 Verificación y Testing

### Verificar Despliegue Frontend

```bash
# 1. Verificar DNS
dig staging.revore.mx

# 2. Verificar SSL
curl -I https://staging.revore.mx

# 3. Verificar contenido
curl https://staging.revore.mx

# 4. Verificar CloudFront
curl -I https://staging.revore.mx | grep -i "x-cache"
```

### Verificar Backend API

```bash
# Health check
curl https://api-staging.revore.mx/health

# Test endpoint
curl https://api-staging.revore.mx/api/v1/test
```

### Verificar Uploads a S3

1. Login en la aplicación
2. Intentar subir archivo
3. Verificar en S3 console que el archivo existe
4. Intentar descargar el archivo

---

## 🐛 Troubleshooting

### Frontend no carga

1. Verificar DNS: `nslookup staging.revore.mx`
2. Verificar CloudFront: Status debe ser "Deployed"
3. Verificar S3: Archivos deben estar en `revore-staging-app`
4. Verificar error pages configuradas en CloudFront

### Uploads fallan

1. Verificar CORS en bucket `revore-staging-uploads`
2. Verificar IAM permissions del backend
3. Verificar URL pre-firmada no expiró
4. Check logs del backend para errores

### CloudFront no actualiza

1. Crear invalidación manualmente: `/*`
2. Esperar 5-10 minutos
3. Limpiar cache del navegador
4. Verificar que los archivos en S3 son nuevos

---

## 📚 Recursos Adicionales

### Documentación AWS
- [S3 Documentation](https://docs.aws.amazon.com/s3/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Route 53 Documentation](https://docs.aws.amazon.com/route53/)

### Monitoreo
- AWS Console: https://console.aws.amazon.com
- CloudWatch Dashboard: (crear custom dashboard)
- Cost Explorer: Para monitorear gastos

### Soporte
- AWS Support (según plan contratado)
- Documentación interna del proyecto
- Contacto del equipo DevOps

---

## ✅ Checklist de Configuración Completa

### Inicial
- [x] VPC creado
- [x] Subnets configuradas
- [x] Security Groups creados
- [x] Certificado SSL emitido

### S3
- [x] Bucket frontend creado y configurado
- [x] Bucket uploads creado y configurado
- [x] Políticas de bucket aplicadas
- [x] CORS configurado

### CloudFront
- [x] Distribution creada
- [x] Origin configurado
- [x] SSL certificate asignado
- [x] Custom domain configurado
- [x] Error pages configuradas

### Route 53
- [x] DNS records creados
- [x] staging.revore.mx → CloudFront
- [ ] api-staging.revore.mx → Backend (pendiente)

### Backend
- [ ] EC2 instance configurada
- [ ] Backend deployado
- [ ] Variables de ambiente configuradas
- [ ] Endpoints funcionando

### GitHub Actions
- [x] Workflow configurado
- [x] Secrets agregados
- [ ] Primer deploy exitoso

### Verificación
- [x] Frontend accesible en https://staging.revore.mx
- [x] SSL funcionando
- [ ] Backend API respondiendo
- [ ] Uploads funcionando
- [ ] CORS configurado correctamente

---

**Última actualización:** 2025-01-06  
**Mantenido por:** Equipo DevOps Revore



