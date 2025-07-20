# 1️⃣ Base Node slim avec droits root
FROM node:18-bullseye-slim

# 2️⃣ On installe les dépendances système nécessaires à Chrome
RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates \
    libnss3 libatk-bridge2.0-0 libgtk-3-0 libx11-xcb1 \
    libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libasound2 libpango-1.0-0 libcairo2 libjpeg-dev libxshmfence1 \
  && rm -rf /var/lib/apt/lists/*

# 3️⃣ On importe la clef et le dépôt officiel de Google Chrome
RUN wget -qO- https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
       > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

# 4️⃣ On copie et installe les dépendances Node
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production

# 5️⃣ On copie le reste de votre code
COPY . .

# 6️⃣ Lancement
CMD ["node", "server.js"]
