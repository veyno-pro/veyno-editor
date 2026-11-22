FROM node:20-alpine
WORKDIR /veyno
COPY . .
RUN npm install --omit=dev --no-audit --no-fund
ENV HOST=0.0.0.0 PORT=8765
EXPOSE 8765
USER node
CMD ["node", "veyno-server.js"]
