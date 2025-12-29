# =============================================================================
# DOCKERFILE - Claude RAG Frontend (Angular)
# =============================================================================
# Multi-stage build: Node para build, Nginx para servir
# Imagem final: ~40MB
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: Builder - Compila a aplicação Angular
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências primeiro (cache layer)
COPY package*.json ./
RUN npm ci --prefer-offline

# Copiar código fonte
COPY . .

# Build de produção
RUN npm run build -- --configuration=production

# -----------------------------------------------------------------------------
# STAGE 2: Runtime - Nginx para servir arquivos estáticos
# -----------------------------------------------------------------------------
FROM nginx:alpine AS runtime

# Labels para metadados
LABEL maintainer="Claude Partner"
LABEL version="1.0.0"
LABEL description="Claude RAG Frontend - Angular Chat UI"

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar arquivos de build do Angular
COPY --from=builder /app/dist/claude-front-sdk-angular/browser /usr/share/nginx/html

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
