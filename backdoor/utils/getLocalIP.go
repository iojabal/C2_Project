package utils

import (
	"net"
	"strings"
)

func GetLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "unknown"
	}

	for _, addr := range addrs {
		// Filtrar direcciones IP que no son loopback
		if ipNet, ok := addr.(*net.IPNet); ok && !ipNet.IP.IsLoopback() {
			if ipNet.IP.To4() != nil && !strings.HasPrefix(ipNet.IP.String(), "169.254.") {
				return ipNet.IP.String()
			}
		}
	}

	return "unknown"
}
