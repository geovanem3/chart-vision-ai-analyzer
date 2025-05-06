import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

// Adding a new CandlePatternIndicator component to visualize candle patterns
const CandlePatternIndicator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    candles: any[];
    width: number;
    height: number;
    patternType?: string;
  }
>(({ candles, width, height, patternType, className, ...props }, ref) => {
  if (!candles?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn("absolute top-0 left-0 w-full h-full pointer-events-none", className)}
      {...props}
    >
      {candles.map((candle, index) => {
        const isGreen = candle.color === 'verde' || candle.close > candle.open;
        
        // Calculate candle position and dimensions
        const x = candle.position?.x || (width / candles.length) * (index + 0.5);
        const y = candle.position?.y || height / 2;
        const candleWidth = candle.width || width / candles.length * 0.6;
        const bodyHeight = candle.height || Math.abs(candle.close - candle.open) * 5;
        const wickHeight = ((candle.high - candle.low) * 5) || bodyHeight * 1.5;
        
        return (
          <div 
            key={index} 
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: x,
              top: y,
            }}
          >
            {/* Candle wick */}
            <div
              className="absolute left-1/2 transform -translate-x-1/2"
              style={{
                width: 1,
                height: wickHeight,
                top: -(wickHeight / 2),
                backgroundColor: isGreen ? '#22c55e' : '#ef4444'
              }}
            />
            
            {/* Candle body */}
            <div
              className="absolute left-1/2 transform -translate-x-1/2"
              style={{
                width: candleWidth,
                height: bodyHeight,
                top: -(bodyHeight / 2),
                backgroundColor: isGreen ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)',
                border: `1px solid ${isGreen ? '#22c55e' : '#ef4444'}`
              }}
            />
            
            {/* Pattern label if provided */}
            {patternType && index === Math.floor(candles.length / 2) && (
              <div 
                className="absolute text-xs font-semibold px-1 py-0.5 rounded bg-black/70 text-white whitespace-nowrap"
                style={{
                  bottom: -(wickHeight / 2) - 20,
                  left: -(patternType.length * 2),
                }}
              >
                {patternType}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
CandlePatternIndicator.displayName = "CandlePatternIndicator";

// Adding a new PriceLevel component to indicate important levels
const PriceLevel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    level: number;
    type: 'support' | 'resistance';
    strength?: 'forte' | 'moderada' | 'fraca';
    width: number;
    height: number;
    maxPrice: number;
    minPrice: number;
  }
>(({ level, type, strength = 'moderada', width, height, maxPrice, minPrice, className, ...props }, ref) => {
  // Calculate vertical position
  const priceRange = maxPrice - minPrice;
  const relativePosition = 1 - ((level - minPrice) / priceRange);
  const y = height * relativePosition;
  
  // Determine color and style based on type and strength
  const color = type === 'support' ? '#22c55e' : '#ef4444';
  const opacity = strength === 'forte' ? 0.8 : strength === 'moderada' ? 0.6 : 0.4;
  const thickness = strength === 'forte' ? 2 : 1;
  const dashArray = strength === 'forte' ? 'none' : strength === 'moderada' ? '5,5' : '3,3';
  
  return (
    <div
      ref={ref}
      className={cn("absolute left-0", className)}
      style={{
        top: y,
        width: width,
        height: thickness,
        backgroundColor: color,
        opacity: opacity,
        strokeDasharray: dashArray
      }}
      {...props}
    >
      <div 
        className="absolute text-xs font-semibold px-1 py-0.5 rounded text-white whitespace-nowrap"
        style={{
          left: 5,
          top: thickness,
          backgroundColor: color,
        }}
      >
        {type === 'support' ? 'Suporte' : 'Resistência'} {level.toFixed(2)}
      </div>
    </div>
  );
});
PriceLevel.displayName = "PriceLevel";

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  CandlePatternIndicator,
  PriceLevel
}
