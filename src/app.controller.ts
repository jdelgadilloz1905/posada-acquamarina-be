import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getWelcome() {
    return {
      message: '🏨 Hotel Acquamarina API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        authentication: {
          register: 'POST /auth/register',
          login: 'POST /auth/login',
          profile: 'GET /auth/me',
        },
        rooms: {
          list: 'GET /rooms',
          available: 'GET /rooms/available',
          create: 'POST /rooms',
          detail: 'GET /rooms/:id',
        },
        reservations: {
          create: 'POST /reservations',
          list: 'GET /reservations',
          myReservations: 'GET /reservations/my-reservations',
          detail: 'GET /reservations/:id',
          confirm: 'PATCH /reservations/:id/confirm',
          cancel: 'PATCH /reservations/:id/cancel',
        },
      },
      documentation: 'Ver README.md para documentación completa',
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
