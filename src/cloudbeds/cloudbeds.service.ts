import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import {
  CloudbedsRoomType,
  CloudbedsAvailability,
  CloudbedsReservation,
  CloudbedsApiResponse,
  DynamicPricingResponse,
  CalendarData,
  CloudbedsGuest,
  CloudbedsReservationResponse,
} from './interfaces/cloudbeds.interface';
import { Room, RoomStatus } from '../rooms/entities/room.entity';
import { Client } from '../clients/entities/client.entity';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';

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
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(Client) private readonly clientRepository: Repository<Client>,
    @InjectRepository(Reservation) private readonly reservationRepository: Repository<Reservation>,
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

      // No asignar habitación automáticamente - el staff la asignará después
      formData.append('assignRoom', 'false');

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

      // Arrays de niños (siempre requerido por Cloudbeds)
      reservationData.children.forEach((child, i) => {
        formData.append(`children[${i}][roomTypeID]`, child.roomTypeID);
        formData.append(`children[${i}][quantity]`, child.quantity.toString());
        if (child.roomID) formData.append(`children[${i}][roomID]`, child.roomID);
      });

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

      // Solicitudes especiales (se envía como nota de reservación)
      if (reservationData.specialRequests) {
        formData.append('reservationNote', reservationData.specialRequests);
      }

      this.logger.debug('Sending reservation to Cloudbeds with form-urlencoded');
      this.logger.debug(`FormData: ${formData.toString()}`);

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

      this.logger.log(`Cloudbeds response: ${JSON.stringify(response.data)}`);

      if (response.data.success) {
        // La respuesta puede tener reservationID directamente en data o anidado
        const responseData = response.data as any;
        const reservationId = responseData.data?.reservationID || responseData.reservationID;
        this.logger.log(`Reservation created: ${reservationId}`);

        // Actualizar estado a "not_confirmed" (Pendiente de Confirmación)
        // postReservation no acepta el parámetro status, pero putReservation sí
        try {
          const updateFormData = new URLSearchParams();
          updateFormData.append('propertyID', this.propertyId);
          updateFormData.append('reservationID', reservationId);
          updateFormData.append('status', 'not_confirmed');

          await firstValueFrom(
            this.httpService.put(
              `${this.apiUrl}/putReservation`,
              updateFormData.toString(),
              {
                headers: {
                  Authorization: `Bearer ${this.apiKey}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
              },
            ),
          );
          this.logger.log(`Reservation ${reservationId} status updated to not_confirmed`);
        } catch (updateError) {
          // Si falla la actualización del estado, la reserva ya está creada
          // Solo registrar el error pero no fallar la operación
          this.logger.warn(`Could not update reservation status to not_confirmed: ${updateError.message}`);
        }

        // Crear registro local de la reservación
        try {
          await this.createLocalReservation(reservationData, reservationId);
          this.logger.log(`Local reservation created for Cloudbeds reservation ${reservationId}`);
        } catch (localError) {
          // Si falla la creación local, la reserva ya está en Cloudbeds
          // Solo registrar el error pero no fallar la operación
          this.logger.warn(`Could not create local reservation: ${localError.message}`);
        }

        return {
          success: true,
          reservationId: reservationId,
        };
      }

      return {
        success: false,
        message: response.data.message || 'Failed to create reservation',
      };
    } catch (error) {
      this.logger.error('Error creating reservation in Cloudbeds');
      this.logger.error(`Error status: ${error.response?.status}`);
      this.logger.error(`Error data: ${JSON.stringify(error.response?.data)}`);
      this.logger.error(`Error message: ${error.message}`);
      return {
        success: false,
        message: error.response?.data?.message || 'Error connecting to Cloudbeds',
      };
    }
  }

  /**
   * Crear registro local de la reservación después de crearla en Cloudbeds
   * Esto permite que las reservaciones aparezcan en el panel de administración
   */
  private async createLocalReservation(
    reservationData: CloudbedsReservation,
    cloudbedsReservationId: string,
  ): Promise<void> {
    // Buscar o crear el cliente local
    const guestEmail = reservationData.guestEmail?.toLowerCase().trim();
    const guestName = `${reservationData.guestFirstName} ${reservationData.guestLastName}`.trim();
    const guestPhone = reservationData.guestPhone || '';

    let client = await this.clientRepository.findOne({
      where: { email: guestEmail },
    });

    if (!client) {
      // Crear nuevo cliente
      client = this.clientRepository.create({
        fullName: guestName,
        email: guestEmail,
        phone: guestPhone,
        country: reservationData.guestCountry,
        zip: reservationData.guestZip,
      });
      client = await this.clientRepository.save(client);
      this.logger.log(`Created new client: ${client.fullName} (${client.id})`);
    }

    // Buscar la habitación local por cloudbedsRoomTypeID
    const roomTypeID = reservationData.rooms[0]?.roomTypeID;
    if (!roomTypeID) {
      throw new Error('No room type ID found in reservation data');
    }

    const room = await this.roomRepository.findOne({
      where: { cloudbedsRoomTypeID: roomTypeID },
    });

    if (!room) {
      throw new Error(`Room with cloudbedsRoomTypeID ${roomTypeID} not found locally`);
    }

    // Calcular totales
    const totalAdults = reservationData.adults.reduce((sum, a) => sum + a.quantity, 0);
    const totalChildren = reservationData.children?.reduce((sum, c) => sum + c.quantity, 0) || 0;

    // Parsear fechas como locales
    const [startYear, startMonth, startDay] = reservationData.startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = reservationData.endDate.split('-').map(Number);
    const checkInDate = new Date(startYear, startMonth - 1, startDay);
    const checkOutDate = new Date(endYear, endMonth - 1, endDay);

    // Calcular precio total
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = Number(room.price) * nights * reservationData.rooms[0].quantity;

    // Crear la reservación local
    const reservation = this.reservationRepository.create({
      clientId: client.id,
      roomId: room.id,
      checkInDate,
      checkOutDate,
      numberOfAdults: totalAdults,
      numberOfChildren: totalChildren,
      specialRequests: reservationData.specialRequests || '',
      totalPrice,
      status: ReservationStatus.PENDING,
      cloudbedsReservationID: cloudbedsReservationId,
    });

    await this.reservationRepository.save(reservation);
    this.logger.log(`Local reservation created: ${reservation.id} linked to Cloudbeds ${cloudbedsReservationId}`);
  }

  /**
   * Obtener calendario de disponibilidad con precios
   * Usa la API oficial de Cloudbeds (getAvailableRoomTypes con detailedRates)
   * Hace UNA sola llamada para todo el rango y extrae los precios de rateDetails
   */
  async getCalendarAvailability(
    startDate: string,
    endDate: string,
  ): Promise<CalendarData> {
    if (!this.enabled) {
      this.logger.debug('Cloudbeds disabled, returning empty calendar');
      return {};
    }

    const cacheKey = `cloudbeds:calendar:${startDate}:${endDate}`;

    try {
      // Verificar cache (10 minutos)
      const cached = await this.cacheManager.get<CalendarData>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached calendar data');
        return cached;
      }

      this.logger.log(`Building calendar data from API for ${startDate} to ${endDate}`);

      // Hacer UNA sola llamada para todo el rango de fechas
      const availability = await this.checkAvailability(
        startDate,
        endDate,
        2, // adults
        0, // children
        1, // rooms
        undefined, // promoCode
        true, // detailedRates - esto nos da los precios por día
      );

      this.logger.log(`Got availability for ${availability.length} room types`);

      // Construir el calendario desde rateDetails de cada habitación
      const calendarData: CalendarData = {};

      // Procesar cada tipo de habitación
      for (const room of availability) {
        if (room.rateDetails && room.rateDetails.length > 0) {
          // Cada rateDetail tiene { date, rate, available }
          for (const detail of room.rateDetails) {
            const date = detail.date;

            if (!calendarData[date]) {
              calendarData[date] = [];
            }

            // Agregar entrada para este tipo de habitación en esta fecha
            calendarData[date].push({
              package_id: '',
              association_id: '',
              rate_id: room.roomTypeID,
              room_type_id: room.roomTypeID,
              rate: detail.rate.toString(),
              min_l: 1,
              max_l: 30,
              cta: 0,
              ctd: 0,
              avail: detail.available || room.roomsAvailable,
              closed: (detail.available || room.roomsAvailable) > 0 ? 0 : 1,
            });
          }
        }
      }

      this.logger.log(`Calendar data built with ${Object.keys(calendarData).length} dates`);

      // Guardar en cache (10 minutos)
      await this.cacheManager.set(cacheKey, calendarData, 600000);

      return calendarData;
    } catch (error) {
      this.logger.error('Error building calendar data');
      this.logger.error(`Error details: ${error.message}`);
      return {};
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

  /**
   * Sincronizar habitaciones de Cloudbeds con la base de datos local
   * - Obtiene todas las habitaciones de Cloudbeds
   * - Para cada una, busca si existe en la BD local (por cloudbedsRoomTypeID)
   * - Si existe: actualiza nombre, precio, descripción, capacidad (NO toca videoUrl ni imágenes personalizadas)
   * - Si no existe: crea la habitación con los datos de Cloudbeds
   * - Retorna un resumen de la sincronización
   */
  async syncRoomsFromCloudbeds(): Promise<{
    success: boolean;
    created: number;
    updated: number;
    deleted: number;
    total: number;
    rooms: Array<{ name: string; action: 'created' | 'updated'; cloudbedsRoomTypeID: string }>;
  }> {
    if (!this.enabled) {
      throw new HttpException('Cloudbeds integration is disabled', HttpStatus.SERVICE_UNAVAILABLE);
    }

    this.logger.log('Starting room synchronization from Cloudbeds...');

    try {
      // Obtener tipos de habitación de Cloudbeds
      const cloudbedsRooms = await this.getAllRoomTypes();

      // Obtener precios del endpoint de availability (para una noche mañana)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const startDate = tomorrow.toISOString().split('T')[0];
      const endDate = dayAfter.toISOString().split('T')[0];

      this.logger.log(`Fetching prices from availability endpoint: ${startDate} to ${endDate}`);
      const availability = await this.checkAvailability(startDate, endDate, 2, 0, 1);

      // Crear un mapa de precios por roomTypeID
      const priceMap = new Map<string, number>();
      for (const room of availability) {
        priceMap.set(room.roomTypeID, room.roomRate);
        this.logger.log(`Price for ${room.roomTypeName} (${room.roomTypeID}): $${room.roomRate}`);
      }

      const syncResults: Array<{ name: string; action: 'created' | 'updated'; cloudbedsRoomTypeID: string }> = [];
      let created = 0;
      let updated = 0;

      for (const cbRoom of cloudbedsRooms) {
        // Buscar si ya existe en la BD local
        const existingRoom = await this.roomRepository.findOne({
          where: { cloudbedsRoomTypeID: cbRoom.roomTypeID },
        });

        // Limpiar HTML de la descripción
        const cleanDescription = cbRoom.roomTypeDescription
          ? cbRoom.roomTypeDescription.replace(/<[^>]*>/g, '').trim()
          : '';

        // Extraer amenities del objeto roomTypeFeatures
        const amenities: string[] = cbRoom.roomTypeFeatures
          ? Object.values(cbRoom.roomTypeFeatures)
          : [];

        // Determinar tipo de cama basado en el nombre
        let bedType = '1 Cama';
        const nameLower = cbRoom.roomTypeName.toLowerCase();
        if (nameLower.includes('king')) {
          bedType = '1 Cama King Size';
        } else if (nameLower.includes('queen')) {
          bedType = '1 Cama Queen Size';
        } else if (nameLower.includes('francisky')) {
          bedType = '1 Cama Queen + Litera';
        } else if (nameLower.includes('noronky')) {
          bedType = '2 Camas Dobles';
        }

        // Obtener precio del mapa (availability endpoint)
        const roomPrice = priceMap.get(cbRoom.roomTypeID) || 0;

        if (existingRoom) {
          // Actualizar habitación existente (sin tocar videoUrl ni imágenes personalizadas)
          existingRoom.name = cbRoom.roomTypeName;
          existingRoom.description = cleanDescription;
          existingRoom.maxGuests = cbRoom.maxGuests;
          existingRoom.capacity = `Max ${cbRoom.maxGuests} Huéspedes`;
          existingRoom.roomCount = cbRoom.roomTypeUnits || 1;
          existingRoom.bed = bedType;
          existingRoom.amenities = amenities;
          existingRoom.type = cbRoom.roomTypeNameShort || 'Estándar';

          // Actualizar precio desde Cloudbeds availability
          if (roomPrice > 0) {
            existingRoom.price = roomPrice;
            existingRoom.originalPrice = roomPrice;
          }

          // Actualizar imágenes de Cloudbeds SOLO si no tiene imágenes personalizadas
          if ((!existingRoom.images || existingRoom.images.length === 0) && cbRoom.roomTypePhotos) {
            existingRoom.images = cbRoom.roomTypePhotos;
          }

          await this.roomRepository.save(existingRoom);

          syncResults.push({
            name: cbRoom.roomTypeName,
            action: 'updated',
            cloudbedsRoomTypeID: cbRoom.roomTypeID,
          });
          updated++;

          this.logger.log(`Updated room: ${cbRoom.roomTypeName} (${cbRoom.roomTypeID}) - Price: $${roomPrice}`);
        } else {
          // Crear nueva habitación
          const newRoom = this.roomRepository.create({
            name: cbRoom.roomTypeName,
            roomNumber: cbRoom.roomTypeNameShort || `CB-${cbRoom.roomTypeID.slice(-4)}`,
            type: cbRoom.roomTypeNameShort || 'Estándar',
            description: cleanDescription,
            maxGuests: cbRoom.maxGuests,
            capacity: `Max ${cbRoom.maxGuests} Huéspedes`,
            bed: bedType,
            amenities: amenities,
            images: cbRoom.roomTypePhotos || [],
            roomCount: cbRoom.roomTypeUnits || 1,
            cloudbedsRoomTypeID: cbRoom.roomTypeID,
            status: RoomStatus.AVAILABLE,
            price: roomPrice,
            originalPrice: roomPrice,
          });

          await this.roomRepository.save(newRoom);

          syncResults.push({
            name: cbRoom.roomTypeName,
            action: 'created',
            cloudbedsRoomTypeID: cbRoom.roomTypeID,
          });
          created++;

          this.logger.log(`Created room: ${cbRoom.roomTypeName} (${cbRoom.roomTypeID})`);
        }
      }

      // Eliminar habitaciones que no están sincronizadas con Cloudbeds
      const cloudbedsRoomTypeIDs = cloudbedsRooms.map(r => r.roomTypeID);

      // Obtener todas las habitaciones locales y filtrar las que no están sincronizadas
      const allLocalRooms = await this.roomRepository.find();
      const toDelete = allLocalRooms.filter(room =>
        !room.cloudbedsRoomTypeID || !cloudbedsRoomTypeIDs.includes(room.cloudbedsRoomTypeID)
      );

      let deleted = 0;
      for (const room of toDelete) {
        this.logger.log(`Deleting non-synced room: ${room.name} (ID: ${room.id})`);
        await this.roomRepository.remove(room);
        deleted++;
      }

      this.logger.log(`Synchronization completed: ${created} created, ${updated} updated, ${deleted} deleted`);

      return {
        success: true,
        created,
        updated,
        deleted,
        total: cloudbedsRooms.length,
        rooms: syncResults,
      };
    } catch (error) {
      this.logger.error('Error synchronizing rooms from Cloudbeds');
      this.logger.error(error);
      throw new HttpException(
        'Error synchronizing rooms from Cloudbeds: ' + (error.message || 'Unknown error'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtener lista de huéspedes desde Cloudbeds
   * Usa el endpoint getGuestList para obtener todos los huéspedes
   */
  async getGuestList(
    status?: string,
    pageNumber?: number,
    pageSize?: number,
  ): Promise<CloudbedsGuest[]> {
    if (!this.enabled) {
      this.logger.debug('Cloudbeds disabled, skipping guest list fetch');
      return [];
    }

    try {
      const params: any = {
        propertyID: this.propertyId,
      };

      if (status) params.status = status;
      if (pageNumber) params.pageNumber = pageNumber;
      if (pageSize) params.pageSize = pageSize;

      this.logger.log(`Calling Cloudbeds API: ${this.apiUrl}/getGuestList`);

      const response = await firstValueFrom(
        this.httpService.get<CloudbedsApiResponse<CloudbedsGuest[]>>(
          `${this.apiUrl}/getGuestList`,
          {
            headers: this.getHeaders(),
            params,
          },
        ),
      );

      this.logger.log(`Cloudbeds API response status: ${response.status}`);
      this.logger.log(`Cloudbeds API raw response: ${JSON.stringify(response.data).substring(0, 1000)}`);

      // La respuesta de Cloudbeds puede tener diferentes estructuras
      // Intentar obtener los huéspedes de diferentes ubicaciones posibles
      let guests: any[] = [];

      if (response.data.data) {
        // Estructura: { success: true, data: [...] }
        guests = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        // Estructura: [...]
        guests = response.data;
      }

      // Log de la estructura del primer huésped para debugging
      if (guests.length > 0) {
        this.logger.log(`First guest structure: ${JSON.stringify(guests[0])}`);
        this.logger.log(`Guest keys: ${Object.keys(guests[0]).join(', ')}`);
      }

      this.logger.log(`Fetched ${guests.length} guests from Cloudbeds`);
      return guests;
    } catch (error) {
      this.handleError(error, 'Error fetching guest list from Cloudbeds');
    }
  }

  /**
   * Sincronizar huéspedes de Cloudbeds con la base de datos local (solo informativo)
   * - Obtiene todos los huéspedes de Cloudbeds
   * - Para cada uno, busca si existe en la BD local (por cloudbedsGuestID o email)
   * - Si existe: actualiza los datos
   * - Si no existe: crea el cliente con los datos de Cloudbeds
   * - NO elimina clientes locales que no estén en Cloudbeds (pueden ser clientes locales)
   * - Retorna un resumen de la sincronización
   */
  async syncGuestsFromCloudbeds(): Promise<{
    success: boolean;
    created: number;
    updated: number;
    skipped: number;
    total: number;
    guests: Array<{ name: string; email: string; action: 'created' | 'updated' | 'skipped'; cloudbedsGuestID: string }>;
  }> {
    if (!this.enabled) {
      throw new HttpException('Cloudbeds integration is disabled', HttpStatus.SERVICE_UNAVAILABLE);
    }

    this.logger.log('Starting guest synchronization from Cloudbeds...');

    try {
      // Obtener lista de huéspedes de Cloudbeds (paginado, obtener todos)
      let allGuests: CloudbedsGuest[] = [];
      let pageNumber = 1;
      const pageSize = 100;
      let hasMorePages = true;

      while (hasMorePages) {
        const guests = await this.getGuestList(undefined, pageNumber, pageSize);
        allGuests = allGuests.concat(guests);

        if (guests.length < pageSize) {
          hasMorePages = false;
        } else {
          pageNumber++;
        }

        // Límite de seguridad para no hacer demasiadas llamadas
        if (pageNumber > 50) {
          this.logger.warn('Reached max page limit (50) for guest sync');
          break;
        }
      }

      this.logger.log(`Total guests fetched from Cloudbeds: ${allGuests.length}`);

      const syncResults: Array<{ name: string; email: string; action: 'created' | 'updated' | 'skipped'; cloudbedsGuestID: string }> = [];
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const cbGuest of allGuests) {
        // Manejar diferentes estructuras de nombres posibles de Cloudbeds API
        // La API puede devolver: guestFirstName/guestLastName, guestName, firstName/lastName, name
        const guestData = cbGuest as any;
        let fullName = '';

        if (guestData.guestFirstName || guestData.guestLastName) {
          fullName = `${guestData.guestFirstName || ''} ${guestData.guestLastName || ''}`.trim();
        } else if (guestData.firstName || guestData.lastName) {
          fullName = `${guestData.firstName || ''} ${guestData.lastName || ''}`.trim();
        } else if (guestData.guestName) {
          fullName = guestData.guestName.trim();
        } else if (guestData.name) {
          fullName = guestData.name.trim();
        } else {
          // Si no hay nombre, usar el email como fallback
          fullName = guestData.guestEmail || guestData.email || 'Sin nombre';
        }

        // Log del primer huésped para debugging
        if (allGuests.indexOf(cbGuest) === 0) {
          this.logger.log(`Processing first guest - raw data keys: ${Object.keys(guestData).join(', ')}`);
          this.logger.log(`First guest fullName resolved to: "${fullName}"`);
        }

        const email = (guestData.guestEmail || guestData.email)?.toLowerCase().trim();

        // Obtener el ID del huésped (puede venir como guestID, guestId, id)
        const guestID = guestData.guestID || guestData.guestId || guestData.id || 'unknown';

        // Saltar huéspedes sin email (no podemos sincronizarlos correctamente)
        if (!email) {
          syncResults.push({
            name: fullName,
            email: 'N/A',
            action: 'skipped',
            cloudbedsGuestID: guestID,
          });
          skipped++;
          this.logger.debug(`Skipped guest without email: ${fullName} (${guestID})`);
          continue;
        }

        // Buscar si ya existe en la BD local (por cloudbedsGuestID o email)
        let existingClient = await this.clientRepository.findOne({
          where: { cloudbedsGuestID: guestID },
        });

        if (!existingClient && email) {
          existingClient = await this.clientRepository.findOne({
            where: { email: email },
          });
        }

        const phone = guestData.guestPhone || guestData.guestCellPhone || guestData.phone || guestData.cellPhone || '';
        const country = guestData.guestCountry || guestData.country || '';
        const address = guestData.guestAddress || guestData.address || '';
        const city = guestData.guestCity || guestData.city || '';
        const zip = guestData.guestZip || guestData.zip || '';

        if (existingClient) {
          // Actualizar cliente existente
          existingClient.fullName = fullName;
          existingClient.phone = phone || existingClient.phone;
          existingClient.country = country || existingClient.country;
          existingClient.address = address || existingClient.address;
          existingClient.city = city || existingClient.city;
          existingClient.zip = zip || existingClient.zip;
          existingClient.cloudbedsGuestID = guestID;

          await this.clientRepository.save(existingClient);

          syncResults.push({
            name: fullName,
            email: email,
            action: 'updated',
            cloudbedsGuestID: guestID,
          });
          updated++;

          this.logger.debug(`Updated client: ${fullName} (${guestID})`);
        } else {
          // Crear nuevo cliente
          const newClient = this.clientRepository.create({
            fullName: fullName,
            email: email,
            phone: phone,
            country: country,
            address: address,
            city: city,
            zip: zip,
            cloudbedsGuestID: guestID,
          });

          await this.clientRepository.save(newClient);

          syncResults.push({
            name: fullName,
            email: email,
            action: 'created',
            cloudbedsGuestID: guestID,
          });
          created++;

          this.logger.debug(`Created client: ${fullName} (${guestID})`);
        }
      }

      this.logger.log(`Guest synchronization completed: ${created} created, ${updated} updated, ${skipped} skipped`);

      return {
        success: true,
        created,
        updated,
        skipped,
        total: allGuests.length,
        guests: syncResults,
      };
    } catch (error) {
      this.logger.error('Error synchronizing guests from Cloudbeds');
      this.logger.error(error);
      throw new HttpException(
        'Error synchronizing guests from Cloudbeds: ' + (error.message || 'Unknown error'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtener lista de reservaciones desde Cloudbeds
   * Usa el endpoint getReservations para obtener reservaciones
   */
  async getReservationList(
    status?: string,
    startDate?: string,
    endDate?: string,
    pageNumber?: number,
    pageSize?: number,
  ): Promise<CloudbedsReservationResponse[]> {
    if (!this.enabled) {
      this.logger.debug('Cloudbeds disabled, skipping reservation list fetch');
      return [];
    }

    try {
      const params: any = {
        propertyID: this.propertyId,
      };

      if (status) params.status = status;
      if (startDate) params.checkInFrom = startDate;
      if (endDate) params.checkInTo = endDate;
      if (pageNumber) params.pageNumber = pageNumber;
      if (pageSize) params.pageSize = pageSize;

      this.logger.log(`Calling Cloudbeds API: ${this.apiUrl}/getReservations`);

      const response = await firstValueFrom(
        this.httpService.get<CloudbedsApiResponse<CloudbedsReservationResponse[]>>(
          `${this.apiUrl}/getReservations`,
          {
            headers: this.getHeaders(),
            params,
          },
        ),
      );

      this.logger.log(`Cloudbeds API response status: ${response.status}`);
      this.logger.log(`Cloudbeds API raw response: ${JSON.stringify(response.data).substring(0, 1000)}`);

      // La respuesta de Cloudbeds puede tener diferentes estructuras
      let reservations: any[] = [];

      if (response.data.data) {
        reservations = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        reservations = response.data;
      }

      // Log de la estructura de la primera reservación para debugging
      if (reservations.length > 0) {
        this.logger.log(`First reservation structure: ${JSON.stringify(reservations[0])}`);
        this.logger.log(`Reservation keys: ${Object.keys(reservations[0]).join(', ')}`);
      }

      this.logger.log(`Fetched ${reservations.length} reservations from Cloudbeds`);
      return reservations;
    } catch (error) {
      this.handleError(error, 'Error fetching reservation list from Cloudbeds');
    }
  }

  /**
   * Sincronizar reservaciones de Cloudbeds con la base de datos local (solo informativo)
   * - Obtiene todas las reservaciones de Cloudbeds
   * - Para cada una, busca si existe en la BD local (por cloudbedsReservationID)
   * - Si existe: actualiza los datos
   * - Si no existe: crea la reservación con los datos de Cloudbeds
   * - Intenta vincular con clientes y habitaciones locales por cloudbedsGuestID y cloudbedsRoomTypeID
   */
  async syncReservationsFromCloudbeds(): Promise<{
    success: boolean;
    created: number;
    updated: number;
    skipped: number;
    total: number;
    reservations: Array<{
      reservationID: string;
      guestName: string;
      checkIn: string;
      checkOut: string;
      status: string;
      action: 'created' | 'updated' | 'skipped';
    }>;
  }> {
    if (!this.enabled) {
      throw new HttpException('Cloudbeds integration is disabled', HttpStatus.SERVICE_UNAVAILABLE);
    }

    this.logger.log('Starting reservation synchronization from Cloudbeds...');

    try {
      // Obtener reservaciones de Cloudbeds (últimos 6 meses y próximos 6 meses)
      const today = new Date();
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const sixMonthsAhead = new Date(today);
      sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6);

      const startDate = sixMonthsAgo.toISOString().split('T')[0];
      const endDate = sixMonthsAhead.toISOString().split('T')[0];

      let allReservations: CloudbedsReservationResponse[] = [];
      let pageNumber = 1;
      const pageSize = 100;
      let hasMorePages = true;

      while (hasMorePages) {
        const reservations = await this.getReservationList(undefined, startDate, endDate, pageNumber, pageSize);
        allReservations = allReservations.concat(reservations);

        if (reservations.length < pageSize) {
          hasMorePages = false;
        } else {
          pageNumber++;
        }

        // Límite de seguridad
        if (pageNumber > 50) {
          this.logger.warn('Reached max page limit (50) for reservation sync');
          break;
        }
      }

      this.logger.log(`Total reservations fetched from Cloudbeds: ${allReservations.length}`);

      const syncResults: Array<{
        reservationID: string;
        guestName: string;
        checkIn: string;
        checkOut: string;
        status: string;
        action: 'created' | 'updated' | 'skipped';
      }> = [];
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const cbReservation of allReservations) {
        const resData = cbReservation as any;

        // Obtener ID de la reservación
        const reservationID = resData.reservationID || resData.reservationId || resData.id || '';

        if (!reservationID) {
          skipped++;
          continue;
        }

        // Obtener nombre del huésped
        let guestName = '';
        if (resData.guestFirstName || resData.guestLastName) {
          guestName = `${resData.guestFirstName || ''} ${resData.guestLastName || ''}`.trim();
        } else if (resData.guestName) {
          guestName = resData.guestName;
        } else {
          guestName = 'Huésped desconocido';
        }

        // Obtener fechas
        const checkInDate = resData.startDate || resData.checkInDate || resData.arrivalDate;
        const checkOutDate = resData.endDate || resData.checkOutDate || resData.departureDate;

        if (!checkInDate || !checkOutDate) {
          this.logger.debug(`Skipping reservation ${reservationID}: missing dates`);
          syncResults.push({
            reservationID,
            guestName,
            checkIn: checkInDate || 'N/A',
            checkOut: checkOutDate || 'N/A',
            status: resData.status || 'unknown',
            action: 'skipped',
          });
          skipped++;
          continue;
        }

        // Mapear estado de Cloudbeds a nuestro estado local
        const cloudbedsStatus = (resData.status || '').toLowerCase();
        let localStatus: ReservationStatus;
        switch (cloudbedsStatus) {
          case 'confirmed':
            localStatus = ReservationStatus.CONFIRMED;
            break;
          case 'checked_in':
          case 'in_house':
            localStatus = ReservationStatus.CHECKED_IN;
            break;
          case 'checked_out':
            localStatus = ReservationStatus.CHECKED_OUT;
            break;
          case 'canceled':
          case 'cancelled':
            localStatus = ReservationStatus.CANCELLED;
            break;
          case 'no_show':
            localStatus = ReservationStatus.NO_SHOW;
            break;
          default:
            localStatus = ReservationStatus.PENDING;
        }

        // Buscar si ya existe en la BD local
        let existingReservation = await this.reservationRepository.findOne({
          where: { cloudbedsReservationID: reservationID },
        });

        // Obtener datos adicionales
        const adults = resData.adults || resData.adultsNumber || 1;
        const children = resData.children || resData.childrenNumber || 0;
        // Buscar el total en varios campos posibles de Cloudbeds API
        const cloudbedsTotal =
          resData.grandTotal ||
          resData.total ||
          resData.totalAmount ||
          resData.balance ||
          resData.subTotal ||
          resData.totalCharged ||
          resData.totalRate ||
          resData.amount ||
          0;
        const specialRequests = resData.specialRequests || resData.notes || '';
        const dateCreated = resData.dateCreated || resData.createdAt; // Fecha original de creación en Cloudbeds

        // Intentar encontrar o crear cliente y habitación locales
        let clientId: string | null = null;
        let roomId: string | null = null;

        // Buscar cliente por cloudbedsGuestID o email
        const guestID = resData.guestID || resData.guestId;
        const guestEmail = resData.guestEmail?.toLowerCase().trim();
        const guestPhone = resData.guestPhone || resData.phone || '';
        const guestCountry = resData.guestCountry || resData.country || '';

        let client = null;
        if (guestID) {
          client = await this.clientRepository.findOne({
            where: { cloudbedsGuestID: guestID },
          });
        }

        if (!client && guestEmail) {
          client = await this.clientRepository.findOne({
            where: { email: guestEmail },
          });
        }

        // Si no existe el cliente, crearlo automáticamente
        if (!client && guestEmail) {
          this.logger.log(`Creating new client from reservation: ${guestName} (${guestEmail})`);
          client = this.clientRepository.create({
            fullName: guestName,
            email: guestEmail,
            phone: guestPhone,
            country: guestCountry,
            cloudbedsGuestID: guestID || undefined,
          });
          client = await this.clientRepository.save(client);
        }

        if (client) {
          clientId = client.id;
          // Actualizar cloudbedsGuestID si no lo tenía
          if (guestID && !client.cloudbedsGuestID) {
            client.cloudbedsGuestID = guestID;
            await this.clientRepository.save(client);
          }
        }

        // Buscar habitación por cloudbedsRoomTypeID
        const roomTypeID = resData.rooms?.[0]?.roomTypeID || resData.roomTypeID;
        let room = null;

        if (roomTypeID) {
          room = await this.roomRepository.findOne({
            where: { cloudbedsRoomTypeID: roomTypeID },
          });
        }

        // Si no encontramos habitación por roomTypeID, buscar la primera disponible
        if (!room) {
          const rooms = await this.roomRepository.find({
            order: { createdAt: 'ASC' },
            take: 1,
          });
          if (rooms.length > 0) {
            room = rooms[0];
            this.logger.warn(`Room type ${roomTypeID} not found, using default room: ${room.name}`);
          }
        }

        if (room) {
          roomId = room.id;
        }

        // Calcular el precio total: usar el de Cloudbeds si existe, sino calcular basado en habitación local
        let totalPrice = Number(cloudbedsTotal) || 0;
        if (totalPrice === 0 && room) {
          // Calcular precio basado en noches y precio de habitación
          const checkIn = new Date(checkInDate);
          const checkOut = new Date(checkOutDate);
          const nights = Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
          );
          totalPrice = Number(room.price) * nights;
          this.logger.debug(
            `Calculated totalPrice for reservation ${reservationID}: ${nights} nights × $${room.price} = $${totalPrice}`,
          );
        }

        // Si no hay cliente (sin email) o no hay habitación en absoluto, omitir
        if (!clientId || !roomId) {
          const reason = !clientId ? 'no client email' : 'no room available';
          this.logger.debug(`Skipping reservation ${reservationID}: ${reason}`);
          syncResults.push({
            reservationID,
            guestName,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            status: cloudbedsStatus,
            action: 'skipped',
          });
          skipped++;
          continue;
        }

        if (existingReservation) {
          // Actualizar reservación existente
          existingReservation.checkInDate = new Date(checkInDate);
          existingReservation.checkOutDate = new Date(checkOutDate);
          existingReservation.numberOfAdults = adults;
          existingReservation.numberOfChildren = children;
          existingReservation.totalPrice = totalPrice;
          existingReservation.status = localStatus;
          existingReservation.specialRequests = specialRequests;
          existingReservation.clientId = clientId;
          existingReservation.roomId = roomId;
          // Guardar fecha de creación original de Cloudbeds si existe
          if (dateCreated && !existingReservation.cloudbedsDateCreated) {
            existingReservation.cloudbedsDateCreated = new Date(dateCreated);
          }

          await this.reservationRepository.save(existingReservation);

          syncResults.push({
            reservationID,
            guestName,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            status: cloudbedsStatus,
            action: 'updated',
          });
          updated++;

          this.logger.debug(`Updated reservation: ${reservationID}`);
        } else {
          // Crear nueva reservación
          const newReservation = this.reservationRepository.create({
            checkInDate: new Date(checkInDate),
            checkOutDate: new Date(checkOutDate),
            numberOfAdults: adults,
            numberOfChildren: children,
            totalPrice: totalPrice,
            status: localStatus,
            specialRequests: specialRequests,
            clientId: clientId,
            roomId: roomId,
            cloudbedsReservationID: reservationID,
            cloudbedsDateCreated: dateCreated ? new Date(dateCreated) : undefined,
          });

          await this.reservationRepository.save(newReservation);

          syncResults.push({
            reservationID,
            guestName,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            status: cloudbedsStatus,
            action: 'created',
          });
          created++;

          this.logger.debug(`Created reservation: ${reservationID}`);
        }
      }

      this.logger.log(`Reservation synchronization completed: ${created} created, ${updated} updated, ${skipped} skipped`);

      return {
        success: true,
        created,
        updated,
        skipped,
        total: allReservations.length,
        reservations: syncResults,
      };
    } catch (error) {
      this.logger.error('Error synchronizing reservations from Cloudbeds');
      this.logger.error(error);
      throw new HttpException(
        'Error synchronizing reservations from Cloudbeds: ' + (error.message || 'Unknown error'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
