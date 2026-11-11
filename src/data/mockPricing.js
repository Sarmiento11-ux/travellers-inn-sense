export const mockPricingRecommendations = [
  {
    id: 1,
    roomId: 1,
    roomType: "Standard",
    currentPrice: 1500,
    suggestedPrice: 1750,
    demandLevel: "High",
    occupancyRate: "85%",
    factors: ["Upcoming local festival", "High historical bookings for this week", "Only 2 standard rooms left"],
    date: "2026-10-04",
    status: "Pending"
  },
  {
    id: 2,
    roomId: 3,
    roomType: "Suite",
    currentPrice: 4000,
    suggestedPrice: 3600,
    demandLevel: "Low",
    occupancyRate: "30%",
    factors: ["Off-peak season", "Low historical demand", "Multiple suites available"],
    date: "2026-10-03",
    status: "Approved"
  },
  {
    id: 3,
    roomId: 2,
    roomType: "Deluxe",
    currentPrice: 2500,
    suggestedPrice: 2500,
    demandLevel: "Moderate",
    occupancyRate: "60%",
    factors: ["Stable demand", "Average occupancy"],
    date: "2026-10-04",
    status: "Rejected"
  }
];
