import type { GenerationProduct } from '@sdkwork/react-commons';

const STORAGE_KEY_PRODUCT = 'film_shot_gen_product';

class FilmPreferencesService {
    getLastGenerationProduct(): string | null {
        if (typeof window === 'undefined') {
            return null;
        }
        return window.localStorage.getItem(STORAGE_KEY_PRODUCT);
    }

    setLastGenerationProduct(product: GenerationProduct): void {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(STORAGE_KEY_PRODUCT, product);
    }
}

export const filmPreferencesService = new FilmPreferencesService();
