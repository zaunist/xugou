# XUGOU - Lightweight Monitoring Platform Based on CloudFlare

<div align="center">

![XUGOU Logo](frontend/public/logo.svg)

XUGOU is a lightweight system monitoring platform based on CloudFlare, providing system monitoring and status page functionality.

English | [简体中文](./README.md)

</div>

## 📅 Development Plan

Currently implemented features:

- ✅ System Monitoring - Client resource monitoring and data reporting
- ✅ HTTP Monitoring - API endpoint health detection and analysis
- ✅ Data Visualization - Real-time data display and historical trend analysis
- ✅ Status Page - Customizable service status page
- ✅ Alert Notifications - Anomaly event notifications through multiple channels (Email, Telegram, etc.)
- ❌ Mobile APP - Convenient monitoring status check on mobile devices

## ✨ Core Features

- 🖥️ **System Monitoring**
  - Real-time monitoring of CPU, memory, disk, network and other system metrics
  - Support for custom monitoring intervals
  - Cross-platform support (agent written in Go, supporting all platforms where Go can compile)

- 🌐 **HTTP Monitoring**
  - Support for HTTP/HTTPS endpoint monitoring
  - Custom request methods, headers, and request bodies
  - Response time, status code and content validation

- 📊 **Data Visualization**
  - Real-time data chart display
  - Custom dashboards

- 🌍 **Status Page**
  - Customizable status page
  - Support for multiple monitoring items
  - Responsive design

## 🏗️ System Architecture

XUGOU adopts a modern system architecture, including the following components:

- **Agent**: Lightweight system monitoring client
- **Backend**: Backend service based on Cloudflare Workers
- **Frontend**: Modern frontend interface based on React + TypeScript

## 🚀 Quick Start

### Deployment Guide

Default username: admin  Default password: admin123

[XUGOU wiki Deployment Guide](https://github.com/zaunist/xugou/wiki)

### Video Tutorial

[![XUGOU Video Tutorial](https://img.youtube.com/vi/jisEpcqDego/0.jpg)](https://youtu.be/w2by-7jDCM0)

### Workers Optimization Domain Video Tutorial

[![workers 优选教程](https://img.youtube.com/vi/pF05vhNe_5A/0.jpg)](https://youtu.be/pF05vhNe_5A?si=FoLk94K2V5Wpg3jr)

## FAQ

[XUGOU wiki FAQ](https://github.com/zaunist/xugou/wiki)

## ⭐ Support the Author

Sponsor me in any way you can:

- Star the project and share it with your friends
- Gitfish: [Gitfish Sponsor](https://www.gitfish.dev/repo/zaunist/xugou)
- Buy me a coffee

<div align="center">
  <a href="https://buymeacoffee.com/real_zaunist" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="200" height="51">
  </a>
</div>

## 🤝 Contribution

All forms of contributions are welcome, whether it's new features, bug fixes, or documentation improvements.

## 🏢 Sponsorship

Thanks to the following sponsors for supporting the development of XUGOU:

[Cloudflare](https://www.cloudflare.com/)

## 📄 License

This project is open-sourced under the MIT License. See the [LICENSE](./LICENSE) file for details. 

## 🔥 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=zaunist/xugou&type=Date)](https://www.star-history.com/#zaunist/xugou&Date)
