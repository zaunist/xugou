package utils

import "net"

// NormalizeURL 处理URL格式，确保URL末尾没有斜杠
func NormalizeURL(url string) string {
	// 移除URL末尾的斜杠
	if len(url) > 0 && url[len(url)-1] == '/' {
		return url[:len(url)-1]
	}
	return url
}

// GetLocalIPs 获取所有本地IPv4地址
func GetLocalIPs() []string {
	ips := []string{}
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return append(ips, "unknown")
	}

	for _, addr := range addrs {
		// 检查IP地址类型
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				ips = append(ips, ipnet.IP.String())
			}
		}
	}

	if len(ips) == 0 {
		return append(ips, "unknown")
	}

	return ips
}
