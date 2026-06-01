import paramiko, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("185.157.46.105", username="root", password="sI9LQU8nivCxJ26e", timeout=15)
print("Connected!")

def run(cmd, t=120):
    print(f"\n$ {cmd.strip()[:120]}...")
    si, so, se = ssh.exec_command(cmd, timeout=t)
    out = so.read().decode("utf-8", errors="replace")
    err = se.read().decode("utf-8", errors="replace")
    code = so.channel.recv_exit_status()
    if out.strip():
        for l in out.strip().split("\n"):
            print(f"  {l}")
    if err.strip():
        for l in err.strip().split("\n")[-5:]:
            if l.strip():
                print(f"  [!] {l}")
    print(f"  exit: {code}")
    return code

print("=== Install growpart ===")
run("apt-get install -y -qq cloud-guest-utils 2>/dev/null; echo OK")

print("\n=== Grow partition sda1 ===")
run("growpart /dev/sda 1 2>&1")

print("\n=== Resize filesystem ===")
run("resize2fs /dev/sda1 2>&1")

print("\n=== Verify ===")
run("df -h /")

ssh.close()
