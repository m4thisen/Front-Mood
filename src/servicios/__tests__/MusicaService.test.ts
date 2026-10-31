import { describe, expect, it, jest } from '@jest/globals';
import type { ApiClient } from '@/api/ApiClient';
import { Cancion } from '@/dominio';
import { MusicaService } from '../MusicaService';

const gracias: Cancion = { spotifyId: '0VSgPLNeJ8qMaYGhRQpUZu', titulo: 'Gracias a la vida', artista: 'Mercedes Sosa', portadaUrl: null };

function apiFalsa(canciones: Cancion[]) {
  const get = jest.fn(async (_ruta: string) => ({ canciones }));
  return { api: { get } as unknown as Pick<ApiClient, 'get'>, get };
}

describe('MusicaService', () => {
  it('busca en el servidor con el texto codificado', async () => {
    const { api, get } = apiFalsa([gracias]);

    expect(await new MusicaService(api).buscar('  gracias a la vida & más ')).toEqual([gracias]);
    expect(get).toHaveBeenCalledWith('/musica/buscar?q=gracias%20a%20la%20vida%20%26%20m%C3%A1s');
  });

  it('con menos de dos letras no busca', async () => {
    const { api, get } = apiFalsa([gracias]);

    expect(await new MusicaService(api).buscar(' a ')).toEqual([]);
    expect(get).not.toHaveBeenCalled();
  });

  it('descarta resultados sin identificador de Spotify o sin título', async () => {
    const { api } = apiFalsa([gracias, { ...gracias, spotifyId: '' }, { ...gracias, titulo: '' }]);

    expect(await new MusicaService(api).buscar('gracias')).toEqual([gracias]);
  });
});
