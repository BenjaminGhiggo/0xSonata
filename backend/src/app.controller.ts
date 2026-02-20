// POR QUE: Necesitamos un endpoint basico para verificar que el servidor
//   esta activo. Es el equivalente a preguntarle al bibliotecario:
//   "Estas abierto?" -> "Si, estoy funcionando".
//
// QUE: Endpoint GET /api/health que devuelve {status: 'ok'}
//
// COMO: El decorador @Controller() indica que esta clase maneja rutas HTTP.
//   @Get('health') mapea el metodo a GET /api/health (el prefijo /api
//   se agrega en main.ts con setGlobalPrefix).

import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {

  @Get()
  getRoot(): { message: string } {
    return { message: 'Welcome to 0xsonata-backend!' };
  }

  @Get('health')
  getHealth(): { status: string; service: string } {
    return { status: 'ok', service: '0xsonata-backend' };
  }
}
