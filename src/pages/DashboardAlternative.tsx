import { useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar, LogIn, LogOut, Bed, CheckCircle2, Clock, XCircle, ChevronDown } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useOutletContext } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DashboardAlternative() {
  const { hotel } = useOutletContext<{ hotel: any }>();
  const [platformPeriod, setPlatformPeriod] = useState("this-week");

  const kpis = [
    { title: "Total Revenue", value: "$125,450", change: "+12.5%", trend: "up", icon: DollarSign, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "New Bookings", value: "342", change: "+8.2%", trend: "up", icon: Calendar, color: "text-success", bgColor: "bg-success/10" },
    { title: "Check In", value: "48", change: "-2.4%", trend: "down", icon: LogIn, color: "text-tasks", bgColor: "bg-tasks/10" },
    { title: "Check Out", value: "52", change: "+5.1%", trend: "up", icon: LogOut, color: "text-secondary", bgColor: "bg-secondary/10" },
  ];

  const guestsData = [
    { name: 'Mon', guests: 45 }, { name: 'Tue', guests: 52 }, { name: 'Wed', guests: 38 },
    { name: 'Thu', guests: 65 }, { name: 'Fri', guests: 78 }, { name: 'Sat', guests: 85 }, { name: 'Sun', guests: 72 },
  ];

  const revenueData = [
    { name: 'Jun', revenue: 45 }, { name: 'Jul', revenue: 52 }, { name: 'Aug', revenue: 48 },
    { name: 'Sep', revenue: 61 }, { name: 'Oct', revenue: 75 }, { name: 'Nov', revenue: 68 },
  ];

  const bookingsData = [
    { name: 'Jan', booked: 120, canceled: 12 }, { name: 'Feb', booked: 140, canceled: 15 },
    { name: 'Mar', booked: 165, canceled: 18 }, { name: 'Apr', booked: 142, canceled: 14 },
    { name: 'May', booked: 180, canceled: 20 }, { name: 'Jun', booked: 195, canceled: 16 },
  ];

  const platformDataByPeriod: Record<string, any> = {
    "today": {
      data: [
        { name: 'Booking.com', value: 45, color: 'hsl(var(--primary))', percentage: 32 },
        { name: 'Agoda', value: 38, color: 'hsl(var(--reservations))', percentage: 27 },
        { name: 'Airbnb', value: 25, color: 'hsl(var(--housekeeping))', percentage: 18 },
        { name: 'Hotels.com', value: 18, color: 'hsl(var(--muted-foreground))', percentage: 13 },
        { name: 'TripAdvisor', value: 10, color: 'hsl(var(--analytics))', percentage: 7 },
        { name: 'Traveloka', value: 5, color: 'hsl(var(--foreground))', percentage: 3 },
      ],
      lastPeriod: 128
    },
    "this-week": {
      data: [
        { name: 'Booking.com', value: 654, color: 'hsl(var(--primary))', percentage: 29 },
        { name: 'Agoda', value: 564, color: 'hsl(var(--reservations))', percentage: 25 },
        { name: 'Airbnb', value: 406, color: 'hsl(var(--housekeeping))', percentage: 18 },
        { name: 'Hotels.com', value: 271, color: 'hsl(var(--muted-foreground))', percentage: 12 },
        { name: 'TripAdvisor', value: 203, color: 'hsl(var(--analytics))', percentage: 9 },
        { name: 'Traveloka', value: 158, color: 'hsl(var(--foreground))', percentage: 7 },
      ],
      lastPeriod: 1923
    },
    "this-month": {
      data: [
        { name: 'Booking.com', value: 2850, color: 'hsl(var(--primary))', percentage: 30 },
        { name: 'Agoda', value: 2375, color: 'hsl(var(--reservations))', percentage: 25 },
        { name: 'Airbnb', value: 1710, color: 'hsl(var(--housekeeping))', percentage: 18 },
        { name: 'Hotels.com', value: 1140, color: 'hsl(var(--muted-foreground))', percentage: 12 },
        { name: 'TripAdvisor', value: 855, color: 'hsl(var(--analytics))', percentage: 9 },
        { name: 'Traveloka', value: 570, color: 'hsl(var(--foreground))', percentage: 6 },
      ],
      lastPeriod: 8234
    },
    "this-year": {
      data: [
        { name: 'Booking.com', value: 34200, color: 'hsl(var(--primary))', percentage: 29 },
        { name: 'Agoda', value: 28500, color: 'hsl(var(--reservations))', percentage: 24 },
        { name: 'Airbnb', value: 21375, color: 'hsl(var(--housekeeping))', percentage: 18 },
        { name: 'Hotels.com', value: 14250, color: 'hsl(var(--muted-foreground))', percentage: 12 },
        { name: 'TripAdvisor', value: 10688, color: 'hsl(var(--analytics))', percentage: 9 },
        { name: 'Traveloka', value: 9500, color: 'hsl(var(--foreground))', percentage: 8 },
      ],
      lastPeriod: 98456
    }
  };

  const currentPlatformData = platformDataByPeriod[platformPeriod];
  const platformData = currentPlatformData.data;
  const totalBooks = platformData.reduce((sum: number, platform: any) => sum + platform.value, 0);
  const lastPeriodBooks = currentPlatformData.lastPeriod;

  const periodLabels: Record<string, string> = {
    "today": "Yesterday",
    "this-week": "Last Week",
    "this-month": "Last Month",
    "this-year": "Last Year"
  };

  const bookingsList = [
    { id: "BK-20231", guest: "John Doe", roomType: "Deluxe Suite", roomNo: "301", duration: "3 nights", checkIn: "Nov 10", checkOut: "Nov 13", status: "Confirmed" },
    { id: "BK-20232", guest: "Jane Smith", roomType: "Standard Room", roomNo: "205", duration: "2 nights", checkIn: "Nov 11", checkOut: "Nov 13", status: "Checked In" },
    { id: "BK-20233", guest: "Mike Johnson", roomType: "Executive Suite", roomNo: "402", duration: "5 nights", checkIn: "Nov 12", checkOut: "Nov 17", status: "Pending" },
    { id: "BK-20234", guest: "Sarah Williams", roomType: "Deluxe Room", roomNo: "308", duration: "1 night", checkIn: "Nov 9", checkOut: "Nov 10", status: "Checked Out" },
    { id: "BK-20235", guest: "Tom Brown", roomType: "Standard Room", roomNo: "102", duration: "4 nights", checkIn: "Nov 10", checkOut: "Nov 14", status: "Confirmed" },
  ];

  const activities = [
    { time: "10 min ago", desc: "New booking from Booking.com", icon: CheckCircle2, color: "text-success" },
    { time: "1 hour ago", desc: "Guest checked out from Room 205", icon: LogOut, color: "text-primary" },
    { time: "2 hours ago", desc: "Payment received for BK-20231", icon: DollarSign, color: "text-success" },
    { time: "3 hours ago", desc: "Guest checked in to Room 308", icon: LogIn, color: "text-tasks" },
  ];

  const ratings = [
    { name: "Cleanliness", score: 9.2 },
    { name: "Facilities", score: 8.8 },
    { name: "Location", score: 9.5 },
    { name: "Service", score: 9.0 },
    { name: "Value", score: 8.5 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
                  <h3 className="text-3xl font-bold">{kpi.value}</h3>
                  <div className="flex items-center gap-1 mt-2">
                    {kpi.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span className={`text-sm font-medium ${kpi.trend === "up" ? "text-success" : "text-destructive"}`}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${kpi.bgColor}`}>
                  <Icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Main Charts (3/4 width) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Charts Row 1: Guests & Revenue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Guests</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={guestsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-muted-foreground" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <YAxis className="text-muted-foreground" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                  <Line type="monotone" dataKey="guests" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue (in thousands)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: 'hsl(var(--success))', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Charts Row 2: Bookings & Platform */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Bookings</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={bookingsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                  <Legend />
                  <Bar dataKey="booked" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="canceled" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Bookings by Platform</h3>
                <Select value={platformPeriod} onValueChange={setPlatformPeriod}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="This Week" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0 relative">
                  <ResponsiveContainer width={280} height={280}>
                    <PieChart>
                      <Pie
                        data={platformData}
                        cx="50%"
                        cy="50%"
                        innerRadius={85}
                        outerRadius={115}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {platformData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-muted-foreground text-sm">Total Books</p>
                    <p className="text-3xl font-bold">{totalBooks.toLocaleString()}</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">{periodLabels[platformPeriod]}: {lastPeriodBooks.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  {platformData.map((platform: any) => (
                    <div key={platform.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: platform.color }}></div>
                        <span className="text-muted-foreground text-sm">{platform.name} ({platform.value})</span>
                      </div>
                      <span className="font-semibold text-lg">{platform.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Booking List Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Booking List</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Guest Name</TableHead>
                  <TableHead>Room Type</TableHead>
                  <TableHead>Room No</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsList.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.id}</TableCell>
                    <TableCell>{booking.guest}</TableCell>
                    <TableCell>{booking.roomType}</TableCell>
                    <TableCell>{booking.roomNo}</TableCell>
                    <TableCell>{booking.duration}</TableCell>
                    <TableCell>{booking.checkIn}</TableCell>
                    <TableCell>{booking.checkOut}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          booking.status === "Confirmed"
                            ? "default"
                            : booking.status === "Checked In"
                            ? "default"
                            : booking.status === "Pending"
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          booking.status === "Confirmed"
                            ? "bg-success/15 text-success hover:bg-success/15 border-0"
                            : booking.status === "Checked In"
                            ? "bg-primary/15 text-primary hover:bg-primary/15 border-0"
                            : booking.status === "Pending"
                            ? "bg-warning/15 text-warning hover:bg-warning/15 border-0"
                            : "bg-muted text-muted-foreground hover:bg-muted border-0"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Right Column - Room Occupancy, Ratings & Activity (1/4 width) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Room Occupancy */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Room Occupancy</h3>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-4xl font-bold">156</span>
                <span className="text-sm text-muted-foreground">Total Rooms</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-success" />
                  <span className="text-sm text-muted-foreground">Occupied</span>
                </div>
                <span className="font-semibold">124</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Available</span>
                </div>
                <span className="font-semibold">18</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-secondary" />
                  <span className="text-sm text-muted-foreground">Reserved</span>
                </div>
                <span className="font-semibold">10</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Not Ready</span>
                </div>
                <span className="font-semibold">4</span>
              </div>
            </div>
          </Card>

          {/* Overall Ratings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Overall Ratings</h3>
            <div className="mb-6">
              <div className="text-5xl font-bold">8.9</div>
              <div className="text-sm text-muted-foreground mt-1">Excellent</div>
            </div>
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div key={rating.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">{rating.name}</span>
                    <span className="text-sm font-medium">{rating.score}</span>
                  </div>
                  <Progress value={rating.score * 10} className="h-2" />
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.desc}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
