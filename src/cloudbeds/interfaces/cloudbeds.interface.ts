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
  maxAdults: number;
  maxChildren: number;
  defaultDailyRate: number;
  roomsTotal: number;
  roomSize: number;
  bedType: string;
  roomTypePhotos?: CloudbedsPhoto[];
  roomAmenities?: string[];
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

  // Arrays de niños por habitación (opcional)
  children?: Array<{
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
