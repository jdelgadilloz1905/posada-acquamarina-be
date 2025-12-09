import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CloudbedsService } from './cloudbeds.service';
import { AvailabilityQueryDto, BulkAvailabilityQueryDto } from './dto/availability-query.dto';
import { CloudbedsCreateReservationDto } from './dto/create-reservation.dto';

@ApiTags('Cloudbeds')
@Controller('cloudbeds')
export class CloudbedsController {
  private readonly logger = new Logger(CloudbedsController.name);

  constructor(private readonly cloudbedsService: CloudbedsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Check Cloudbeds integration status' })
  @ApiResponse({ status: 200, description: 'Integration status' })
  getStatus() {
    return {
      enabled: this.cloudbedsService.isEnabled(),
      message: this.cloudbedsService.isEnabled()
        ? 'Cloudbeds integration is active'
        : 'Cloudbeds integration is disabled',
    };
  }

  @Post('clear-cache')
  @ApiOperation({ summary: 'Clear availability cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache() {
    await this.cloudbedsService.clearAvailabilityCache();
    return {
      success: true,
      message: 'Availability cache cleared successfully',
    };
  }

  @Get('room-types')
  @ApiOperation({ summary: 'Get all room types from Cloudbeds' })
  @ApiResponse({
    status: 200,
    description: 'List of all room types from Cloudbeds',
  })
  async getAllRoomTypes() {
    try {
      this.logger.log('Controller: Starting to fetch room types');
      const roomTypes = await this.cloudbedsService.getAllRoomTypes();
      this.logger.log(`Controller: Received ${roomTypes.length} room types`);

      const response = {
        success: true,
        data: roomTypes,
        count: roomTypes.length,
      };

      this.logger.log(`Controller: Returning response with count: ${response.count}`);
      return response;
    } catch (error) {
      this.logger.error('Error fetching room types');
      this.logger.error(`Error stack: ${error.stack}`);
      this.logger.error(`Error message: ${error.message}`);
      throw new HttpException(
        error.message || 'Error fetching room types from Cloudbeds',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('availability')
  @ApiOperation({ summary: 'Check availability for all rooms' })
  @ApiQuery({ name: 'checkInDate', required: true, example: '2025-12-01' })
  @ApiQuery({ name: 'checkOutDate', required: true, example: '2025-12-05' })
  @ApiQuery({ name: 'adults', required: false, example: 2 })
  @ApiQuery({ name: 'children', required: false, example: 0 })
  @ApiQuery({ name: 'rooms', required: false, example: 1 })
  @ApiQuery({ name: 'promoCode', required: false, example: 'SUMMER2025' })
  @ApiQuery({ name: 'detailedRates', required: false, example: true })
  @ApiResponse({ status: 200, description: 'Availability results' })
  async checkAvailability(@Query() query: BulkAvailabilityQueryDto) {
    const {
      checkInDate,
      checkOutDate,
      adults = 2,
      children = 0,
      rooms = 1,
      promoCode,
      detailedRates = true,
    } = query;

    if (!checkInDate || !checkOutDate) {
      throw new HttpException(
        'Check-in and check-out dates are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar que checkout sea después de checkin
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      throw new HttpException(
        'Check-out date must be after check-in date',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const availability = await this.cloudbedsService.checkAvailability(
        checkInDate,
        checkOutDate,
        adults,
        children,
        rooms,
        promoCode,
        detailedRates,
      );

      return {
        success: true,
        data: availability,
        count: availability.length,
        query: {
          checkInDate,
          checkOutDate,
          adults,
          children,
          rooms,
          promoCode,
          detailedRates,
        },
      };
    } catch (error) {
      this.logger.error('Error checking availability', error);
      throw new HttpException(
        'Error checking availability from Cloudbeds',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('availability/room')
  @ApiOperation({ summary: 'Check availability for a specific room' })
  @ApiQuery({ name: 'roomId', required: true, example: '1' })
  @ApiQuery({ name: 'checkInDate', required: true, example: '2025-12-01' })
  @ApiQuery({ name: 'checkOutDate', required: true, example: '2025-12-05' })
  @ApiQuery({ name: 'adults', required: false, example: 2 })
  @ApiQuery({ name: 'children', required: false, example: 0 })
  @ApiQuery({ name: 'rooms', required: false, example: 1 })
  @ApiQuery({ name: 'promoCode', required: false, example: 'SUMMER2025' })
  @ApiResponse({ status: 200, description: 'Room availability result' })
  async checkRoomAvailability(@Query() query: AvailabilityQueryDto) {
    const {
      roomId,
      checkInDate,
      checkOutDate,
      adults = 2,
      children = 0,
      rooms = 1,
      promoCode,
    } = query;

    if (!roomId || !checkInDate || !checkOutDate) {
      throw new HttpException(
        'Room ID, check-in and check-out dates are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar fechas
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      throw new HttpException(
        'Check-out date must be after check-in date',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const availability = await this.cloudbedsService.checkRoomAvailability(
        roomId,
        checkInDate,
        checkOutDate,
        adults,
        children,
        rooms,
        promoCode,
      );

      return {
        success: true,
        data: availability,
        query: {
          roomId,
          checkInDate,
          checkOutDate,
          adults,
          children,
        },
      };
    } catch (error) {
      this.logger.error(`Error checking room ${roomId} availability`, error);
      throw new HttpException(
        'Error checking room availability from Cloudbeds',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('pricing')
  @ApiOperation({ summary: 'Get dynamic pricing for a room' })
  @ApiQuery({ name: 'roomId', required: true, example: '1' })
  @ApiQuery({ name: 'checkInDate', required: true, example: '2025-12-01' })
  @ApiQuery({ name: 'checkOutDate', required: true, example: '2025-12-05' })
  @ApiResponse({ status: 200, description: 'Dynamic pricing information' })
  async getDynamicPricing(
    @Query('roomId') roomId: string,
    @Query('checkInDate') checkInDate: string,
    @Query('checkOutDate') checkOutDate: string,
  ) {
    if (!roomId || !checkInDate || !checkOutDate) {
      throw new HttpException(
        'Room ID, check-in and check-out dates are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const pricing = await this.cloudbedsService.getDynamicPricing(
        roomId,
        checkInDate,
        checkOutDate,
      );

      if (!pricing) {
        return {
          success: false,
          message: 'No pricing available for the selected dates',
          data: null,
        };
      }

      return {
        success: true,
        data: pricing,
      };
    } catch (error) {
      this.logger.error(`Error fetching pricing for room ${roomId}`, error);
      throw new HttpException(
        'Error fetching dynamic pricing from Cloudbeds',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('calendar')
  @ApiOperation({ summary: 'Get calendar availability with prices' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', example: '2025-12-01' },
        endDate: { type: 'string', example: '2025-12-31' },
      },
      required: ['startDate', 'endDate'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Calendar availability data with prices per date',
  })
  async getCalendarAvailability(
    @Body() body: { startDate: string; endDate: string },
  ) {
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      throw new HttpException(
        'Start date and end date are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar formato de fechas
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw new HttpException(
        'Invalid date format. Use YYYY-MM-DD',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (endDateObj <= startDateObj) {
      throw new HttpException(
        'End date must be after start date',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const calendarData = await this.cloudbedsService.getCalendarAvailability(
        startDate,
        endDate,
      );

      return {
        success: true,
        data: calendarData,
        dateRange: {
          startDate,
          endDate,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching calendar data', error);
      throw new HttpException(
        'Error fetching calendar data from Cloudbeds',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reservation')
  @ApiOperation({ summary: 'Create a new reservation in Cloudbeds' })
  @ApiBody({ type: CloudbedsCreateReservationDto })
  @ApiResponse({
    status: 201,
    description: 'Reservation created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        reservationId: { type: 'string', example: '123456' },
        message: { type: 'string', example: 'Reservation created successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid reservation data' })
  @ApiResponse({ status: 500, description: 'Error creating reservation' })
  async createReservation(@Body() reservationDto: CloudbedsCreateReservationDto) {
    try {
      this.logger.log(`Creating reservation for ${reservationDto.guestEmail}`);

      // Validar que las fechas sean futuras (parsear como fecha local, no UTC)
      const [checkInYear, checkInMonth, checkInDay] = reservationDto.startDate.split('-').map(Number);
      const [checkOutYear, checkOutMonth, checkOutDay] = reservationDto.endDate.split('-').map(Number);
      const checkIn = new Date(checkInYear, checkInMonth - 1, checkInDay);
      const checkOut = new Date(checkOutYear, checkOutMonth - 1, checkOutDay);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkIn < today) {
        throw new HttpException(
          'Check-in date must be in the future',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (checkOut <= checkIn) {
        throw new HttpException(
          'Check-out date must be after check-in date',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar disponibilidad de TODAS las habitaciones antes de crear la reserva
      this.logger.log(`Checking availability for ${reservationDto.rooms.length} room type(s)`);

      let totalAmount = 0;
      let currency = 'USD';
      const unavailableRooms: string[] = [];

      for (const room of reservationDto.rooms) {
        const adultsForRoom = reservationDto.adults
          .filter(a => a.roomTypeID === room.roomTypeID)
          .reduce((sum, a) => sum + a.quantity, 0);

        const childrenForRoom = reservationDto.children
          ?.filter(c => c.roomTypeID === room.roomTypeID)
          .reduce((sum, c) => sum + c.quantity, 0) || 0;

        const availability = await this.cloudbedsService.checkRoomAvailability(
          room.roomTypeID,
          reservationDto.startDate,
          reservationDto.endDate,
          adultsForRoom,
          childrenForRoom,
          room.quantity,
          reservationDto.promoCode,
        );

        if (!availability || !availability.available || availability.roomsAvailable < room.quantity) {
          unavailableRooms.push(room.roomTypeID);
        } else {
          // Calcular el total acumulado
          totalAmount += availability.totalRate * room.quantity;
          currency = availability.currency;
        }
      }

      if (unavailableRooms.length > 0) {
        // Mensaje amigable para el usuario
        const errorResponse = {
          statusCode: HttpStatus.CONFLICT,
          error: 'ROOMS_NOT_AVAILABLE',
          message: 'Lo sentimos, la habitación seleccionada no está disponible para las fechas elegidas. Por favor, intenta con otras fechas o selecciona otra habitación.',
          details: {
            startDate: reservationDto.startDate,
            endDate: reservationDto.endDate,
            unavailableRoomIds: unavailableRooms,
          },
        };
        throw new HttpException(errorResponse, HttpStatus.CONFLICT);
      }

      // Crear la reserva
      const result = await this.cloudbedsService.createReservation({
        startDate: reservationDto.startDate,
        endDate: reservationDto.endDate,
        guestFirstName: reservationDto.guestFirstName,
        guestLastName: reservationDto.guestLastName,
        guestEmail: reservationDto.guestEmail,
        guestCountry: reservationDto.guestCountry,
        guestZip: reservationDto.guestZip,
        guestPhone: reservationDto.guestPhone,
        guestGender: reservationDto.guestGender,
        estimatedArrivalTime: reservationDto.estimatedArrivalTime,
        rooms: reservationDto.rooms,
        adults: reservationDto.adults,
        children: reservationDto.children,
        paymentMethod: reservationDto.paymentMethod,
        cardToken: reservationDto.cardToken,
        paymentAuthorizationCode: reservationDto.paymentAuthorizationCode,
        promoCode: reservationDto.promoCode,
        allotmentBlockCode: reservationDto.allotmentBlockCode,
        customFields: reservationDto.customFields,
        specialRequests: reservationDto.specialRequests,
      });

      if (result.success) {
        this.logger.log(`Reservation created successfully: ${result.reservationId}`);
        return {
          success: true,
          reservationId: result.reservationId,
          message: 'Reservation created successfully',
          totalAmount: totalAmount,
          currency: currency,
        };
      }

      throw new HttpException(
        result.message || 'Failed to create reservation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error creating reservation', error);
      throw new HttpException(
        'Error creating reservation in Cloudbeds',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync-rooms')
  @ApiOperation({
    summary: 'Synchronize rooms from Cloudbeds to local database',
    description: 'Fetches all room types from Cloudbeds and creates/updates them in the local database. Preserves local customizations like videoUrl and custom images.'
  })
  @ApiResponse({
    status: 200,
    description: 'Rooms synchronized successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        created: { type: 'number', example: 2 },
        updated: { type: 'number', example: 2 },
        total: { type: 'number', example: 4 },
        rooms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Saky Saky King' },
              action: { type: 'string', example: 'created' },
              cloudbedsRoomTypeID: { type: 'string', example: '137590389416104' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Cloudbeds integration is disabled' })
  async syncRooms() {
    try {
      this.logger.log('Starting room synchronization from Cloudbeds...');
      const result = await this.cloudbedsService.syncRoomsFromCloudbeds();

      this.logger.log(`Sync completed: ${result.created} created, ${result.updated} updated`);

      return result;
    } catch (error) {
      this.logger.error('Error synchronizing rooms', error);
      throw new HttpException(
        error.message || 'Error synchronizing rooms from Cloudbeds',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync-guests')
  @ApiOperation({
    summary: 'Synchronize guests from Cloudbeds to local database',
    description: 'Fetches all guests from Cloudbeds and creates/updates them in the local clients table. This is informational only - local clients are not deleted.'
  })
  @ApiResponse({
    status: 200,
    description: 'Guests synchronized successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        created: { type: 'number', example: 5 },
        updated: { type: 'number', example: 3 },
        skipped: { type: 'number', example: 2 },
        total: { type: 'number', example: 10 },
        guests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'John Doe' },
              email: { type: 'string', example: 'john@example.com' },
              action: { type: 'string', example: 'created' },
              cloudbedsGuestID: { type: 'string', example: '12345678' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Cloudbeds integration is disabled' })
  async syncGuests() {
    try {
      this.logger.log('Starting guest synchronization from Cloudbeds...');
      const result = await this.cloudbedsService.syncGuestsFromCloudbeds();

      this.logger.log(`Guest sync completed: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`);

      return result;
    } catch (error) {
      this.logger.error('Error synchronizing guests', error);
      throw new HttpException(
        error.message || 'Error synchronizing guests from Cloudbeds',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('debug/reservations-raw')
  @ApiOperation({
    summary: '[DEBUG] Get raw reservations JSON from Cloudbeds API',
    description: 'Returns the raw JSON response from Cloudbeds getReservations endpoint to analyze the data structure and date fields.'
  })
  @ApiQuery({ name: 'limit', required: false, example: 5, description: 'Number of reservations to fetch (default: 5)' })
  @ApiResponse({ status: 200, description: 'Raw Cloudbeds response' })
  async getReservationsRaw(@Query('limit') limit: string = '5') {
    try {
      const reservations = await this.cloudbedsService.getReservationList(
        undefined, // status
        undefined, // startDate
        undefined, // endDate
        1, // pageNumber
        parseInt(limit) || 5, // pageSize
      );

      return {
        success: true,
        message: 'Raw Cloudbeds reservations response',
        count: reservations.length,
        note: 'Examine dateCreated and dateModified fields to see the format',
        data: reservations,
      };
    } catch (error) {
      this.logger.error('Error fetching raw reservations', error);
      throw new HttpException(
        error.message || 'Error fetching reservations from Cloudbeds',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('debug/guests-raw')
  @ApiOperation({
    summary: '[DEBUG] Get raw guests JSON from Cloudbeds API',
    description: 'Returns the raw JSON response from Cloudbeds getGuestList endpoint to analyze the data structure.'
  })
  @ApiQuery({ name: 'limit', required: false, example: 5, description: 'Number of guests to fetch (default: 5)' })
  @ApiResponse({ status: 200, description: 'Raw Cloudbeds response' })
  async getGuestsRaw(@Query('limit') limit: string = '5') {
    try {
      const guests = await this.cloudbedsService.getGuestList(
        undefined, // status
        1, // pageNumber
        parseInt(limit) || 5, // pageSize
      );

      return {
        success: true,
        message: 'Raw Cloudbeds guests response',
        count: guests.length,
        data: guests,
      };
    } catch (error) {
      this.logger.error('Error fetching raw guests', error);
      throw new HttpException(
        error.message || 'Error fetching guests from Cloudbeds',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('debug/guests-modified')
  @ApiOperation({
    summary: '[DEBUG] Get modified guests from Cloudbeds API (getGuestsModified)',
    description: 'Returns guests modified after a specific date using getGuestsModified endpoint. NOTE: May not include newly created guests.'
  })
  @ApiQuery({ name: 'resultsFrom', required: true, example: '2025-12-09 00:00:00', description: 'Filter guests modified after this datetime (format: YYYY-MM-DD HH:mm:ss)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Number of guests to fetch (default: 10)' })
  @ApiResponse({ status: 200, description: 'Modified guests from Cloudbeds' })
  async getGuestsModified(
    @Query('resultsFrom') resultsFrom: string,
    @Query('limit') limit: string = '10'
  ) {
    try {
      if (!resultsFrom) {
        throw new HttpException('resultsFrom parameter is required (format: YYYY-MM-DD HH:mm:ss)', HttpStatus.BAD_REQUEST);
      }

      const guests = await this.cloudbedsService.getGuestsModified(
        resultsFrom,
        1, // pageNumber
        parseInt(limit) || 10, // pageSize
      );

      return {
        success: true,
        message: 'Modified guests from Cloudbeds (getGuestsModified endpoint)',
        resultsFrom: resultsFrom,
        count: guests.length,
        note: 'These are guests MODIFIED after the specified date (may not include NEW guests)',
        data: guests,
      };
    } catch (error) {
      this.logger.error('Error fetching modified guests', error);
      throw new HttpException(
        error.message || 'Error fetching modified guests from Cloudbeds',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('debug/guests-filtered')
  @ApiOperation({
    summary: '[DEBUG] Get guests filtered by date from Cloudbeds API (getGuestList with resultsFrom)',
    description: 'Returns guests created OR modified after a specific date using getGuestList endpoint with resultsFrom parameter.'
  })
  @ApiQuery({ name: 'resultsFrom', required: true, example: '2025-12-09 00:00:00', description: 'Filter guests created/modified after this datetime (format: YYYY-MM-DD HH:mm:ss)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Number of guests to fetch (default: 10)' })
  @ApiResponse({ status: 200, description: 'Filtered guests from Cloudbeds' })
  async getGuestsFiltered(
    @Query('resultsFrom') resultsFrom: string,
    @Query('limit') limit: string = '10'
  ) {
    try {
      if (!resultsFrom) {
        throw new HttpException('resultsFrom parameter is required (format: YYYY-MM-DD HH:mm:ss)', HttpStatus.BAD_REQUEST);
      }

      const guests = await this.cloudbedsService.getGuestList(
        undefined, // status
        1, // pageNumber
        parseInt(limit) || 10, // pageSize
        resultsFrom, // resultsFrom
      );

      return {
        success: true,
        message: 'Filtered guests from Cloudbeds (getGuestList with resultsFrom)',
        resultsFrom: resultsFrom,
        count: guests.length,
        note: 'These are guests CREATED OR MODIFIED after the specified date',
        data: guests,
      };
    } catch (error) {
      this.logger.error('Error fetching filtered guests', error);
      throw new HttpException(
        error.message || 'Error fetching filtered guests from Cloudbeds',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync-reservations')
  @ApiOperation({
    summary: 'Synchronize reservations from Cloudbeds to local database',
    description: 'Fetches reservations from Cloudbeds (last 6 months and next 6 months) and creates/updates them in the local database. Links with local clients and rooms by cloudbedsGuestID and cloudbedsRoomTypeID.'
  })
  @ApiResponse({
    status: 200,
    description: 'Reservations synchronized successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        created: { type: 'number', example: 10 },
        updated: { type: 'number', example: 5 },
        skipped: { type: 'number', example: 2 },
        total: { type: 'number', example: 17 },
        reservations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reservationID: { type: 'string', example: '12345' },
              guestName: { type: 'string', example: 'John Doe' },
              checkIn: { type: 'string', example: '2025-12-01' },
              checkOut: { type: 'string', example: '2025-12-05' },
              status: { type: 'string', example: 'confirmed' },
              action: { type: 'string', example: 'created' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Cloudbeds integration is disabled' })
  async syncReservations() {
    try {
      this.logger.log('Starting reservation synchronization from Cloudbeds...');
      const result = await this.cloudbedsService.syncReservationsFromCloudbeds();

      this.logger.log(`Reservation sync completed: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`);

      return result;
    } catch (error) {
      this.logger.error('Error synchronizing reservations', error);
      throw new HttpException(
        error.message || 'Error synchronizing reservations from Cloudbeds',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
