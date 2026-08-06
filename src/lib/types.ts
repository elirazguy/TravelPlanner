// Client-facing serialized shapes (dates as ISO strings).

export interface EventDTO {
  id: string;
  dayId: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  category: string;
  locationName: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  placeId: string | null;
  orderIndex: number;
}

export interface SavedPlaceDTO {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  placeId: string | null;
  category: string | null;
  listName: string | null;
  note: string | null;
  assignedDayId: string | null;
}

export interface DayDTO {
  id: string;
  date: string;
  dayNumber: number;
  colorHex: string;
  notes: string | null;
  events: EventDTO[];
  savedPlaces: SavedPlaceDTO[];
}

export interface DocumentDTO {
  id: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileType: string;
  sizeBytes: number;
  tag: string;
  uploadedAt: string;
}

export interface HotelDTO {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  confirmationNumber: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
}

export interface FlightDTO {
  id: string;
  flightNumber: string;
  airline: string | null;
  departureAirport: string | null;
  arrivalAirport: string | null;
  flightDate: string;
  notes: string | null;
}

export interface TransportationDTO {
  id: string;
  type: string;
  date: string | null;
  fromLocation: string | null;
  toLocation: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  company: string | null;
  reference: string | null;
  vehicle: string | null;
  documents: string | null;
  contactName: string | null;
  contactPhone: string | null;
  notes: string | null;
}

export interface PackingItemDTO {
  id: string;
  text: string;
  order: number;
}

export interface TripDTO {
  id: string;
  title: string;
  destination: string;
  country: string;
  coverImage: string | null;
  startDate: string;
  endDate: string;
  status: string;
  isPublic?: boolean;
  cloneCount?: number;
  notes: string | null;
  mapCenterLat: number | null;
  mapCenterLng: number | null;
  days: DayDTO[];
  documents: DocumentDTO[];
  hotels: HotelDTO[];
  flights: FlightDTO[];
  transportation: TransportationDTO[];
  savedPlaces: SavedPlaceDTO[];
}
