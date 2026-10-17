FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src

# Vite inlines VITE_* values at build time; they are public by nature (see .env.example).
ARG VITE_GOOGLE_PLACES_API_KEY=""
ARG VITE_ADDRESS_SEARCH_DEBOUNCE_MS=""
ARG VITE_ADDRESS_BIAS_LAT=""
ARG VITE_ADDRESS_BIAS_LNG=""
ARG VITE_ADDRESS_BIAS_RADIUS_M=""
ENV VITE_GOOGLE_PLACES_API_KEY=$VITE_GOOGLE_PLACES_API_KEY \
    VITE_ADDRESS_SEARCH_DEBOUNCE_MS=$VITE_ADDRESS_SEARCH_DEBOUNCE_MS \
    VITE_ADDRESS_BIAS_LAT=$VITE_ADDRESS_BIAS_LAT \
    VITE_ADDRESS_BIAS_LNG=$VITE_ADDRESS_BIAS_LNG \
    VITE_ADDRESS_BIAS_RADIUS_M=$VITE_ADDRESS_BIAS_RADIUS_M
RUN npm run build

FROM nginx:stable-alpine@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed43071545afa9d2e27d94 AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid && chown -R nginx:nginx /var/cache/nginx
USER nginx
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
