import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExerciseCatalogMediaUrls1746000000018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const updates = [
      {
        id: '00000000-0000-4000-8000-000000000001',
        videoUrl: 'https://www.youtube.com/watch?v=4Y2ZdHCOXok',
        imageUrl: 'https://storage.endure.app/exercises/press-banca.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        videoUrl: 'https://www.youtube.com/watch?v=IP4oeKMx3VQ',
        imageUrl:
          'https://storage.endure.app/exercises/press-banca-inclinado.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000003',
        videoUrl: 'https://www.youtube.com/watch?v=eozdVDA78K0',
        imageUrl:
          'https://storage.endure.app/exercises/aperturas-mancuerna.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000004',
        videoUrl: 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
        imageUrl: 'https://storage.endure.app/exercises/sentadilla.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000005',
        videoUrl: 'https://www.youtube.com/watch?v=09duIahnWWI',
        imageUrl: 'https://storage.endure.app/exercises/sentadilla-frontal.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000006',
        videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
        imageUrl: 'https://storage.endure.app/exercises/prensa-piernas.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000007',
        videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
        imageUrl: 'https://storage.endure.app/exercises/peso-muerto.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000008',
        videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
        imageUrl: 'https://storage.endure.app/exercises/dominadas.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000009',
        videoUrl: 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ',
        imageUrl: 'https://storage.endure.app/exercises/remo-barra.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000010',
        videoUrl: 'https://www.youtube.com/watch?v=xQNrMVMvXAE',
        imageUrl: 'https://storage.endure.app/exercises/remo-polea-baja.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000011',
        videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
        imageUrl: 'https://storage.endure.app/exercises/press-militar.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000012',
        videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
        imageUrl:
          'https://storage.endure.app/exercises/elevaciones-laterales.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000013',
        videoUrl: 'https://www.youtube.com/watch?v=kwG2ipFRgfo',
        imageUrl: 'https://storage.endure.app/exercises/curl-biceps-barra.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000014',
        videoUrl: 'https://www.youtube.com/watch?v=zC3nLlVotJ8',
        imageUrl: 'https://storage.endure.app/exercises/curl-martillo.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000015',
        videoUrl: 'https://www.youtube.com/watch?v=vB5OHsJ3eQE',
        imageUrl:
          'https://storage.endure.app/exercises/extensiones-triceps-polea.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000016',
        videoUrl: 'https://www.youtube.com/watch?v=2z8JmcrW-As',
        imageUrl: 'https://storage.endure.app/exercises/fondos-paralelas.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000017',
        videoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
        imageUrl: 'https://storage.endure.app/exercises/plancha.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000018',
        videoUrl: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU',
        imageUrl: 'https://storage.endure.app/exercises/crunch-abdominal.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000019',
        videoUrl: 'https://www.youtube.com/watch?v=7AaaYhMqmhY',
        imageUrl: 'https://storage.endure.app/exercises/peso-muerto-rumano.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000020',
        videoUrl: 'https://www.youtube.com/watch?v=1Tq3QF6z5yY',
        imageUrl: 'https://storage.endure.app/exercises/curl-piernas.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000021',
        videoUrl: 'https://www.youtube.com/watch?v=YMmgE9h78WA',
        imageUrl: 'https://storage.endure.app/exercises/elevacion-talones.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000022',
        videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
        imageUrl: 'https://storage.endure.app/exercises/face-pull.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000023',
        videoUrl: 'https://www.youtube.com/watch?v=YSxHifyI6s8',
        imageUrl: 'https://storage.endure.app/exercises/swing-pesa-rusa.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000024',
        videoUrl: null,
        imageUrl: 'https://storage.endure.app/exercises/carrera-cinta.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000025',
        videoUrl: 'https://www.youtube.com/watch?v=auBLPXO8Fww',
        imageUrl: 'https://storage.endure.app/exercises/burpees.jpg',
      },
    ];

    for (const ex of updates) {
      await queryRunner.query(
        `UPDATE exercise_catalog SET "videoUrl" = $1, "imageUrl" = $2 WHERE id = $3`,
        [ex.videoUrl, ex.imageUrl, ex.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE exercise_catalog SET "videoUrl" = NULL, "imageUrl" = NULL WHERE CAST(id AS TEXT) LIKE '00000000-0000-4000-8000-%'`,
    );
  }
}
