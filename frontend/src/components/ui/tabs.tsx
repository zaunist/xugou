"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn(
        "flex flex-col outline-none shadow-none", // 修改点：添加 outline-none shadow-none
        className
      )}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex items-center gap-1 py-0 pl-1 pr-2 shadow-none outline-none",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
            // 基础布局和排版样式
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
            // 为所有可动画属性启用平滑过渡
            "transition-all",
            // focus-visible 状态：提供清晰的聚焦环，增强可访问性
            // 使用具体的颜色替换 ring-ring 和 ring-offset-background
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",
            // 禁用状态的样式
            "disabled:pointer-events-none disabled:opacity-50",
            // 默认（非激活）状态的样式:
            // - 使用具体的颜色替换 text-muted-foreground 和 hover:text-primary
            "text-slate-500 dark:text-slate-400 hover:text-gray-600 dark:hover:text-gray-400 border-2 border-transparent",
            // 激活（选中）状态的样式:
            // - 使用具体的颜色替换 data-[state=active]:text-primary
            "data-[state=active]:text-gray-700 dark:data-[state=active]:text-gray-400 data-[state=active]:font-semibold",
            // - 使用具体的颜色替换 data-[state=active]:bg-primary/10
            "data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-500/20", // 示例：浅蓝色背景
            // - 使用具体的颜色替换 data-[state=active]:border-primary
            "data-[state=active]:border-gray-600 dark:data-[state=active]:border-gray-500",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none",
        "pt-2", // padding-top: 24px
        "shadow-none", // box-shadow: none
        "border-0", // border: none (ensuring no borders are applied)
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }