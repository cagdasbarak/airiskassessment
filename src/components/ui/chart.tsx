import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"
const THEMES = { light: "", dark: ".dark" } as const
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
    theme?: Record<keyof typeof THEMES, string>
  }
}
type ChartContextProps = {
  config: ChartConfig
}
const ChartContext = React.createContext<ChartContextProps | null>(null)
function useChart() {
  const context = React.useContext(ChartContext) ?? { config: {} }
  return context
}
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ReactNode
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId?.() ?? ''
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        style={
          {
            "--chart-style-id": `chart-style-${chartId}`,
            minWidth: "0",
            minHeight: "450px"
          } as React.CSSProperties
        }
        ref={ref}
        className={cn(
          "relative flex flex-col min-w-0 w-full overflow-visible justify-center text-xs print:overflow-visible [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%" debounce={0}>
          {children as any}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  if (!id) return null
  const colorEntries = Object.entries(config).filter(([_, c]) => c.theme || c.color)
  if (!colorEntries.length) return null
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => `
${prefix} [data-chart="${id}"] {
${colorEntries.map(([key, item]) => {
    const color = item.theme?.[theme as keyof typeof THEMES] || item.color
    return color ? `  --color-${key}: ${color};` : null
  }).filter(Boolean).join("\n")}
}
`)
          .join("\n"),
      }}
    />
  )
}
const ChartTooltip = RechartsPrimitive.Tooltip
const ChartTooltipContent = React.forwardRef<HTMLDivElement, any>(
  ({ active, payload, className, hideLabel = false, label, labelClassName }, ref) => {
    const { config } = useChart()
    if (!active || !payload?.length) return null
    return (
      <div ref={ref} className={cn("grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl", className)}>
        {!hideLabel && <div className={cn("font-medium", labelClassName)}>{label}</div>}
        <div className="grid gap-1.5">
          {payload.map((item: any, index: number) => {
            const configItem = config[item.name as string] || config[item.dataKey as string];
            return (
              <div key={index} className="flex w-full items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                <span className="text-muted-foreground flex-1">{configItem?.label || item.name}</span>
                <span className="font-mono font-medium">{(item.value ?? 0).toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"
export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartStyle }