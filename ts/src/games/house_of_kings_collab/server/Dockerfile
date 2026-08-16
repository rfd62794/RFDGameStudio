FROM node:20-slim
WORKDIR /app
ARG CACHE_BUST=1

# Copy the bundled server
COPY bundle.js ./bundle.js

# Copy the Firebase config to both paths the server code checks
COPY firebase-applet-config.json ./firebase-applet-config.json
RUN mkdir -p src/games/house_of_kings_collab
COPY firebase-applet-config.json ./src/games/house_of_kings_collab/firebase-applet-config.json

# Create empty dist for the static serving fallback
RUN mkdir -p dist
RUN echo '<!doctype html><html><body>HoK backend</body></html>' > dist/index.html

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "bundle.js"]
# cache bust: 20260816001238
# cache bust: 20260816001415
# cache bust: 20260816002018
