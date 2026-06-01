import paramiko, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("185.157.46.105", username="root", password="sI9LQU8nivCxJ26e", timeout=15)

cmds = [
    'curl -s -o /dev/null -w "%{http_code}" https://github.com/gazipasali/Nythia',
    'curl -s -o /dev/null -w "%{http_code}" https://raw.githubusercontent.com/gazipasali/Nythia/main/package.json',
]
for c in cmds:
    stdin, stdout, stderr = ssh.exec_command(c)
    print(f"{c[:60]}... -> {stdout.read().decode().strip()}")
ssh.close()
