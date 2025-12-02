export interface CloudbedsConfig {
  clientId: string;
  clientSecret: string;
  propertyId: string;
  apiKey: string;
  apiUrl: string;
  enabled: boolean;
}

export interface CloudbedsRoomType {
  roomTypeID: string;
  roomTypeName: string;
  roomTypeNameShort: string;
  roomTypeDescription: string;
  maxGuests: number;
  maxAdults?: number;
  maxChildren?: number;
  adultsIncluded?: number;
  childrenIncluded?: number;
  defaultDailyRate?: number;
  roomsTotal?: number;
  roomSize?: number;
  bedType?: string;
  roomTypeUnits?: number; // Cantidad de habitaciones de este tipo
  roomTypePhotos?: string[]; // Array de URLs de fotos
  roomTypeFeatures?: Record<string, string>; // Amenities como objeto
  roomAmenities?: string[];
  isPrivate?: boolean;
  roomsAvailable?: number;
}

export interface CloudbedsPhoto {
  photoID: string;
  photoURL: string;
  photoCategory: string;
  photoDescription: string;
}

export interface CloudbedsAvailability {
  roomTypeID: string;
  roomTypeName: string;
  roomsAvailable: number;
  roomRate: number;
  roomRateTotal: number;
  currency: string;
  rateDetails: RateDetail[];
}

export interface RateDetail {
  date: string;
  rate: number;
  available: number;
}

export interface CloudbedsReservation {
  reservationID?: string;
  startDate: string;
  endDate: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestCountry: string; // ISO-2 code (ej: 'VE', 'US')
  guestZip: string;
  guestPhone?: string;
  guestGender?: 'male' | 'female' | 'other';
  estimatedArrivalTime?: string; // Formato 24 horas (ej: '15:00')

  // Arrays de habitaciones
  rooms: Array<{
    roomTypeID: string;
    quantity: number;
    roomRateID?: string;
    roomID?: string;
  }>;

  // Arrays de adultos por habitación
  adults: Array<{
    roomTypeID: string;
    quantity: number;
    roomID?: string;
  }>;

  // Arrays de niños por habitación (requerido por Cloudbeds)
  children: Array<{
    roomTypeID: string;
    quantity: number;
    roomID?: string;
  }>;

  paymentMethod: string; // 'cash', 'credit', 'bank_transfer', etc.
  cardToken?: string; // Para Stripe
  paymentAuthorizationCode?: string; // Para Stripe

  promoCode?: string;
  allotmentBlockCode?: string;
  customFields?: Array<{
    fieldName: string;
    fieldValue: string;
  }>;

  specialRequests?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

export interface CloudbedsApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

export interface RoomAvailabilityQuery {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  children?: number;
}

export interface DynamicPricingResponse {
  roomId: string;
  basePrice: number;
  dynamicPrice: number;
  currency: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  totalPrice: number;
  breakdown: Array<{
    date: string;
    price: number;
  }>;
}

// Calendar availability response from Cloudbeds availability_calendar endpoint
export interface CalendarRateEntry {
  package_id: string;
  association_id: string;
  rate_id: string;
  room_type_id: string;
  rate: string;
  min_l: number;
  max_l: number;
  cta: number;
  ctd: number;
  avail: number;
  closed: number;
}

export interface CalendarData {
  [date: string]: CalendarRateEntry[];
}

// Interfaz para huéspedes de Cloudbeds (getGuestList response)
export interface CloudbedsGuest {
  guestID: string;
  guestFirstName: string;
  guestLastName: string;
  guestGender?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestCellPhone?: string;
  guestCountry?: string;
  guestAddress?: string;
  guestCity?: string;
  guestState?: string;
  guestZip?: string;
  guestBirthDate?: string;
  guestDocumentType?: string;
  guestDocumentNumber?: string;
  guestDocumentIssueDate?: string;
  guestDocumentIssuingCountry?: string;
  guestDocumentExpirationDate?: string;
  guestTaxID?: string;
  guestCompanyName?: string;
  guestCompanyTaxID?: string;
  isMainGuest?: boolean;
}
