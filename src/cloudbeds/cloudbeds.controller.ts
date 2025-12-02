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

      // Validar que las fechas sean futuras
      const checkIn = new Date(reservationDto.startDate);
      const checkOut = new Date(reservationDto.endDate);
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
          unavailableRooms.push(`${room.roomTypeID} (requested: ${room.quantity}, available: ${availability?.roomsAvailable || 0})`);
        } else {
          // Calcular el total acumulado
          totalAmount += availability.totalRate * room.quantity;
          currency = availability.currency;
        }
      }

      if (unavailableRooms.length > 0) {
        throw new HttpException(
          `Some rooms are not available: ${unavailableRooms.join(', ')}`,
          HttpStatus.CONFLICT,
        );
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
}
