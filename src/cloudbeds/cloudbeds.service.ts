import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import {
  CloudbedsRoomType,
  CloudbedsAvailability,
  CloudbedsReservation,
  CloudbedsApiResponse,
  DynamicPricingResponse,
} from './interfaces/cloudbeds.interface';

@Injectable()
export class CloudbedsService {
  private readonly logger = new Logger(CloudbedsService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly propertyId: string;
  private readonly enabled: boolean;
  private readonly cacheTTL: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.apiUrl = this.configService.get<string>('CLOUDBEDS_API_URL');
    this.apiKey = this.configService.get<string>('CLOUDBEDS_API_KEY');
    this.propertyId = this.configService.get<string>('CLOUDBEDS_PROPERTY_ID');
    this.enabled = this.configService.get<boolean>('CLOUDBEDS_ENABLED', true);
    this.cacheTTL = this.configService.get<number>('CLOUDBEDS_CACHE_TTL', 300); // 5 minutes default

    if (this.enabled) {
      this.logger.log('Cloudbeds integration ENABLED');
      this.logger.log(`Property ID: ${this.propertyId}`);
    } else {
      this.logger.warn('Cloudbeds integration DISABLED');
    }
  }

  /**
   * Verificar si la integración está habilitada
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Obtener todos los tipos de habitación desde Cloudbeds
   */
  async getAllRoomTypes(): Promise<CloudbedsRoomType[]> {
    if (!this.enabled) {
      this.logger.debug('Cloudbeds disabled, skipping room types fetch');
      return [];
    }

    const cacheKey = 'cloudbeds:room_types';

    try {
      // Verificar cache
      const cached = await this.cacheManager.get<CloudbedsRoomType[]>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached room types');
        return cached;
      }

      // Llamar a la API
      this.logger.log(`Calling Cloudbeds API: ${this.apiUrl}/getRoomTypes with propertyID: ${this.propertyId}`);

      const response = await firstValueFrom(
        this.httpService.get<CloudbedsApiResponse<CloudbedsRoomType[]>>(
          `${this.apiUrl}/getRoomTypes`,
          {
            headers: this.getHeaders(),
            params: {
              propertyID: this.propertyId,
            },
          },
        ),
      );

      this.logger.log(`Cloudbeds API response status: ${response.status}`);
      this.logger.log(`Cloudbeds API response data: ${JSON.stringify(response.data)}`);

      const roomTypes = response.data.data || [];

      // Guardar en cache (24 horas - la info de tipos de habitación no cambia frecuentemente)
      await this.cacheManager.set(cacheKey, roomTypes, 86400000);

      this.logger.log(`Fetched ${roomTypes.length} room types from Cloudbeds`);
      return roomTypes;
    } catch (error) {
      this.handleError(error, 'Error fetching room types from Cloudbeds');
    }
  }

  /**
   * Verificar disponibilidad para un rango de fechas
   */
  async checkAvailability(
    startDate: string,
    endDate: string,
    adults: number = 2,
    children: number = 0,
    rooms: number = 1,
    promoCode?: string,
    detailedRates: boolean = true,
  ): Promise<CloudbedsAvailability[]> {
    if (!this.enabled) {
      this.logger.debug('Cloudbeds disabled, returning empty availability');
      return [];
    }

    const cacheKey = `cloudbeds:availability:${startDate}:${endDate}:${adults}:${children}:${rooms}:${promoCode || 'none'}`;

    try {
      // Verificar cache (5 minutos - la disponibilidad cambia frecuentemente)
      const cached = await this.cacheManager.get<CloudbedsAvailability[]>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached availability');
        return cached;
      }

      // Construir parámetros
      const params: any = {
        propertyID: this.propertyId,
        startDate,
        endDate,
        adults,
        children,
        rooms,
      };

      if (promoCode) {
        params.promoCode = promoCode;
      }

      if (detailedRates) {
        params.detailedRates = 'true';
      }

      // Llamar a la API
      const response = await firstValueFrom(
        this.httpService.get<any>(
          `${this.apiUrl}/getAvailableRoomTypes`,
          {
            headers: this.getHeaders(),
            params,
          },
        ),
      );

      this.logger.log(`Raw Cloudbeds response: ${JSON.stringify(response.data)}`);

      // Transformar la respuesta de Cloudbeds al formato esperado
      let availability: CloudbedsAvailability[] = [];

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        const propertyData = response.data.data[0];

        if (propertyData.propertyRooms && Array.isArray(propertyData.propertyRooms)) {
          availability = propertyData.propertyRooms.map((room: any) => ({
            roomTypeID: room.roomTypeID,
            roomTypeName: room.roomTypeName,
            roomsAvailable: room.roomsAvailable || 0,
            roomRate: room.roomRate || 0,
            roomRateTotal: room.roomRate * this.calculateNights(startDate, endDate) || 0,
            currency: propertyData.propertyCurrency?.currencyCode || 'USD',
            rateDetails: room.roomRateDetailed?.map((detail: any) => ({
              date: detail.date,
              rate: detail.rate || detail.base_rate || 0,
              available: room.roomsAvailable || 0,
            })) || [],
          }));
        }
      }

      // Guardar en cache
      await this.cacheManager.set(cacheKey, availability, this.cacheTTL * 1000);

      this.logger.log(
        `Checked availability for ${startDate} to ${endDate}: ${availability.length} rooms available`,
      );
      return availability;
    } catch (error) {
      this.handleError(error, 'Error checking availability from Cloudbeds');
    }
  }

  /**
   * Verificar disponibilidad de una habitación específica
   */
  async checkRoomAvailability(
    roomTypeId: string,
    startDate: string,
    endDate: string,
    adults: number = 2,
    children: number = 0,
    rooms: number = 1,
    promoCode?: string,
  ): Promise<{
    available: boolean;
    roomsAvailable: number;
    rate: number;
    totalRate: number;
    currency: string;
    details?: CloudbedsAvailability;
  }> {
    try {
      const availability = await this.checkAvailability(
        startDate,
        endDate,
        adults,
        children,
        rooms,
        promoCode,
        true,
      );

      const roomAvailable = availability.find(
        (room) => room.roomTypeID === roomTypeId,
      );

      if (roomAvailable && roomAvailable.roomsAvailable > 0) {
        return {
          available: true,
          roomsAvailable: roomAvailable.roomsAvailable,
          rate: roomAvailable.roomRate,
          totalRate: roomAvailable.roomRateTotal,
          currency: roomAvailable.currency,
          details: roomAvailable,
        };
      }

      return {
        available: false,
        roomsAvailable: 0,
        rate: 0,
        totalRate: 0,
        currency: 'USD',
      };
    } catch (error) {
      this.logger.error('Error checking room availability', error);
      // En caso de error, devolver resultado conservador (no disponible)
      return {
        available: false,
        roomsAvailable: 0,
        rate: 0,
        totalRate: 0,
        currency: 'USD',
      };
    }
  }

  /**
   * Obtener precios dinámicos para una habitación
   */
  async getDynamicPricing(
    roomTypeId: string,
    startDate: string,
    endDate: string,
  ): Promise<DynamicPricingResponse | null> {
    if (!this.enabled) {
      return null;
    }

    const cacheKey = `cloudbeds:pricing:${roomTypeId}:${startDate}:${endDate}`;

    try {
      const cached = await this.cacheManager.get<DynamicPricingResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      const availability = await this.checkRoomAvailability(
        roomTypeId,
        startDate,
        endDate,
      );

      if (!availability.available) {
        return null;
      }

      const nights = this.calculateNights(startDate, endDate);
      const avgNightlyRate = availability.totalRate / nights;

      const pricing: DynamicPricingResponse = {
        roomId: roomTypeId,
        basePrice: availability.rate,
        dynamicPrice: avgNightlyRate,
        currency: availability.currency,
        checkInDate: startDate,
        checkOutDate: endDate,
        totalNights: nights,
        totalPrice: availability.totalRate,
        breakdown: availability.details?.rateDetails?.map(detail => ({
          date: detail.date,
          price: detail.rate,
        })) || [],
      };

      // Cache por 30 minutos
      await this.cacheManager.set(cacheKey, pricing, 1800000);

      return pricing;
    } catch (error) {
      this.logger.error('Error fetching dynamic pricing', error);
      return null;
    }
  }

  /**
   * Crear reserva en Cloudbeds
   * IMPORTANTE: Cloudbeds API requiere application/x-www-form-urlencoded, NO JSON
   */
  async createReservation(
    reservationData: CloudbedsReservation,
  ): Promise<{ success: boolean; reservationId?: string; message?: string }> {
    if (!this.enabled) {
      this.logger.warn('Cloudbeds disabled, skipping reservation creation');
      return { success: false, message: 'Cloudbeds integration is disabled' };
    }

    try {
      // Construir FormData (URLSearchParams para form-urlencoded)
      const formData = new URLSearchParams();

      // Property ID
      formData.append('propertyID', this.propertyId);

      // Datos básicos
      formData.append('startDate', reservationData.startDate);
      formData.append('endDate', reservationData.endDate);
      formData.append('guestFirstName', reservationData.guestFirstName);
      formData.append('guestLastName', reservationData.guestLastName);
      formData.append('guestEmail', reservationData.guestEmail);
      formData.append('guestCountry', reservationData.guestCountry);
      formData.append('guestZip', reservationData.guestZip);

      // Opcionales
      if (reservationData.guestPhone) formData.append('guestPhone', reservationData.guestPhone);
      if (reservationData.guestGender) formData.append('guestGender', reservationData.guestGender);
      if (reservationData.estimatedArrivalTime) formData.append('estimatedArrivalTime', reservationData.estimatedArrivalTime);

      // Arrays de habitaciones
      reservationData.rooms.forEach((room, i) => {
        formData.append(`rooms[${i}][roomTypeID]`, room.roomTypeID);
        formData.append(`rooms[${i}][quantity]`, room.quantity.toString());
        if (room.roomRateID) formData.append(`rooms[${i}][roomRateID]`, room.roomRateID);
        if (room.roomID) formData.append(`rooms[${i}][roomID]`, room.roomID);
      });

      // Arrays de adultos
      reservationData.adults.forEach((adult, i) => {
        formData.append(`adults[${i}][roomTypeID]`, adult.roomTypeID);
        formData.append(`adults[${i}][quantity]`, adult.quantity.toString());
        if (adult.roomID) formData.append(`adults[${i}][roomID]`, adult.roomID);
      });

      // Arrays de niños
      if (reservationData.children && reservationData.children.length > 0) {
        reservationData.children.forEach((child, i) => {
          formData.append(`children[${i}][roomTypeID]`, child.roomTypeID);
          formData.append(`children[${i}][quantity]`, child.quantity.toString());
          if (child.roomID) formData.append(`children[${i}][roomID]`, child.roomID);
        });
      }

      // Pago
      formData.append('paymentMethod', reservationData.paymentMethod);
      if (reservationData.cardToken) formData.append('cardToken', reservationData.cardToken);
      if (reservationData.paymentAuthorizationCode) formData.append('paymentAuthorizationCode', reservationData.paymentAuthorizationCode);

      // Promo code
      if (reservationData.promoCode) formData.append('promoCode', reservationData.promoCode);
      if (reservationData.allotmentBlockCode) formData.append('allotmentBlockCode', reservationData.allotmentBlockCode);

      // Campos personalizados
      if (reservationData.customFields) {
        reservationData.customFields.forEach((field, i) => {
          formData.append(`customFields[${i}][fieldName]`, field.fieldName);
          formData.append(`customFields[${i}][fieldValue]`, field.fieldValue);
        });
      }

      this.logger.debug('Sending reservation to Cloudbeds with form-urlencoded');

      const response = await firstValueFrom(
        this.httpService.post<CloudbedsApiResponse<{ reservationID: string }>>(
          `${this.apiUrl}/postReservation`,
          formData.toString(),
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      if (response.data.success) {
        this.logger.log(`Reservation created: ${response.data.data.reservationID}`);
        return {
          success: true,
          reservationId: response.data.data.reservationID,
        };
      }

      return {
        success: false,
        message: response.data.message || 'Failed to create reservation',
      };
    } catch (error) {
      this.logger.error('Error creating reservation in Cloudbeds', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error connecting to Cloudbeds',
      };
    }
  }

  /**
   * Calcular número de noches entre dos fechas
   */
  private calculateNights(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtener headers para las peticiones a Cloudbeds
   */
  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: any, message: string): never {
    this.logger.error(message);
    this.logger.error(`Error details: ${JSON.stringify(error)}`);

    if (error.response) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status || 500;
      const errorMessage =
        (axiosError.response?.data as any)?.message || message;

      this.logger.error(`HTTP Status: ${status}`);
      this.logger.error(`Response data: ${JSON.stringify(axiosError.response?.data)}`);

      if (status === 401) {
        throw new HttpException(
          'Invalid Cloudbeds API credentials',
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (status === 403) {
        throw new HttpException(
          'Insufficient permissions for Cloudbeds API',
          HttpStatus.FORBIDDEN,
        );
      }
      if (status === 429) {
        throw new HttpException(
          'Cloudbeds API rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(errorMessage, status);
    }

    throw new HttpException(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
