import { Publication } from './entities/publication.entity';
import {
  PublicationDomainError,
  PublicationErrorCode,
} from './errors/publication-domain.error';
import { PublicationContent } from './value-objects/publication-content.value-object';
import { PublicationMediaUrls } from './value-objects/publication-media-urls.value-object';
import { PublicationTitle } from './value-objects/publication-title.value-object';

describe('Publication domain', () => {
  it('creates a base publication for an author without fitness linkage', () => {
    const publication = Publication.create({
      id: 'publication-1',
      authorUserId: 'user-1',
      title: PublicationTitle.create('Entrenamiento del dia'),
      content: PublicationContent.create('Hoy complete mi sesion.'),
    });

    expect(publication.id).toBe('publication-1');
    expect(publication.authorUserId).toBe('user-1');
    expect(publication.title.value).toBe('Entrenamiento del dia');
    expect(publication.content.value).toBe('Hoy complete mi sesion.');
    expect(publication.createdAt).toBeInstanceOf(Date);
  });

  it('rejects a publication without author', () => {
    expect(() =>
      Publication.create({
        id: 'publication-1',
        authorUserId: '',
        title: PublicationTitle.create('Titulo'),
        content: PublicationContent.create('Contenido'),
      }),
    ).toThrow(PublicationDomainError);

    try {
      Publication.create({
        id: 'publication-1',
        authorUserId: '',
        title: PublicationTitle.create('Titulo'),
        content: PublicationContent.create('Contenido'),
      });
    } catch (error) {
      expect((error as PublicationDomainError).code).toBe(
        PublicationErrorCode.PUBLICATION_AUTHOR_REQUIRED,
      );
    }
  });

  it('rejects empty title and content', () => {
    expect(() => PublicationTitle.create('   ')).toThrow(
      PublicationDomainError,
    );
    expect(() => PublicationContent.create('   ')).toThrow(
      PublicationDomainError,
    );
  });

  it('updates title and content without changing author', () => {
    const publication = Publication.create({
      id: 'publication-1',
      authorUserId: 'user-1',
      title: PublicationTitle.create('Titulo inicial'),
      content: PublicationContent.create('Contenido inicial'),
    });

    const updated = publication.update({
      title: PublicationTitle.create('Titulo actualizado'),
      content: PublicationContent.create('Contenido actualizado'),
    });

    expect(updated.id).toBe(publication.id);
    expect(updated.authorUserId).toBe('user-1');
    expect(updated.title.value).toBe('Titulo actualizado');
    expect(updated.content.value).toBe('Contenido actualizado');
    expect(updated.createdAt).toBe(publication.createdAt);
  });

  it('creates and updates publication media URLs', () => {
    const publication = Publication.create({
      id: 'publication-1',
      authorUserId: 'user-1',
      title: PublicationTitle.create('Titulo'),
      content: PublicationContent.create('Contenido'),
      mediaUrls: PublicationMediaUrls.create(['https://cdn.example.com/image-a.jpg']),
    });

    const updated = publication.update({
      mediaUrls: PublicationMediaUrls.create([
        'https://cdn.example.com/image-b.jpg',
      ]),
    });

    expect(publication.mediaUrls.values).toEqual([
      'https://cdn.example.com/image-a.jpg',
    ]);
    expect(updated.mediaUrls.values).toEqual([
      'https://cdn.example.com/image-b.jpg',
    ]);
  });

  it('rejects invalid publication media URLs', () => {
    expect(() => PublicationMediaUrls.create(['not-a-url'])).toThrow(
      PublicationDomainError,
    );
  });

  it('rejects ownership mismatch', () => {
    const publication = Publication.create({
      id: 'publication-1',
      authorUserId: 'user-1',
      title: PublicationTitle.create('Titulo'),
      content: PublicationContent.create('Contenido'),
    });

    expect(() => publication.ensureOwnedBy('user-2')).toThrow(
      PublicationDomainError,
    );

    try {
      publication.ensureOwnedBy('user-2');
    } catch (error) {
      expect((error as PublicationDomainError).code).toBe(
        PublicationErrorCode.PUBLICATION_NOT_OWNED,
      );
    }
  });
});
