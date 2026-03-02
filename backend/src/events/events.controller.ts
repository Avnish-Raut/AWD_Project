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
} from '@nestjs/common';
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
  findAll(@Query('search') search?: string) {
    return this.eventsService.findAllPublished(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  // Organizer 
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORG)
  create(@Body() dto: CreateEventDto, @GetUser() user: JwtPayload) {
    return this.eventsService.create(dto, user.sub);
  }

  @Get('my/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORG)
  findMyEvents(@GetUser() user: JwtPayload) {
    return this.eventsService.findMyEvents(user.sub);
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
  publish(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.eventsService.publish(id, user.sub);
  }

  @Get(':id/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORG)
  getParticipants(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.eventsService.getParticipants(id, user.sub);
  }

  // Participant 

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  registerForEvent(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.eventsService.registerParticipant(id, user.sub);
  }

  @Delete(':id/register')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  cancelRegistration(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.eventsService.cancelRegistration(id, user.sub);
  }

  // Organizer OR Admin 

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORG, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  cancelEvent(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.eventsService.cancel(id, user.sub, user.role);
  }
}
