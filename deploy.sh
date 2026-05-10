#!/bin/bash
set -euo pipefail

echo "=== Nythia VPS Deploy Script ==="
echo "--- 1/7: System update ---"
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git ufw

echo "--- 2/7: Install Node.js 22 ---"
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
echo "Node: $(node --version) | npm: $(npm --version)"

echo "--- 3/7: Install PM2 ---"
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

echo "--- 4/7: Install Caddy ---"
if ! command -v caddy &>/dev/null; then
  apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy
fi

echo "--- 5/7: Clone & build Nythia ---"
APP_DIR="/opt/nythia"
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  git clone https://github.com/gazipasali/Nythia.git "$APP_DIR"
  cd "$APP_DIR"
fi

if [ ! -f .env ]; then
  cp .env.example .env
  AUTH_SECRET=$(openssl rand -hex 64)
  sed -i "s|replace-with-a-long-random-string|$AUTH_SECRET|" .env
  echo ""
  echo "!!! IMPORTANT: Edit /opt/nythia/.env to set ADMIN_USERNAME and ADMIN_PASSWORD !!!"
  echo ""
fi

npm ci --no-audit --no-fund
npx prisma generate
npx prisma db push --skip-generate
npm run db:seed
npm run build

echo "--- 6/7: Configure Caddy (HTTP reverse proxy) ---"
SERVER_IP=$(curl -4 -s ifconfig.me || echo "0.0.0.0")
cat > /etc/caddy/Caddyfile << CADDYEOF
:80 {
    reverse_proxy localhost:3000
    header -Server
    header -X-Powered-By
}
CADDYEOF
systemctl restart caddy
systemctl enable caddy

echo "--- 7/7: Start with PM2 ---"
cd "$APP_DIR"
pm2 delete nythia 2>/dev/null || true
pm2 start npm --name "nythia" -- start
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "=== Firewall ==="
ufw allow 22/tcp
ufw allow 80/tcp
ufw --force enable

echo ""
echo "========================================="
echo "  Nythia deployed successfully!"
echo "  URL: http://$SERVER_IP"
echo "  Admin: edit /opt/nythia/.env for creds"
echo "  Logs: pm2 logs nythia"
echo "  Restart: pm2 restart nythia"
echo "========================================="
