import paramiko
import sys
import os

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

HOST = "185.157.46.105"
USER = "root"
PASS = "sI9LQU8nivCxJ26e"

def run(ssh, cmd, timeout=600):
    print(f"  $ {cmd.strip()[:120]}...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    for line in out.strip().split("\n")[-12:]:
        if line.strip():
            print(f"    {line}")
    for line in err.strip().split("\n")[-5:]:
        l = line.strip()
        if l and "warn" not in l.lower() and "notice" not in l.lower() and "deprecat" not in l.lower():
            print(f"    [!] {l}")
    return code

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {HOST}...")
    ssh.connect(HOST, username=USER, password=PASS, timeout=15)
    print("Connected!\n")

    steps = [
        ("Install essentials", "export DEBIAN_FRONTEND=noninteractive; apt-get install -y -qq curl git ufw 2>/dev/null; echo OK"),

        ("Install Node.js 22", """
export DEBIAN_FRONTEND=noninteractive
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x 2>/dev/null | bash - 2>/dev/null
  apt-get install -y -qq nodejs 2>/dev/null
fi
node --version; npm --version
"""),

        ("Install PM2", "command -v pm2 &>/dev/null || npm install -g pm2 --no-audit --no-fund 2>/dev/null; pm2 --version"),

        ("Clone from GitHub", """
if [ -d /opt/nythia/.git ]; then
  cd /opt/nythia && git pull origin main 2>&1 | tail -3
else
  rm -rf /opt/nythia
  git clone https://github.com/gazipasali/Nythia.git /opt/nythia 2>&1 | tail -3
fi
ls /opt/nythia/package.json && echo "Clone OK"
"""),

        ("Setup .env", """
cd /opt/nythia
if [ ! -f .env ]; then
  cp .env.example .env
  AUTH_SECRET=$(openssl rand -hex 64)
  sed -i "s|replace-with-a-long-random-string|$AUTH_SECRET|" .env
fi
sed -i 's|ADMIN_PASSWORD=.*|ADMIN_PASSWORD="qwe123QWE123"|' .env
sed -i 's|ADMIN_USERNAME=.*|ADMIN_USERNAME="admin"|' .env
echo ".env ready"
"""),

        ("npm install", "cd /opt/nythia && npm ci --no-audit --no-fund 2>&1 | tail -5"),

        ("Prisma + seed", """
cd /opt/nythia
npx prisma generate 2>&1 | tail -3
npx prisma db push --skip-generate 2>&1 | tail -3
npm run db:seed 2>&1 | tail -3
"""),

        ("Build", "cd /opt/nythia && npm run build 2>&1 | tail -25"),

        ("Install Caddy", """
export DEBIAN_FRONTEND=noninteractive
if ! command -v caddy &>/dev/null; then
  apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https 2>/dev/null
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' 2>/dev/null | gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null
  echo 'deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq 2>/dev/null
  apt-get install -y -qq caddy 2>/dev/null
fi
caddy version 2>/dev/null || echo "Caddy failed, will use port 3000 directly"
"""),

        ("Configure Caddy", """
if command -v caddy &>/dev/null; then
cat > /etc/caddy/Caddyfile << 'CEOF'
:80 {
    reverse_proxy localhost:3000
    header -Server
    header -X-Powered-By
}
CEOF
  systemctl restart caddy
  systemctl enable caddy 2>/dev/null
  echo "Caddy on :80 -> :3000"
else
  echo "No Caddy, direct :3000"
fi
"""),

        ("Start PM2", """
cd /opt/nythia
pm2 delete nythia 2>/dev/null || true
pm2 start npm --name "nythia" -- start
pm2 save 2>/dev/null
pm2 startup systemd -u root --hp /root 2>/dev/null || true
sleep 3
pm2 status
"""),

        ("Firewall", """
ufw allow 22/tcp 2>/dev/null
ufw allow 80/tcp 2>/dev/null
ufw allow 3000/tcp 2>/dev/null
echo "y" | ufw enable 2>/dev/null
ufw status
"""),

        ("Health check", "sleep 2; curl -s -o /dev/null -w 'HTTP %{http_code}' http://localhost:3000; echo ' from :3000'; curl -s -o /dev/null -w 'HTTP %{http_code}' http://localhost:80; echo ' from :80'"),
    ]

    for i, (name, cmd) in enumerate(steps, 1):
        print(f"\n{'='*50}")
        print(f"  [{i}/{len(steps)}] {name}")
        print(f"{'='*50}")
        code = run(ssh, cmd.strip(), timeout=600)
        if code != 0 and name in ("Clone from GitHub", "npm install", "Build"):
            print(f"\n  !!! FAILED: {name} !!!")
            ssh.close()
            return

    print(f"\n{'='*50}")
    print(f"  DEPLOY COMPLETE!")
    print(f"  http://{HOST}")
    print(f"  Login: admin / qwe123QWE123")
    print(f"  Gizli giris: sayfada 'nythia' yaz")
    print(f"  Simdi GitHub'i private'a cekebilirsin!")
    print(f"{'='*50}")
    ssh.close()

if __name__ == "__main__":
    main()
