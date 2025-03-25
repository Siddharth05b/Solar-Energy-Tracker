"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, addDays, parseISO, isValid } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  SunIcon,
  BoltIcon,
  TrendingUpIcon,
  CalendarIcon,
  SaveIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XIcon,
  InfoIcon,
} from "lucide-react"
import { SolarChart } from "@/components/solar-chart"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"

// Define the type for our solar production entry
interface SolarEntry {
  date: string
  production: number
  id: string
}

// Define the form schema with Zod
const formSchema = z.object({
  production: z.coerce
    .number({
      required_error: "Production value is required",
      invalid_type_error: "Production must be a number",
    })
    .nonnegative("Production value must be positive")
    .max(100, "Production value seems too high (max 100 kWh)"),
})

export default function SolarTracker() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [entries, setEntries] = useState<SolarEntry[]>([])
  const [showCalendar, setShowCalendar] = useState(false)
  const [saveAnimation, setSaveAnimation] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<SolarEntry | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      production: undefined,
    },
  })

  // Load entries from localStorage on component mount
  useEffect(() => {
    try {
      setIsLoading(true)
      const savedEntries = localStorage.getItem("solarEntries")
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries)
        // Ensure all entries have IDs
        const entriesWithIds = parsedEntries.map((entry: any) => ({
          ...entry,
          id: entry.id || crypto.randomUUID(),
        }))
        setEntries(entriesWithIds)
      }
    } catch (error) {
      toast.error("Failed to load saved data", {
        description: "Your previous entries couldn't be loaded",
        icon: <AlertCircleIcon className="h-5 w-5" />,
      })
      console.error("Error loading data from localStorage:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save entries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("solarEntries", JSON.stringify(entries))
    } catch (error) {
      toast.error("Failed to save data", {
        description: "Your data couldn't be saved to local storage",
        icon: <AlertCircleIcon className="h-5 w-5" />,
      })
      console.error("Error saving data to localStorage:", error)
    }
  }, [entries])

  // Update form when date changes
  useEffect(() => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd")
      const existingEntry = entries.find((entry) => entry.date === formattedDate)

      if (existingEntry) {
        form.setValue("production", existingEntry.production)
      } else {
        form.reset()
      }
    }
  }, [date, entries, form])

  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate || !isValid(newDate)) {
      toast.error("Invalid date selected", {
        description: "Please select a valid date",
        icon: <AlertCircleIcon className="h-5 w-5" />,
      })
      return
    }

    setDate(newDate)
    setShowCalendar(false)

    // Check if there's already an entry for this date
    const formattedDate = format(newDate, "yyyy-MM-dd")
    const existingEntry = entries.find((entry) => entry.date === formattedDate)

    if (existingEntry) {
      form.setValue("production", existingEntry.production)
      toast.info("Existing entry found", {
        description: `Found existing data for ${format(newDate, "MMMM d, yyyy")}`,
        icon: <InfoIcon className="h-5 w-5" />,
      })
    } else {
      form.reset()
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!date) {
      toast.error("No date selected", {
        description: "Please select a date first",
        icon: <AlertCircleIcon className="h-5 w-5" />,
      })
      return
    }

    setIsLoading(true)

    try {
      const formattedDate = format(date, "yyyy-MM-dd")
      const productionValue = values.production

      // Check if an entry for this date already exists
      const existingEntryIndex = entries.findIndex((entry) => entry.date === formattedDate)
      let updatedEntries: SolarEntry[]

      if (existingEntryIndex >= 0) {
        // Update existing entry
        updatedEntries = [...entries]
        updatedEntries[existingEntryIndex] = {
          ...updatedEntries[existingEntryIndex],
          production: productionValue,
        }
        setEntries(updatedEntries)

        toast.success("Entry updated", {
          description: `Updated production for ${format(date, "MMMM d, yyyy")}`,
          icon: <CheckCircleIcon className="h-5 w-5" />,
        })
      } else {
        // Add new entry
        const newEntry = {
          date: formattedDate,
          production: productionValue,
          id: crypto.randomUUID(),
        }
        updatedEntries = [...entries, newEntry]
        setEntries(updatedEntries)

        toast.success("Entry saved", {
          description: `Added production for ${format(date, "MMMM d, yyyy")}`,
          icon: <CheckCircleIcon className="h-5 w-5" />,
        })
      }

      // Show save animation
      setSaveAnimation(true)
      setTimeout(() => setSaveAnimation(false), 1000)
    } catch (error) {
      toast.error("Failed to save entry", {
        description: "An unexpected error occurred while saving your data",
        icon: <AlertCircleIcon className="h-5 w-5" />,
      })
      console.error("Error saving entry:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEntry = (entry: SolarEntry) => {
    setEntryToDelete(entry)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (!entryToDelete) return

    setIsDeleting(true)

    try {
      const updatedEntries = entries.filter((e) => e.id !== entryToDelete.id)
      setEntries(updatedEntries)

      const deletedEntry = entryToDelete
      const entryDate = format(parseISO(deletedEntry.date), "MMMM d, yyyy")

      toast.success("Entry deleted", {
        description: `Removed production for ${entryDate}`,
        action: {
          label: "Undo",
          onClick: () => {
            // Restore the deleted entry
            setEntries((prev) => [...prev, deletedEntry])
            toast.success("Entry restored", {
              description: `Restored production for ${entryDate}`,
            })
          },
        },
      })

      // Reset form if the deleted entry was for the currently selected date
      if (date && format(date, "yyyy-MM-dd") === deletedEntry.date) {
        form.reset()
      }
    } catch (error) {
      toast.error("Failed to delete entry", {
        description: "An unexpected error occurred",
        icon: <AlertCircleIcon className="h-5 w-5" />,
      })
      console.error("Error deleting entry:", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setEntryToDelete(null)
    }
  }

  // Get the current week's entries for the summary
  const getCurrentWeekEntries = () => {
    if (!date) return []

    try {
      const weekStart = startOfWeek(date)
      const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), "yyyy-MM-dd"))

      return weekDates.map((weekDate) => {
        const entry = entries.find((e) => e.date === weekDate)
        return {
          date: weekDate,
          production: entry ? entry.production : 0,
          id: entry?.id || crypto.randomUUID(),
        }
      })
    } catch (error) {
      toast.error("Error calculating weekly data", {
        description: "Failed to process your weekly production data",
        icon: <AlertCircleIcon className="h-5 w-5" />,
      })
      console.error("Error in getCurrentWeekEntries:", error)
      return []
    }
  }

  const weeklyEntries = getCurrentWeekEntries()

  // Calculate weekly stats
  const calculateWeeklyStats = () => {
    try {
      const weeklyTotal = weeklyEntries.reduce((sum, entry) => sum + entry.production, 0)
      const daysWithProduction = weeklyEntries.filter((entry) => entry.production > 0).length
      const dailyAverage = daysWithProduction > 0 ? weeklyTotal / daysWithProduction : 0
      const maxProduction = Math.max(...weeklyEntries.map((entry) => entry.production))
      const maxProductionDay = weeklyEntries.find((entry) => entry.production === maxProduction)

      return { weeklyTotal, dailyAverage, maxProduction, maxProductionDay }
    } catch (error) {
      toast.error("Error calculating statistics", {
        description: "Failed to calculate your weekly statistics",
        icon: <AlertCircleIcon className="h-5 w-5" />,
      })
      console.error("Error calculating weekly stats:", error)
      return {
        weeklyTotal: 0,
        dailyAverage: 0,
        maxProduction: 0,
        maxProductionDay: undefined,
      }
    }
  }

  const { weeklyTotal, dailyAverage, maxProduction, maxProductionDay } = calculateWeeklyStats()

  return (
    <Card className="w-full max-w-5xl overflow-hidden border-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] rounded-xl">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/90 to-primary p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-primary-foreground/10 backdrop-blur-sm p-2 rounded-full">
              <SunIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-primary-foreground ml-3">Solar Energy Tracker</h1>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Left Panel - Input */}
          <div className="bg-background p-6 md:border-r border-border/40">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
                  <BoltIcon className="h-5 w-5 text-primary" />
                  <span>Log Production</span>
                </h2>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="date" className="text-sm font-medium">
                          Selected Date
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCalendar(!showCalendar)}
                          className="h-8 text-xs gap-1 hover:bg-muted"
                        >
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {showCalendar ? "Hide Calendar" : "Show Calendar"}
                        </Button>
                      </div>

                      <div className="flex items-center h-10 px-3 rounded-md border border-input bg-background text-sm">
                        {date ? format(date, "EEEE, MMMM d, yyyy") : "Select a date"}
                      </div>

                      {showCalendar && (
                        <div className="mt-2 border rounded-md shadow-sm">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateChange}
                            className="rounded-md"
                            aria-label="Select date for solar production entry"
                          />
                        </div>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="production"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Energy Production</FormLabel>
                          <div className="flex space-x-2">
                            <div className="relative flex-1">
                              <FormControl>
                                <Input
                                  placeholder="0.00"
                                  type="number"
                                  step="0.01"
                                  className="pr-12"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.value === "" ? undefined : e.target.value)
                                  }}
                                  aria-label="Enter energy production in kilowatt hours"
                                />
                              </FormControl>
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                                kWh
                              </div>
                            </div>
                            <Button
                              type="submit"
                              className={cn(
                                "bg-primary hover:bg-primary/90 text-primary-foreground transition-all",
                                saveAnimation && "bg-green-500",
                              )}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <div className="flex items-center">
                                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                                  Saving
                                </div>
                              ) : saveAnimation ? (
                                "Saved!"
                              ) : (
                                <>
                                  <SaveIcon className="h-4 w-4 mr-2" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                          <FormMessage />
                          <FormDescription>Enter the amount of solar energy produced on this day.</FormDescription>
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>

              <Separator className="my-6" />

              {/* Weekly Stats */}
              <div>
                <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
                  <TrendingUpIcon className="h-5 w-5 text-primary" />
                  <span>Weekly Summary</span>
                </h2>

                <Badge variant="outline" className="mb-4 font-normal">
                  {date ? format(startOfWeek(date), "MMM d") : ""}
                  {" - "}
                  {date ? format(addDays(startOfWeek(date), 6), "MMM d") : ""}
                </Badge>

                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                      <div className="bg-primary/5 px-4 py-2 border-b border-border/30">
                        <h3 className="text-xs font-semibold text-foreground/80">TOTAL PRODUCTION</h3>
                      </div>
                      <CardContent className="p-4 flex justify-between items-center">
                        <span className="text-2xl font-bold text-primary">{weeklyTotal.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">kilowatt hours</span>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                      <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                        <div className="bg-primary/5 px-4 py-2 border-b border-border/30">
                          <h3 className="text-xs font-semibold text-foreground/80">DAILY AVERAGE</h3>
                        </div>
                        <CardContent className="p-4">
                          <span className="text-xl font-bold text-primary">{dailyAverage.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground ml-1">kWh/day</span>
                        </CardContent>
                      </Card>

                      <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                        <div className="bg-primary/5 px-4 py-2 border-b border-border/30">
                          <h3 className="text-xs font-semibold text-foreground/80">BEST DAY</h3>
                        </div>
                        <CardContent className="p-4">
                          {maxProduction > 0 && maxProductionDay ? (
                            <>
                              <span className="text-xl font-bold text-primary">{maxProduction.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                {format(parseISO(maxProductionDay.date), "EEE")}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">No data</span>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Data & Chart */}
          <div className="col-span-2 bg-background p-6">
            <h2 className="text-lg font-medium mb-6">Production Overview</h2>

            {/* Daily Breakdown */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-foreground/80 mb-3">Daily Production</h3>

              {isLoading ? (
                <div className="grid grid-cols-7 gap-2">
                  {Array(7)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
              ) : weeklyEntries.some((entry) => entry.production > 0) ? (
                <div className="grid grid-cols-7 gap-2">
                  {weeklyEntries.map((entry) => {
                    // Determine opacity based on production
                    const maxValue = Math.max(...weeklyEntries.map((e) => e.production))
                    const intensity = maxValue > 0 ? entry.production / maxValue : 0

                    return (
                      <Card
                        key={entry.date}
                        className={cn(
                          "overflow-hidden border-border/40 transition-all duration-200 hover:shadow-md",
                          entry.production > 0 && "hover:border-primary/50",
                        )}
                      >
                        <div className="bg-muted/50 px-3 py-2 text-center border-b border-border/30 flex justify-between items-center">
                          <p className="text-xs font-medium">{format(parseISO(entry.date), "EEE")}</p>
                          {entry.production > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 rounded-full hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteEntry(entry)}
                              aria-label={`Delete entry for ${format(parseISO(entry.date), "MMMM d")}`}
                            >
                              <XIcon className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className={cn("p-3 text-center", entry.production > 0 ? "bg-primary/5" : "bg-background")}>
                          <div
                            className={cn(
                              "text-sm font-bold",
                              entry.production > 0 ? "text-primary" : "text-muted-foreground",
                            )}
                          >
                            {entry.production > 0 ? entry.production.toFixed(1) : "-"}
                          </div>
                          {entry.production > 0 && <div className="text-[10px] text-muted-foreground">kWh</div>}

                          {/* Visual indicator of production level */}
                          {entry.production > 0 && (
                            <div className="mt-2 w-full bg-muted rounded-full h-1">
                              <div
                                className="bg-primary h-1 rounded-full"
                                style={{ width: `${Math.max(5, intensity * 100)}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20">
                  <p className="text-muted-foreground">No production data for this week</p>
                  <p className="text-sm text-muted-foreground mt-1">Add data using the form on the left</p>
                </div>
              )}
            </div>

            {/* Chart */}
            <div>
              <h3 className="text-sm font-medium text-foreground/80 mb-3">Weekly Trend</h3>

              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : weeklyEntries.some((entry) => entry.production > 0) ? (
                <Card className="border-border/40 p-4 hover:border-primary/30 transition-colors">
                  <div className="h-[250px]" aria-label="Bar chart showing weekly solar production trend">
                    <SolarChart entries={weeklyEntries} />
                  </div>
                </Card>
              ) : (
                <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20">
                  <p className="text-muted-foreground">No chart data available</p>
                  <p className="text-sm text-muted-foreground mt-1">Add production data to see the weekly trend</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the production data for{" "}
              {entryToDelete && format(parseISO(entryToDelete.date), "MMMM d, yyyy")}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="hover:bg-muted">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

