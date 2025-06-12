package agent

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"github.com/xugou/agent/pkg/collector"
	"github.com/xugou/agent/pkg/config"
	"github.com/xugou/agent/pkg/reporter"
)

func init() {
	startCmd := &cobra.Command{
		Use:   "start",
		Short: "启动 Xugou Agent",
		Long:  `启动 Xugou Agent 开始采集系统信息并上报到服务器`,
		Run:   runStart,
	}
	rootCmd.AddCommand(startCmd)
}

func runStart(cmd *cobra.Command, args []string) {

	config.ServerURL = viper.GetString("server")
	config.Token = viper.GetString("token")
	config.Interval = viper.GetInt("interval")
	config.ProxyURL = viper.GetString("proxy")
	// 检查必要的配置

	if config.Token == "" {
		fmt.Println("错误: 未设置 API 令牌，请使用 --token 参数或在配置文件中设置")
		os.Exit(1)
	}

	if config.ServerURL == "" {
		fmt.Println("错误: 未设置服务器地址，请使用 --server 参数或在配置文件中设置")
		os.Exit(1)
	}

	fmt.Println("Xugou Agent 启动中...")
	fmt.Printf("服务器地址: %s\n", config.ServerURL)
	fmt.Printf("上报数据间隔: %d秒\n", config.Interval)
	if config.ProxyURL != "" {
		fmt.Printf("使用代理服务器: %s\n", config.ProxyURL)
	}
	fmt.Println("使用令牌自动注册/上报数据")

	// 设置上下文，用于处理取消信号
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 初始化数据收集器和上报器
	dataCollector := collector.NewCollector()
	dataReporter := reporter.NewReporter()
	fmt.Println("使用HTTP上报器")

	// 设置定时器，按指定间隔上报数据
	ticker := time.NewTicker(time.Duration(config.Interval) * time.Second)
	defer ticker.Stop()

	// 设置信号处理，用于优雅退出
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	// 启动时立即执行一次收集和上报
	go collectAndReport(ctx, dataCollector, dataReporter)

	fmt.Println("Xugou Agent 已启动，按 Ctrl+C 停止")

	// 主循环
	for {
		select {
		case <-ticker.C:
			go collectAndReportBatch(ctx, dataCollector, dataReporter)
		case sig := <-sigCh:
			fmt.Printf("收到信号 %v，正在停止...\n", sig)
			return
		}
	}
}

// collectAndReport 收集并上报系统信息
func collectAndReport(ctx context.Context, c collector.Collector, r reporter.Reporter) {
	// 收集系统信息
	info, err := c.Collect(ctx)
	if err != nil {
		fmt.Printf("采集系统信息失败: %v\n", err)
		return
	}

	// 上报系统信息
	err = r.Report(ctx, info)
	if err != nil {
		fmt.Printf("上报系统信息失败: %v\n", err)
		return
	}

	fmt.Printf("系统信息已收集并上报，时间: %s\n", time.Now().Format("2006-01-02 15:04:05"))
}

func collectAndReportBatch(ctx context.Context, c collector.Collector, r reporter.Reporter) {
	infoList, err := c.CollectBatch(ctx)
	if err != nil {
		fmt.Printf("采集系统信息失败: %v\n", err)
		return
	}

	fmt.Printf("采集到 %d 条系统信息\n", len(infoList))

	err = r.ReportBatch(ctx, infoList)
	if err != nil {
		fmt.Printf("上报系统信息失败: %v\n", err)
		return
	}
	fmt.Printf("系统信息已收集并上报，时间: %s\n", time.Now().Format("2006-01-02 15:04:05"))
}
