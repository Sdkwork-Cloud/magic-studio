export interface AudioResourceFetchService {
  fetchArrayBuffer(url: string): Promise<ArrayBuffer>;
}

class AudioResourceFetchServiceImpl implements AudioResourceFetchService {
  async fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `[audioResourceFetchService] Failed to fetch resource (${response.status})`
      );
    }
    return response.arrayBuffer();
  }
}

const localAudioResourceFetchService: AudioResourceFetchService =
  new AudioResourceFetchServiceImpl();

let currentAudioResourceFetchService: AudioResourceFetchService =
  localAudioResourceFetchService;

export const audioResourceFetchService: AudioResourceFetchService = {
  fetchArrayBuffer: (url: string): Promise<ArrayBuffer> =>
    currentAudioResourceFetchService.fetchArrayBuffer(url)
};

export const setAudioResourceFetchServiceAdapter = (
  adapter: AudioResourceFetchService
): void => {
  currentAudioResourceFetchService = adapter;
};

export const getAudioResourceFetchServiceAdapter =
  (): AudioResourceFetchService => currentAudioResourceFetchService;

export const resetAudioResourceFetchServiceAdapter = (): void => {
  currentAudioResourceFetchService = localAudioResourceFetchService;
};
