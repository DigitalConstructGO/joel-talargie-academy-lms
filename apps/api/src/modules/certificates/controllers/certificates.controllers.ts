import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import {
  CertificateListDto,
  CreateCertificateTemplateDto,
  GenerateCertificateDto,
  CertificateReasonDto,
  RegenerateCertificateDto,
  UpdateCertificateTemplateDto,
} from '../dto/certificates.dto';
import { CertificatesService } from '../services/certificates.service';

@Controller()
@ApiTags('Student Certificates')
@ApiBearerAuth()
@Roles('STUDENT')
export class StudentCertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Post('me/enrollments/:enrollmentId/certificate')
  @ApiOperation({
    summary: 'Request or return an eligible owned certificate identity',
  })
  request(
    @CurrentUser() user: AuthUser,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
  ) {
    return this.certificates.request(user, enrollmentId);
  }

  @Get('me/certificates')
  list(@CurrentUser() user: AuthUser, @Query() query: CertificateListDto) {
    return this.certificates.listMine(user.id, query);
  }

  @Get('me/certificates/:certificateId/download')
  @ApiOperation({
    summary: 'Get a signed certificate download URL',
    description:
      'Pass ?inline=true for a browser-renderable preview URL (e.g. embedding in an iframe); omit it for a URL that forces a download, matching an explicit "Download" click.',
  })
  download(
    @CurrentUser() user: AuthUser,
    @Param('certificateId', ParseUUIDPipe) id: string,
    @Query('inline') inline?: string,
  ) {
    return this.certificates.studentDownload(user.id, id, inline === 'true');
  }

  @Get('me/certificates/:certificateId')
  detail(
    @CurrentUser() user: AuthUser,
    @Param('certificateId', ParseUUIDPipe) id: string,
  ) {
    return this.certificates.mine(user.id, id);
  }
}

@Controller('certificates')
@ApiTags('Public Certificate Verification')
export class PublicCertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('verify/:verificationToken')
  @ApiOperation({
    summary:
      'Verify one high-entropy certificate token without exposing private data',
  })
  verify(@Param('verificationToken') token: string) {
    return this.certificates.verify(token);
  }
}

@Controller('admin')
@ApiTags('Administrator Certificates')
@ApiBearerAuth()
export class AdminCertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get('certificates')
  @RequirePermissions('certificates.read')
  list(@Query() query: CertificateListDto) {
    return this.certificates.listAdmin(query);
  }

  @Post('enrollments/:enrollmentId/certificate')
  @RequirePermissions('certificates.generate')
  request(
    @CurrentUser() actor: AuthUser,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Body() dto: GenerateCertificateDto,
  ) {
    return this.certificates.adminRequest(actor.id, enrollmentId, dto);
  }

  @Post('certificates/:certificateId/retry')
  @RequirePermissions('certificates.retry')
  retry(
    @CurrentUser() actor: AuthUser,
    @Param('certificateId', ParseUUIDPipe) id: string,
  ) {
    return this.certificates.retry(actor.id, id);
  }

  @Post('certificates/:certificateId/regenerate')
  @RequirePermissions('certificates.regenerate')
  regenerate(
    @CurrentUser() actor: AuthUser,
    @Param('certificateId', ParseUUIDPipe) id: string,
    @Body() dto: RegenerateCertificateDto,
  ) {
    return this.certificates.regenerate(actor.id, id, dto);
  }

  @Post('certificates/:certificateId/revoke')
  @RequirePermissions('certificates.revoke')
  revoke(
    @CurrentUser() actor: AuthUser,
    @Param('certificateId', ParseUUIDPipe) id: string,
    @Body() dto: CertificateReasonDto,
  ) {
    return this.certificates.revoke(actor.id, id, dto.reason);
  }

  @Get('certificates/:certificateId/download')
  @RequirePermissions('certificates.download')
  download(@Param('certificateId', ParseUUIDPipe) id: string) {
    return this.certificates.adminDownload(id);
  }

  @Get('certificates/:certificateId/files')
  @RequirePermissions('certificates.view_file_history')
  files(@Param('certificateId', ParseUUIDPipe) id: string) {
    return this.certificates.files(id);
  }

  @Get('certificates/:certificateId/files/:fileId/download')
  @RequirePermissions('certificates.download', 'certificates.view_file_history')
  fileDownload(
    @Param('certificateId', ParseUUIDPipe) certificateId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    return this.certificates.fileDownload(certificateId, fileId);
  }

  @Get('certificates/:certificateId/events')
  @RequirePermissions('certificates.view_events')
  events(@Param('certificateId', ParseUUIDPipe) id: string) {
    return this.certificates.events(id);
  }

  @Get('certificates/:certificateId')
  @RequirePermissions('certificates.read')
  detail(@Param('certificateId', ParseUUIDPipe) id: string) {
    return this.certificates.admin(id);
  }
}

@Controller('admin/certificate-templates')
@ApiTags('Certificate Templates')
@ApiBearerAuth()
@RequirePermissions('certificates.manage_templates')
export class CertificateTemplatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get()
  list() {
    return this.certificates.templates();
  }
  @Post()
  create(
    @CurrentUser() actor: AuthUser,
    @Body() dto: CreateCertificateTemplateDto,
  ) {
    return this.certificates.createTemplate(actor.id, dto);
  }
  @Get(':templateId')
  detail(@Param('templateId', ParseUUIDPipe) id: string) {
    return this.certificates.template(id);
  }
  @Patch(':templateId')
  update(
    @Param('templateId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCertificateTemplateDto,
  ) {
    return this.certificates.updateTemplate(id, dto);
  }
  @Post(':templateId/activate')
  activate(@Param('templateId', ParseUUIDPipe) id: string) {
    return this.certificates.activateTemplate(id, true);
  }
  @Post(':templateId/deactivate')
  deactivate(@Param('templateId', ParseUUIDPipe) id: string) {
    return this.certificates.activateTemplate(id, false);
  }
}
