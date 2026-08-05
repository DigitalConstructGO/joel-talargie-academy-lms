import {
  AdminCertificatesController,
  CertificateTemplatesController,
  PublicCertificatesController,
  StudentCertificatesController,
} from '../controllers/certificates.controllers';

const certificates = {
  request: jest.fn(),
  listMine: jest.fn(),
  studentDownload: jest.fn(),
  mine: jest.fn(),
  verify: jest.fn(),
  listAdmin: jest.fn(),
  adminRequest: jest.fn(),
  retry: jest.fn(),
  regenerate: jest.fn(),
  revoke: jest.fn(),
  adminDownload: jest.fn(),
  files: jest.fn(),
  fileDownload: jest.fn(),
  events: jest.fn(),
  admin: jest.fn(),
  templates: jest.fn(),
  createTemplate: jest.fn(),
  template: jest.fn(),
  updateTemplate: jest.fn(),
  activateTemplate: jest.fn(),
};
const user = { id: 'student-1', roles: ['STUDENT'] } as never;
const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

beforeEach(() => jest.clearAllMocks());

describe('StudentCertificatesController', () => {
  const controller = new StudentCertificatesController(certificates as never);

  it('requests a certificate for an owned enrollment', () => {
    controller.request(user, 'enrollment-1');
    expect(certificates.request).toHaveBeenCalledWith(user, 'enrollment-1');
  });

  it('lists, downloads, and gets owned certificates scoped to the caller', () => {
    controller.list(user, {} as never);
    expect(certificates.listMine).toHaveBeenCalledWith('student-1', {});
    controller.download(user, 'certificate-1');
    expect(certificates.studentDownload).toHaveBeenCalledWith(
      'student-1',
      'certificate-1',
    );
    controller.detail(user, 'certificate-1');
    expect(certificates.mine).toHaveBeenCalledWith(
      'student-1',
      'certificate-1',
    );
  });
});

describe('PublicCertificatesController', () => {
  const controller = new PublicCertificatesController(certificates as never);

  it('verifies a certificate token without authentication', () => {
    controller.verify('token-abc');
    expect(certificates.verify).toHaveBeenCalledWith('token-abc');
  });
});

describe('AdminCertificatesController', () => {
  const controller = new AdminCertificatesController(certificates as never);

  it('lists all certificates', () => {
    controller.list({} as never);
    expect(certificates.listAdmin).toHaveBeenCalledWith({});
  });

  it('generates a certificate for any enrollment with the acting admin id', () => {
    controller.request(actor, 'enrollment-1', { templateId: 't1' } as never);
    expect(certificates.adminRequest).toHaveBeenCalledWith(
      'admin-1',
      'enrollment-1',
      {
        templateId: 't1',
      },
    );
  });

  it('retries and regenerates a certificate', () => {
    controller.retry(actor, 'certificate-1');
    expect(certificates.retry).toHaveBeenCalledWith('admin-1', 'certificate-1');
    controller.regenerate(actor, 'certificate-1', {
      reason: 'Typo fix',
    } as never);
    expect(certificates.regenerate).toHaveBeenCalledWith(
      'admin-1',
      'certificate-1',
      {
        reason: 'Typo fix',
      },
    );
  });

  it('revokes a certificate, extracting the reason from the DTO', () => {
    controller.revoke(actor, 'certificate-1', { reason: 'Fraud' } as never);
    expect(certificates.revoke).toHaveBeenCalledWith(
      'admin-1',
      'certificate-1',
      'Fraud',
    );
  });

  it('downloads, lists files, downloads a file, lists events, and gets detail', () => {
    controller.download('certificate-1');
    expect(certificates.adminDownload).toHaveBeenCalledWith('certificate-1');
    controller.files('certificate-1');
    expect(certificates.files).toHaveBeenCalledWith('certificate-1');
    controller.fileDownload('certificate-1', 'file-1');
    expect(certificates.fileDownload).toHaveBeenCalledWith(
      'certificate-1',
      'file-1',
    );
    controller.events('certificate-1');
    expect(certificates.events).toHaveBeenCalledWith('certificate-1');
    controller.detail('certificate-1');
    expect(certificates.admin).toHaveBeenCalledWith('certificate-1');
  });
});

describe('CertificateTemplatesController', () => {
  const controller = new CertificateTemplatesController(certificates as never);

  it('lists and gets templates', () => {
    controller.list();
    expect(certificates.templates).toHaveBeenCalled();
    controller.detail('template-1');
    expect(certificates.template).toHaveBeenCalledWith('template-1');
  });

  it('creates a template with the acting admin id', () => {
    controller.create(actor, { name: 'Default' } as never);
    expect(certificates.createTemplate).toHaveBeenCalledWith('admin-1', {
      name: 'Default',
    });
  });

  it('updates a template', () => {
    controller.update('template-1', { name: 'Renamed' } as never);
    expect(certificates.updateTemplate).toHaveBeenCalledWith('template-1', {
      name: 'Renamed',
    });
  });

  it('activates and deactivates a template', () => {
    controller.activate('template-1');
    expect(certificates.activateTemplate).toHaveBeenCalledWith(
      'template-1',
      true,
    );
    controller.deactivate('template-1');
    expect(certificates.activateTemplate).toHaveBeenCalledWith(
      'template-1',
      false,
    );
  });
});
