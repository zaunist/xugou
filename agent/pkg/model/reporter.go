package model

import (
	"net/http"
)

// HTTPReporter 是基于HTTP的数据上报器实现
type HTTPReporter struct {
	ServerURL  string
	ApiToken   string
	ProxyURL   string
	Client     *http.Client
	Registered bool
}

// RegisterPayload 定义注册到后端的数据结构
type RegisterPayload struct {
	Token       string   `json:"token"`        // API令牌
	Name        string   `json:"name"`         // 客户端名称
	Hostname    string   `json:"hostname"`     // 主机名
	IPAddresses []string `json:"ip_addresses"` // IP地址列表
	OS          string   `json:"os"`           // 操作系统
	Version     string   `json:"version"`      // 操作系统版本
}

// RegisterResponse 定义注册响应结构
type RegisterResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Agent   struct {
		ID int `json:"id"`
	} `json:"agent"`
}
