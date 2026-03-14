import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors, // Added
  UploadedFile,    // Added
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'; // Added
import { diskStorage } from 'multer'; // Added
import { extname } from 'path';      // Added
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('location') location?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    return this.eventsService.findAllPublished({ search, location, dateFrom, dateTo });
  }

  @Get('my/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORG)
  findMyEvents(@GetUser() user: JwtPayload) {
    return this.eventsService.findMyEvents(user.sub);
  }

  @Get('my/user-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  findUserEvents(@GetUser() user: JwtPayload) {
    return this.eventsService.findUserEvents(user.sub);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  // NEW: FILE UPLOAD ENDPOINT
  @Post(':id/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORG)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/documents',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  uploadFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: JwtPayload,
  ) {
    return this.eventsService.addDocument(id, user.sub, file);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORG)
  create(@Body() dto: CreateEventDto, @GetUser() user: JwtPayload) {
    return this.eventsService.create(dto, user.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORG)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @GetUser() user: JwtPayload,
  ) {
    return this.eventsService.update(id, dto, user.sub);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORG)
  publish(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.eventsService.publish(id, user.sub);
  }

  @Get(':id/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORG)
  getParticipants(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.eventsService.getParticipants(id, user.sub);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  registerForEvent(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.eventsService.registerParticipant(id, user.sub);
  }

  @Delete(':id/cancel-registration')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  cancelRegistration(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.eventsService.cancelRegistration(id, user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORG, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  cancelEvent(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.eventsService.cancel(id, user.sub, user.role);
  }
}